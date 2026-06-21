import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildGradlePath = path.join(__dirname, "..", "android", "app", "build.gradle");
const outputDir = path.join(__dirname, "..", "versions");

async function main() {
  try {
    // 1. Klasör yoksa oluştur
    if (!fs.existsSync(outputDir)) {
      console.log(`📁 Klasör oluşturuluyor: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 2. build.gradle'dan versiyon ve build numarasını oku
    const buildGradleContent = fs.readFileSync(buildGradlePath, "utf8");
    const versionCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
    const versionNameMatch = buildGradleContent.match(/versionName\s+"([^"]+)"/);

    if (!versionCodeMatch || !versionNameMatch) {
      console.error("❌ Versiyon bilgisi build.gradle içinde bulunamadı!");
      process.exit(1);
    }

    const buildNumber = versionCodeMatch[1];
    const version = versionNameMatch[1];
    const fileName = `everything_v${version}_b${buildNumber}.zip`;
    const fullPath = path.join(outputDir, fileName);

    console.log(`🚀 Build başlatılıyor: v${version} (Build: ${buildNumber})`);

    // 3. Next.js Build
    console.log("🏗️ Next.js export ediliyor...");
    execSync("npm run build", { stdio: "inherit", cwd: path.join(__dirname, "..") });

    // 4. Zip oluştur (Sistemdeki zip komutunu kullanarak, ESM sorunlarını aşmak için)
    console.log(`📦 Zip oluşturuluyor: ${fileName}`);
    const outDir = path.join(__dirname, "..", "out");
    
    try {
      // Hedef dosya varsa sil (bozuk zip hatasını önlemek için)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      // out klasörünün içine girip oradaki her şeyi zip'liyoruz
      execSync(`cd "${outDir}" && zip -rq "${fullPath}" .`, { stdio: "inherit" });
      
      const stats = fs.statSync(fullPath);
      console.log(`   📊 Toplam boyut: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (zipErr: any) {
      console.error("❌ Zip oluşturma hatası:", zipErr.message);
      process.exit(1);
    }

    console.log(`\n✅ Zip Hazır!`);
    console.log(`📍 Konum: ${fullPath}`);

    // 5. Cloudflare R2'ye Yükle
    const rl = (await import("readline")).createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const quest = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.R2_ENDPOINT;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    let fullUrl = "";

    if (accessKeyId && secretAccessKey && endpoint && bucketName) {
      const confirmUpload = await quest(`\n☁️ Cloudflare R2'ye otomatik yüklemek istiyor musun? (Y/n): `);
      if (confirmUpload.toLowerCase() !== "n") {
        console.log("📤 R2'ye yükleniyor...");
        
        const s3Client = new S3Client({
          region: "auto",
          endpoint: endpoint,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
          },
        });

        const fileStream = fs.createReadStream(fullPath);
        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: bucketName,
            Key: `updates/${fileName}`,
            Body: fileStream,
            ContentType: "application/zip",
          },
        });

        upload.on("httpUploadProgress", (progress) => {
          if (progress.loaded && progress.total) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            process.stdout.write(`\r   📊 Yükleme: %${percent}`);
          }
        });

        await upload.done();
        console.log(`\n✅ Yükleme başarılı!`);
        fullUrl = `${publicUrlBase}/updates/${fileName}`;
      }
    }

    if (!fullUrl) {
      console.log("\n--------------------------------------------------");
      console.log("Sıradaki Adım: Bu zip dosyasını Cloudflare R2'ye yükle.");
      const suggestedPath = `updates/${fileName}`;
      console.log(`💡 Önerilen Cloudflare yolu: ${suggestedPath}`);
      const manualUrl = await quest(`Yüklediğin dosyanın tam URL'ini yaz (iptal için 'n'): `);
      if (manualUrl.toLowerCase() !== "n") {
        fullUrl = manualUrl.trim();
      }
    }

    if (fullUrl) {
      // Beta Sorusu
      const isBetaInput = await quest(`Bu bir BETA build mi? (y/n, varsayılan n): `);
      const isBeta = isBetaInput.toLowerCase() === "y" || isBetaInput.toLowerCase() === "e";

      // Not Sorusu
      const customNotes = await quest(`Versiyon notları (boş bırakılırsa "Otomatik Build" yazılır): `);
      const finalNotes = customNotes.trim() || `Otomatik Build: v${version}`;

      console.log(`🔗 Encore'a kaydediliyor: ${fullUrl} ${isBeta ? "[BETA]" : "[PRODUCTION]"}`);
      try {
        const stagingUrl = "https://staging-mini-apps-center-8u7i.encr.app";

        const response = await fetch(`${stagingUrl}/ota/bundle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": "valla-billah-benim-admin-key"
          },
          body: JSON.stringify({
            version: version,
            buildNumber: parseInt(buildNumber, 10),
            bundleUrl: fullUrl,
            platform: "all",
            isBeta: isBeta,
            notes: finalNotes
          })
        });

        const responseData = (await response.json()) as any;

        if (response.ok && responseData.success) {
          console.log("✨ Başarıyla Encore Staging aracılığıyla Supabase'e kaydedildi!");
          console.log(`✅ Kayıt Bilgisi: v${version} (Build: ${buildNumber})`);
        } else {
          console.error("❌ Kayıt Başarısız!");
          console.error(`Durum Kodu: ${response.status}`);
          console.error("Detay:", responseData.error || responseData.message || (typeof responseData === 'object' ? JSON.stringify(responseData) : responseData) || "Bilinmeyen hata");
          
          if (response.status === 404) {
            console.log("💡 İpucu: 'ota' servisi henüz staging ortamına deploy edilmemiş olabilir.");
          }
        }
      } catch (e: any) {
        console.error("❌ Encore Staging Sunucusuna Erişilemedi!");
        console.error("Hata Mesajı:", e.message);
      }
    } else {
      console.log("⏩ Kayıt adımı atlandı.");
    }

    rl.close();
  } catch (error: any) {
    console.error("❌ Hata:", error.message);
    process.exit(1);
  }
}

main();
