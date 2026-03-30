import { api } from "encore.dev/api";
import axios from "axios";

interface ScrapeYouTubeShortRequest {
  url: string;
}

interface ScrapeYouTubeShortResponse {
  success: boolean;
  title?: string;
  description?: string;
  error?: string;
  author?: string;
  thumbnail?: string;
}

/**
 * Scrapes YouTube Shorts using oEmbed API
 * No authentication required
 */
export const scrapeYouTubeShort = api(
  { expose: true, method: "POST", path: "/scrape/youtube/shorts" },
  async (req: ScrapeYouTubeShortRequest): Promise<ScrapeYouTubeShortResponse> => {
    let browser = null;

    try {
      // Validate URL
      if (!req.url || !isValidYouTubeShortUrl(req.url)) {
        return {
          success: false,
          error: "Geçersiz YouTube Shorts URL'si",
        };
      }

      // 1. İlk önce oEmbed'den temel bilgileri al (hızlı)
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        req.url
      )}&format=json`;

      let title = "";
      let author = "";
      let thumbnail = "";

      try {
        const response = await axios.get(oembedUrl, {
          timeout: 5000,
        });
        
        title = response.data.title || "";
        author = response.data.author_name || "";
        thumbnail = response.data.thumbnail_url || "";
      } catch (error: any) {
        // oEmbed başarısız olursa devam et, Puppeteer'dan alacağız
        console.error("oEmbed failed, will use Puppeteer:", error.message);
      }

      // 2. Puppeteer ile description'ı al
      const puppeteer = (await import("puppeteer-extra")).default;
      const StealthPlugin = (await import("puppeteer-extra-plugin-stealth")).default;
      
      puppeteer.use(StealthPlugin());

      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(req.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Sayfanın yüklenmesini bekle
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Description'ı expand etmek için tıklamalar
      try {
        // 1. Video title'a tıkla (description panel açılır)
        const titleSelector = 'yt-shorts-video-title-view-model h2, .ytShortsVideoTitleViewModelShortsVideoTitle';
        await page.waitForSelector(titleSelector, { timeout: 5000 });
        await page.click(titleSelector);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 2. "...daha fazla" butonuna tıkla (tam description görünür)
        const expandButtonSelector = '#expand-sizer, tp-yt-paper-button#expand-sizer';
        const expandButton = await page.$(expandButtonSelector);
        if (expandButton) {
          await expandButton.click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        // Tıklama başarısız olursa devam et, visible olanı almaya çalış
        console.error("Click failed, will try to get visible text:", error);
      }

      // Description'ı çıkar
      const data = await page.evaluate(() => {
        // Tüm description text'lerini al
        let description = "";
        
        // 1. Expanded description (snippet'ten sonra görünür)
        const snippet = document.querySelector('#snippet #plain-snippet-text, #snippet-text');
        if (snippet?.textContent) {
          description = snippet.textContent.trim();
        }
        
        // 2. Tam expanded olanı dene
        const expanded = document.querySelector('#expanded');
        if (expanded?.textContent) {
          const expandedText = expanded.textContent.trim();
          if (expandedText.length > description.length) {
            description = expandedText;
          }
        }
        
        // 3. yt-formatted-string içinden al
        if (!description) {
          const ytFormattedAll = document.querySelectorAll(
            'yt-formatted-string.ytd-text-inline-expander'
          );
          
          for (const elem of ytFormattedAll) {
            const text = elem.textContent?.trim() || "";
            if (text.length > description.length) {
              description = text;
            }
          }
        }
        
        // 4. Meta tag fallback
        if (!description) {
          const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content");
          description = metaDesc || "";
        }

        return {
          description: description,
        };
      });

      await browser.close();
      browser = null;

      return {
        success: true,
        title: title || "",
        author: author || "",
        thumbnail: thumbnail || "",
        description: data.description || "",
      };

    } catch (error: any) {
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
 * YouTube Shorts URL formatını kontrol eder
 * Desteklenen formatlar:
 * - /shorts/VIDEO_ID
 * - /watch?v=VIDEO_ID (normal video da çalışır)
 */
function isValidYouTubeShortUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Hostname kontrolü
    const validHosts = [
      "www.youtube.com",
      "youtube.com",
      "m.youtube.com",
      "youtu.be"
    ];
    
    if (!validHosts.includes(urlObj.hostname)) {
      return false;
    }
    
    const path = urlObj.pathname;
    const searchParams = urlObj.searchParams;
    
    // Desteklenen formatlar
    return (
      path.startsWith("/shorts/") ||
      path.startsWith("/watch") && searchParams.has("v") ||
      (urlObj.hostname === "youtu.be" && path.length > 1) // youtu.be/VIDEO_ID
    );
  } catch {
    return false;
  }
}
