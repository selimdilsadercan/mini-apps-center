import { api } from "encore.dev/api";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

declare const document: any;

// Stealth plugin ekle - Instagram'ın bot detection'ını bypass etmek için
puppeteer.use(StealthPlugin());

interface ScrapeReelsRequest {
  url: string;
}

interface ScrapeReelsResponse {
  success: boolean;
  caption?: string;
  error?: string;
  username?: string;
  thumbnail?: string;
}

/**
 * Scrapes Instagram Reels caption using Puppeteer
 * No authentication required - uses browser automation
 */
export const scrapeInstagramReel = api(
  { expose: true, method: "POST", path: "/scrape/instagram/reels" },
  async (req: ScrapeReelsRequest): Promise<ScrapeReelsResponse> => {
    let browser = null;

    try {
      // Validate URL
      if (!req.url || !isValidInstagramReelsUrl(req.url)) {
        return {
          success: false,
          error: "Geçersiz Instagram Reels URL'si",
        };
      }

      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-web-security",
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      });

      const page = await browser.newPage();

      // Konsol loglarını terminale yönlendir
      page.on("console", (msg) => {
        console.log(`[BROWSER] ${msg.text()}`);
      });

      // Viewport ayarla
      await page.setViewport({ width: 1920, height: 1080 });

      // Extra headers
      await page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
      });



      // Sayfaya git
      await page.goto(req.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });



      // Instagram'ın dynamic content yüklemesini bekle
      await new Promise((resolve) => setTimeout(resolve, 3000));



      // Sayfadan veriyi çıkar
      const data = await page.evaluate(() => {
        console.log("Evaluating page...");
        // DOM'dan meta tag'leri kontrol et (username ve image için)
        const metaTitle = document
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content");
        
        const metaImage = document
          .querySelector('meta[property="og:image"]')
          ?.getAttribute("content");

        console.log("Meta Title:", metaTitle);
        console.log("Meta Image:", metaImage);

        // Caption: span[style*="line-height: 18px"] elementinin index 3'ü
        // Test sonucu: index 0 = hesap adı, index 3 = caption
        let fullCaption = "";
        
        const captionSpans = document.querySelectorAll('span[style*="line-height: 18px"]');
        console.log("Found caption spans:", captionSpans.length);
        
        // Diğer olası selector'lar
        const h1Caption = document.querySelector('h1');
        if (h1Caption) console.log("Found H1 caption:", h1Caption.textContent?.substring(0, 50));

        const altCaption = document.querySelector('article span._ap3a'); // Yeni Instagram class'ı
        if (altCaption) console.log("Found alt span caption:", altCaption.textContent?.substring(0, 50));

        // Index 3'ü al (caption burada)
        if (captionSpans.length > 3) {
          const captionSpan = captionSpans[3] as any;
          let html = captionSpan.innerHTML;
          
          // HTML temizleme
          html = html.replace(/<br\s*\/?>/gi, '\n');
          html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '$1');
          html = html.replace(/<[^>]+>/g, '');
          
          const textarea = document.createElement('textarea');
          textarea.innerHTML = html;
          fullCaption = textarea.value.trim();
        } else if (h1Caption) {
          fullCaption = h1Caption.textContent?.trim() || "";
        } else if (altCaption) {
          fullCaption = altCaption.textContent?.trim() || "";
        } else if (captionSpans.length > 0) {
          // Fallback: eğer 4'ten az span varsa en uzununu al
          let maxLength = 0;
          let maxIndex = 0;
          
          captionSpans.forEach((span: any, i: number) => {
            const text = span.textContent?.trim() || "";
            if (text.length > maxLength) {
              maxLength = text.length;
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
        }

        return {
          metaTitle,
          metaImage,
          fullCaption,
          pageTitle: document.title,
        };
      });

      let caption = "";
      let username = "";
      let thumbnail = "";

      // Thumbnail'i meta tag'den al
      if (data.metaImage) {
        thumbnail = data.metaImage;
      }

      // Caption'u fullCaption'dan al
      if (data.fullCaption) {
        caption = data.fullCaption;
      } else if (data.metaTitle) {
        // Fallback: metaTitle'dan caption'ı çıkar
        // Format: "Username on Instagram: \"Caption\""
        const captionMatch = data.metaTitle.match(/^.+?\s+on Instagram:\s*"([\s\S]+)"$/);
        if (captionMatch) {
          caption = captionMatch[1];
        } else {
          // Eğer tırnak içinde değilse ama "on Instagram:" varsa sonrasını al
          const parts = data.metaTitle.split("on Instagram:");
          if (parts.length > 1) {
            caption = parts[1].trim().replace(/^"|"$/g, "");
          }
        }
      }

      // Username'i title'dan çıkar
      if (data.metaTitle) {
        const match = data.metaTitle.match(/^(.+?)\s+on Instagram:/);
        if (match) {
          username = match[1];
        }
      }

      if (!caption) {
        return {
          success: false,
          error:
            "Caption bulunamadı. Post private olabilir veya Instagram yapısı değişmiş olabilir.",
          username,
          thumbnail,
        };
      }

      return {
        success: true,
        caption,
        username,
        thumbnail,
      };
    } catch (error: any) {
      console.error("❌ Instagram scraping error:", error.message);

      if (error.message.includes("net::ERR_NAME_NOT_RESOLVED")) {
        return {
          success: false,
          error: "İnternet bağlantısı hatası. Lütfen tekrar deneyin.",
        };
      }

      if (error.message.includes("Timeout")) {
        return {
          success: false,
          error: "Instagram çok yavaş yanıt veriyor. Lütfen tekrar deneyin.",
        };
      }

      return {
        success: false,
        error: `Scraping hatası: ${error.message}`,
      };
    } finally {
      if (browser) {
        await browser.close();

      }
    }
  }
);

/**
 * Instagram Reels URL formatını kontrol eder
 * Desteklenen formatlar:
 * - /reel/ID/
 * - /username/reel/ID/
 * - /p/ID/
 * - /reels/ID/
 */
function isValidInstagramReelsUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Hostname kontrolü
    if (urlObj.hostname !== "www.instagram.com" && urlObj.hostname !== "instagram.com") {
      return false;
    }
    
    const path = urlObj.pathname;
    
    // Desteklenen path formatları
    return (
      path.startsWith("/reel/") ||
      path.startsWith("/p/") ||
      path.startsWith("/reels/") ||
      path.includes("/reel/") || // /username/reel/ID için
      path.includes("/p/")        // /username/p/ID için
    );
  } catch {
    return false;
  }
}

