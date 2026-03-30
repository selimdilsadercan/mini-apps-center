import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Stealth plugin ekle - Instagram'ın bot detection'ını bypass etmek için
puppeteer.use(StealthPlugin());

const TEST_URL =
  "http://instagram.com/nefisyemektarifleri/reel/DSGB7hkDUP8/";

async function scrapeInstagramWithPuppeteer(url: string) {
  let browser = null;

  try {
    console.log("🚀 Launching browser...");

    browser = await puppeteer.launch({
      headless: false, // false yaparsanız browser'ı görebilirsiniz
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    const page = await browser.newPage();

    // Viewport ayarla
    await page.setViewport({ width: 1920, height: 1080 });

    // Extra headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    console.log("📱 Navigating to:", url);

    // Sayfaya git
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    console.log("✅ Page loaded, waiting for content...");

    // Instagram'ın dynamic content yüklemesini bekle
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 3'ten 5'e çıkardık

    // Screenshot al debug için
    await page.screenshot({ path: "instagram-page.png" });
    console.log("📸 Screenshot saved to instagram-page.png");

    console.log("🔍 Extracting data from page...");

    // Sayfadan veriyi çıkar
    const data = await page.evaluate(() => {
      // DOM'dan meta tag'leri kontrol et
      const metaDescription = document
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content");
      const metaTitle = document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content");

      // JSON-LD script tag'lerini bul
      const scriptTags = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]')
      );
      let jsonLdData = null;

      for (const script of scriptTags) {
        try {
          const data = JSON.parse((script as any).textContent || "");
          if (data && (data["@type"] === "VideoObject" || data.caption)) {
            jsonLdData = data;
            break;
          }
        } catch (e) {
          // ignore
        }
      }

      // DOĞRU YAKLAŞIM: Caption span[style*="line-height"] içinde
      // Test sonucu: index 0 = hesap adı, index 3 = caption
      let fullCaption = "";
      const debugInfo: any = {};
      
      const captionSpans = document.querySelectorAll('span[style*="line-height: 18px"]');
      
      debugInfo.spanCount = captionSpans.length;
      debugInfo.allSpans = [];
      
      // Tüm span'ları array'e ekle ve debug et
      captionSpans.forEach((span: any, index: number) => {
        let html = span.innerHTML;
        
        // HTML'i temizle
        html = html.replace(/<br\s*\/?>/gi, '\n');
        html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
        html = html.replace(/<[^>]+>/g, '');
        
        const textarea = document.createElement('textarea');
        textarea.innerHTML = html;
        const cleanText = textarea.value.trim();
        
        debugInfo.allSpans.push({
          index,
          length: cleanText.length,
          preview: cleanText.substring(0, 150)
        });
      });
      
      // Index 3'ü al (caption burada)
      if (captionSpans.length > 3) {
        const captionSpan = captionSpans[3] as any;
        let html = captionSpan.innerHTML;
        
        html = html.replace(/<br\s*\/?>/gi, '\n');
        html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
        html = html.replace(/<[^>]+>/g, '');
        
        const textarea = document.createElement('textarea');
        textarea.innerHTML = html;
        fullCaption = textarea.value.trim();
        
        debugInfo.foundVia = "index3";
        debugInfo.selectedIndex = 3;
        debugInfo.spanFound = true;
      } else {
        // Fallback: eğer 4'ten az span varsa en uzununu al
        if (captionSpans.length > 0) {
          let maxLength = 0;
          let maxIndex = 0;
          
          debugInfo.allSpans.forEach((span: any, i: number) => {
            if (span.length > maxLength) {
              maxLength = span.length;
              maxIndex = i;
            }
          });
          
          const longestSpan = captionSpans[maxIndex] as any;
          let html = longestSpan.innerHTML;
          
          html = html.replace(/<br\s*\/?>/gi, '\n');
          html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
          html = html.replace(/<[^>]+>/g, '');
          
          const textarea = document.createElement('textarea');
          textarea.innerHTML = html;
          fullCaption = textarea.value.trim();
          
          debugInfo.foundVia = "fallback_longest";
          debugInfo.selectedIndex = maxIndex;
          debugInfo.spanFound = true;
        } else {
          debugInfo.spanFound = false;
        }
      }

      debugInfo.fullCaptionLength = fullCaption.length;
      debugInfo.fullCaptionPreview = fullCaption.substring(0, 200);

      return {
        metaDescription,
        metaTitle,
        jsonLdData,
        fullCaption,
        pageTitle: document.title,
        debugInfo,
      };
    });

    console.log("\n========== DEBUG INFO ==========");
    console.log("Caption span found:", data.debugInfo.spanFound);
    console.log("Found via:", data.debugInfo.foundVia);
    console.log("Caption length:", data.debugInfo.fullCaptionLength);
    console.log("================================\n");

    console.log("\n========== RESULTS ==========");

    let caption = "";
    let username = "";

    // Farklı kaynaklardan caption'u bulmaya çalış
    if (data.jsonLdData?.caption) {
      caption = data.jsonLdData.caption;
      username = data.jsonLdData.author?.name || "";
      console.log("✅ Found via JSON-LD");
    } else if (data.fullCaption) {
      caption = data.fullCaption;
      console.log("✅ Found via DOM extraction");
    } else if (data.metaDescription) {
      caption = data.metaDescription;
      console.log("✅ Found via meta description (may be truncated)");
    }

    console.log("Username:", username || "NOT FOUND");
    console.log("Caption length:", caption.length);
    console.log("\n========== FULL CAPTION ==========");
    console.log(caption);
    console.log("==================================");
    console.log("=============================\n");

    if (!caption) {
      console.log("\n========== DEBUG INFO ==========");
      console.log("Page title:", data.pageTitle);
      console.log("Meta description:", data.metaDescription);
      console.log("Meta title:", data.metaTitle);
      console.log("Full caption:", data.fullCaption);
      console.log("JSON-LD:", data.jsonLdData);
      console.log("================================\n");

      console.error("⚠️ Caption bulunamadı! Debug bilgilerini kontrol edin.");
      
      // Screenshot al (hata ayıklama için)
      await page.screenshot({ path: "instagram-debug.png" });
      console.log("📸 Screenshot saved to instagram-debug.png");
    } else {
      console.log("🎉 SUCCESS! Caption found.");
    }

    return {
      success: !!caption,
      caption,
      username,
    };
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }
  }
}

// Test'i çalıştır
console.log("🚀 Starting Puppeteer Instagram scraper test...\n");
scrapeInstagramWithPuppeteer(TEST_URL)
  .then((result) => {
    console.log("\n✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
