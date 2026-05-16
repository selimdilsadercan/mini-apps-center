import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Stealth plugin ekle
puppeteer.use(StealthPlugin());

async function scrapeGetir(url: string) {
  let browser = null;

  // Supabase bağlantısı (İsteğe bağlı)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  try {
    console.log(`🚀 Getir scraping başlatılıyor: ${url}`);
    
    browser = await puppeteer.launch({
      headless: true, // Artık temiz çalışması için kapalı (headless) moda aldım
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    
    console.log("🌐 Sayfaya gidiliyor...");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    
    console.log("🖱️ Sayfa kaydırılıyor (Lazy load)...");
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        let distance = 400;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight || totalHeight > 4000) {
            clearInterval(timer);
            resolve(true);
          }
        }, 100);
      });
    });

    console.log("🔍 Ürünler taranıyor...");
    const products = await page.evaluate(() => {
      const itemsMap = new Map();
      const articles = document.querySelectorAll('article');
      
      articles.forEach(article => {
        const allTextElements = article.querySelectorAll('[data-testid="text"]');
        let name = "";
        let price = "";
        
        const texts: string[] = [];
        allTextElements.forEach(el => {
          const t = el.textContent?.trim() || "";
          if (t) texts.push(t);
        });

        const priceTexts = texts.filter(t => t.includes("TL"));
        if (priceTexts.length > 0) {
          const cleanPrice = priceTexts.find(t => !t.includes("/"));
          if (cleanPrice) price = cleanPrice;
          else price = priceTexts[0].replace(/\(|\)|\/adet/g, "").trim();
        }

        const weightElem = article.querySelector('[data-testid="paragraph"] p');
        const weightText = weightElem?.textContent?.trim() || "";

        const isMultiPack = weightText.includes("x") || weightText.includes("Adet") || weightText.includes("Ürün");
        const isSingleProduct = weightText.toLowerCase().includes("g") && !isMultiPack;

        if (!isSingleProduct) return;

        const nameTexts = texts.filter(t => !t.includes("TL") && !t.includes("/") && t !== weightText);
        if (nameTexts.length > 0) {
          name = nameTexts.sort((a, b) => b.length - a.length)[0];
        }
                         
        // RESIM SECIMI: Badge olmayan, asıl ürün resmini bul
        const allImages = Array.from(article.querySelectorAll('img'));
        const productImg = allImages.find(img => {
          const src = img.getAttribute('src') || img.src || "";
          // Getir'de asıl ürünler /product/ klasöründedir, /badge/ klasöründekiler logodur.
          return src.includes("/product/") && !src.includes("/badge/");
        });

        const finalImg = productImg || allImages[0];
        
        if (name && finalImg) {
          const imgSrc = finalImg.getAttribute('src') || finalImg.src || "";
          
          // Isme gore tekillestir (Map kullanarak)
          if (!itemsMap.has(name)) {
            itemsMap.set(name, {
              name: name,
              price: price,
              weight: weightText,
              image_url: imgSrc
            });
          }
        }
      });
      
      return Array.from(itemsMap.values());
    });

    console.log(`✅ ${products.length} tekil ürün bulundu.`);

    // 1. Dosyaya kaydet (Yeni konuma: data/ klasörü)
    // Script chocolate-db/scrape/ içinde olduğu için .. ile bir üst klasöre çıkıp data'ya giriyoruz
    const outputPath = path.join(process.cwd(), "chocolate-db", "data", "getir_products.json");
    
    // Klasör yoksa oluştur
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2), "utf-8");
    console.log(`📂 Veriler dosyaya kaydedildi: ${outputPath}`);

    // 2. Veritabanına kaydet (Eğer anahtarlar varsa)
    if (supabase && products.length > 0) {
      console.log("💾 Veritabanına aktarılıyor...");
      const { error } = await supabase
        .schema("chocolate_db")
        .from("chocolates")
        .upsert(products.map(p => ({
          name: p.name,
          image_url: p.image_url
          // Not: Tablonuzda price veya weight kolonu varsa buraya ekleyebilirsiniz.
        })), { onConflict: "name" });

      if (error) console.error("❌ Veritabanı hatası:", error.message);
      else console.log("✨ Tüm ürünler veritabanına başarıyla aktarıldı!");
    } else {
      console.log("ℹ️ Supabase anahtarları bulunamadı, veritabanı işlemi atlandı.");
    }

    console.log("\n🎉 İşlem başarıyla tamamlandı!");

  } catch (error: any) {
    console.error("❌ Hata oluştu:", error.message);
  } finally {
    if (browser) await browser.close();
  }
}

const targetUrl = process.argv[2] || "https://getir.com/kategori/atistirmalik-BaaxwkyV1y/";
scrapeGetir(targetUrl);
