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
    
    const localHtmlPath = path.join(__dirname, "getir.html");
    const useLocal = fs.existsSync(localHtmlPath);
    
    if (useLocal) {
      console.log(`📂 Yerel HTML dosyası bulundu: ${localHtmlPath}`);
      console.log("🌐 Yerel HTML içeriği yükleniyor...");
      const htmlContent = fs.readFileSync(localHtmlPath, "utf-8");
      await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });
    } else {
      console.log("🌐 Sayfaya gidiliyor...");
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    }
    
    console.log(useLocal ? "🔍 Yerel HTML taranıyor..." : "🖱️ Sayfa kaydırılıyor ve ürünler taranıyor (Lazy-load & On-the-fly)...");
    const result = await page.evaluate(async (isLocal) => {
      const itemsMap = new Map();
      
      const runExtraction = () => {
        // Scrape visible items
        const elements = document.querySelectorAll('h5[data-testid="title"], article');
        let currentCategory = "Diğer";
        
        elements.forEach(el => {
          if (el.tagName.toLowerCase() === 'h5') {
            const breadcrumbItems = el.querySelectorAll('[data-testid="breadcrumb-item"]');
            if (breadcrumbItems.length > 0) {
              const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
              currentCategory = lastItem.textContent?.trim() || "Diğer";
            } else {
              currentCategory = el.textContent?.trim() || "Diğer";
            }
          } else if (el.tagName.toLowerCase() === 'article') {
            const allTextElements = el.querySelectorAll('[data-testid="text"]');
            let name = "";
            let price = "";
            
            const texts: string[] = [];
            allTextElements.forEach(item => {
              const t = item.textContent?.trim() || "";
              if (t) texts.push(t);
            });

            const priceTexts = texts.filter(t => t.includes("TL"));
            if (priceTexts.length > 0) {
              const cleanPrice = priceTexts.find(t => !t.includes("/"));
              if (cleanPrice) price = cleanPrice;
              else price = priceTexts[0].replace(/\(|\)|\/adet/g, "").trim();
            }

            const weightElem = el.querySelector('[data-testid="paragraph"] p');
            const weightText = weightElem?.textContent?.trim() || "";

            const isMultiPack = weightText.includes("x") || weightText.includes("Adet") || weightText.includes("Ürün");
            const isSingleProduct = weightText.toLowerCase().includes("g") && !isMultiPack;

            if (!isSingleProduct) return;

            const nameTexts = texts.filter(t => !t.includes("TL") && !t.includes("/") && t !== weightText);
            if (nameTexts.length > 0) {
              name = nameTexts.sort((a, b) => b.length - a.length)[0];
            }
                             
            // Image extraction
            const allImages = Array.from(el.querySelectorAll('img'));
            const productImg = allImages.find(img => {
              const src = img.getAttribute('src') || img.getAttribute('data-src') || img.src || "";
              return src && !src.includes("/badge/") && !src.includes("badge") && !src.includes("data:image");
            });

            const finalImg = productImg || allImages.find(img => {
              const src = img.getAttribute('src') || img.getAttribute('data-src') || img.src || "";
              return src && !src.includes("/badge/") && !src.includes("badge") && !src.includes("data:image") && src.length > 0;
            });
            
            if (name && finalImg) {
              const imgSrc = finalImg.getAttribute('src') || finalImg.getAttribute('data-src') || finalImg.src || "";
              
              // Exclude invalid/placeholder/relative paths
              if (imgSrc && (imgSrc.startsWith("http") || imgSrc.startsWith("//"))) {
                const existing = itemsMap.get(name);
                if (!existing || (existing.image_url.includes("placeholder") && !imgSrc.includes("placeholder"))) {
                  itemsMap.set(name, {
                    name: name,
                    price: price,
                    weight: weightText,
                    image_url: imgSrc,
                    category: currentCategory
                  });
                }
              }
            }
          }
        });
      };

      if (isLocal) {
        // If local HTML is loaded, just extract directly without scrolling
        runExtraction();
      } else {
        await new Promise((resolve) => {
          let totalHeight = 0;
          let distance = 400;
          let lastScrollHeight = 0;
          let sameHeightCount = 0;
          
          let timer = setInterval(() => {
            let scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            runExtraction();

            if (scrollHeight === lastScrollHeight) {
              sameHeightCount++;
            } else {
              sameHeightCount = 0;
              lastScrollHeight = scrollHeight;
            }
            
            // Wait up to 35 same ticks (approx 5.2 seconds) to load more products
            if (sameHeightCount > 35 || totalHeight > 180000) {
              clearInterval(timer);
              resolve(true);
            }
          }, 150);
        });
      }

      const totalArticles = document.querySelectorAll('article').length;
      const totalHeaders = document.querySelectorAll('h5[data-testid="title"]').length;
      
      return {
        totalArticles,
        totalHeaders,
        products: Array.from(itemsMap.values())
      };
    }, useLocal);

    const products = result.products;
    console.log(`📊 Tarama Özeti: DOM'da toplam ${result.totalHeaders} kategori başlığı ve ${result.totalArticles} ürün kartı (article) bulundu.`);
    
    const catCounts: { [key: string]: number } = {};
    products.forEach(p => {
        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });
    console.log("📂 Kategorilere Göre Dağılım:", catCounts);
    console.log(`✅ Filtreler sonrasında ${products.length} tekil ürün dosyaya yazılıyor.`);

    // 1. Dosyaya kaydet (Yeni konuma: data/ klasörü)
    // Script chocolate-db/scrape/ içinde olduğu için .. ile bir üst klasöre çıkıp data'ya giriyoruz
    const outputPath = path.join(__dirname, "..", "data", "products.json");
    
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
