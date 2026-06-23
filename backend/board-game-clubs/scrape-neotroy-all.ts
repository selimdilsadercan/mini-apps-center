import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

// Stealth plugin ekle
puppeteer.use(StealthPlugin());

async function run() {
  let browser = null;
  try {
    console.log("🚀 NeoTroy Games tüm oyunları tarama işlemi başlatılıyor...");

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });

    const allGames: any[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      console.log(`\n📄 Sayfa ${currentPage} taranıyor...`);
      const url = `https://neotroygames.com/kutu-oyunlari/page/${currentPage}/`;
      
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      } catch (err) {
        console.log(`⚠️ Sayfa ${currentPage} yüklenirken hata oluştu veya sayfa yok. İşlem sonlandırılıyor.`);
        hasNextPage = false;
        break;
      }

      const pageData = await page.evaluate(() => {
        const products = document.querySelectorAll("li.product, .rt-product-block");
        const results: any[] = [];
        
        products.forEach(product => {
          const titleEl = product.querySelector(".rt-title a, .woocommerce-loop-product__title, h3 a");
          const title = titleEl?.textContent?.trim() || "";
          const img = product.querySelector("img");
          const imageUrl = img?.getAttribute("data-src") || 
                          img?.getAttribute("src") || 
                          img?.getAttribute("data-lazy-src");
          
          if (title && imageUrl && !imageUrl.includes("data:image") && !imageUrl.toLowerCase().includes("logo")) {
            results.push({ title, imageUrl });
          }
        });

        // Sonraki sayfa kontrolü
        const nextButton = document.querySelector("a.next, .next.page-numbers");
        return { results, hasNext: !!nextButton };
      });

      if (pageData.results.length === 0) {
        console.log("📭 Bu sayfada ürün bulunamadı. Tarama bitti.");
        hasNextPage = false;
      } else {
        allGames.push(...pageData.results);
        console.log(`✅ ${pageData.results.length} oyun eklendi. Toplam: ${allGames.length}`);
        
        // Ara kayıt
        const outputPath = path.join(process.cwd(), "backend", "board-game-clubs", "neotroy-games.json");
        fs.writeFileSync(outputPath, JSON.stringify(allGames, null, 2));
        
        hasNextPage = pageData.hasNext;
        currentPage++;
        
        // Rate limit için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🎉 Tarama tamamlandı! Toplam ${allGames.length} oyun bulundu.`);
    const finalPath = path.join(process.cwd(), "backend", "board-game-clubs", "neotroy-games.json");
    console.log(`📂 Tüm veriler kaydedildi: ${finalPath}`);

  } catch (error: any) {
    console.error("❌ Beklenmedik hata:", error.message);
  } finally {
    if (browser) await browser.close();
  }
}

run();
