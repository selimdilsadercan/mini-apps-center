import axios from "axios";
import { parse } from "node-html-parser";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://menu.kanlicateras.com/";

const CATEGORIES = [
  { id: 8, name: "Kahvaltı" },
  { id: 9, name: "Tostlar Gözlemeler" },
  { id: 10, name: "Lezzetli Atıştırmalık" },
  { id: 11, name: "Burger Dürüm Krep" },
  { id: 12, name: "Pizza" },
  { id: 13, name: "Ana Yemekler" },
  { id: 14, name: "Salatalar" },
  { id: 15, name: "Ev Yapımı Tatlılar" },
  { id: 16, name: "Tarihi Meşhur Kanlıca Yoğurdu" },
  { id: 17, name: "Çaylar" },
  { id: 18, name: "Kahveler" },
  { id: 19, name: "Meşrubatlar" },
  { id: 20, name: "Yaz İçecekleri" },
  { id: 21, name: "Makarna & Noodle" },
];

interface MenuItem {
  category: string;
  categoryImageUrl: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dietaryFlags: string[];
}

async function scrape() {
  const allItems: MenuItem[] = [];
  
  // First, scrape category images from the home page
  console.log("Scraping category images from home page...");
  const categoryImages: Record<string, string> = {};
  try {
    const homeResponse = await axios.get(BASE_URL);
    const homeRoot = parse(homeResponse.data);
    const catBoxes = homeRoot.querySelectorAll(".home-box-category");
    
    catBoxes.forEach(box => {
      const name = box.querySelector(".bc-text")?.text.trim() || "";
      const imgRelative = box.querySelector(".home-image-category img")?.getAttribute("src") || "";
      if (name && imgRelative) {
        categoryImages[name] = `${BASE_URL}${imgRelative}`;
      }
    });
  } catch (err) {
    console.error("Error scraping category images:", err);
  }

  for (const cat of CATEGORIES) {
    console.log(`Scraping category: ${cat.name}...`);
    try {
      const response = await axios.get(`${BASE_URL}?KatId=${cat.id}&P=UrunIcerik`);
      const root = parse(response.data);
      const items = root.querySelectorAll("a.gallery-list");

      items.forEach((item) => {
        const titleHtml = item.getAttribute("title") || "";
        const titleRoot = parse(titleHtml);
        
        const name = titleRoot.querySelector("span[style*='font-size:16px']")?.text.trim() || "";
        const description = titleRoot.querySelector("span[style*='font-size:13px']")?.text.trim() || "";
        
        // Extract price from the end of the titleHtml (e.g., "1.850,00 ₺")
        const priceMatch = titleHtml.match(/([\d.,]+)\s*₺/);
        const priceStr = priceMatch ? priceMatch[1].replace(".", "").replace(",", ".") : "0";
        const price = parseFloat(priceStr);

        const imgRelative = item.querySelector("img")?.getAttribute("src") || "";
        const imageUrl = imgRelative ? `${BASE_URL}${imgRelative}` : "";

        allItems.push({
          category: cat.name,
          categoryImageUrl: categoryImages[cat.name] || "",
          name,
          description,
          price,
          imageUrl,
          dietaryFlags: [], // We don't have this info from the site
        });
      });
    } catch (error) {
      console.error(`Error scraping category ${cat.name}:`, error);
    }
  }

  const outputPath = path.join(process.cwd(), "backend/digital-menu/kanlica-menu.json");
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
  console.log(`Scraping complete! Saved to ${outputPath}`);
}

scrape();
