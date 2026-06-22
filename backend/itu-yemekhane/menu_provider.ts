import axios from "axios";
import { parse } from "node-html-parser";

export interface Dish {
  id: string;
  name: string;
  category: string;
  calories: number;
}

export interface MenuResponse {
  date: string;
  mealType: string;
  dishes: Dish[];
}

let cachedMenu: MenuResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60;

async function fetchCalories(dishId: string): Promise<number> {
  if (dishId.startsWith("dish-")) return 0;

  try {
    const url = `https://bidb.itu.edu.tr/ExternalPages/sks/yemek-menu-v2/besin-degerleri.aspx?yemek=${dishId}`;
    const { data } = await axios.get(url, { timeout: 3000 });
    const root = parse(data);

    const tds = root.querySelectorAll("td");
    for (let i = 0; i < tds.length; i++) {
      const text = tds[i].text.toLowerCase();
      if (text.includes("enerji") || text.includes("kcal")) {
        const valText = tds[i + 1]?.text.trim() || tds[i].text.trim();
        const match = valText.match(/(\d+)/);
        if (match) return parseInt(match[1], 10);
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

function mapCategory(categoryText: string, dishName: string): string {
  const c = categoryText.toLowerCase();
  const n = dishName.toLowerCase();

  if (c.includes("çorba")) return "soup";
  if (c.includes("ana yemek")) return "main";
  if (c.includes("yan yemek")) return "side";
  if (c.includes("tatlı") || c.includes("meyve") || c.includes("içecek")) return "dessert";

  if (n.includes("çorba")) return "soup";
  if (n.includes("köfte") || n.includes("tavuk") || n.includes("et") || n.includes("kavurma") || n.includes("dolma"))
    return "main";
  if (n.includes("pilav") || n.includes("makarna") || n.includes("püre") || n.includes("erişte")) return "side";
  if (n.includes("tatlı") || n.includes("meyve") || n.includes("komposto") || n.includes("puding")) return "dessert";
  if (n.includes("salata") || n.includes("yoğurt") || n.includes("cacık")) return "vegetarian";

  return "vegetarian";
}

export async function fetchMenu(forceRefresh = false): Promise<MenuResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedMenu && now - cacheTimestamp < CACHE_TTL) {
    return cachedMenu;
  }

  const url =
    "https://bilgiekrani.itu.edu.tr/ExternalPages/sks/yemek-menu-v2/uzerinde-calisilan/yemek-menu.aspx";
  const { data } = await axios.get(url);
  const root = parse(data);

  const titleEl = root.querySelector("h2") || root.querySelector("h1");
  const titleText = titleEl ? titleEl.text.trim() : "Günün Menüsü";
  const mealType = titleText.includes("Öğle") ? "Öğle Yemeği" : "Akşam Yemeği";

  const dishes: Dish[] = [];
  const rows = root.querySelectorAll("tr");

  if (rows.length > 0) {
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 2) {
        const categoryRaw = cells[0].text.trim();
        const dishLink = cells[1].querySelector("a[href*='besin-degerleri.aspx']");

        if (dishLink && categoryRaw && !categoryRaw.toLowerCase().includes("şerh")) {
          const name = dishLink.text.trim();
          const href = dishLink.getAttribute("href") || "";
          const idMatch = href.match(/yemek=(\d+)/);
          const id = idMatch ? idMatch[1] : `dish-${index}`;

          dishes.push({
            id,
            name,
            category: mapCategory(categoryRaw, name),
            calories: 0,
          });
        }
      }
    });
  }

  if (dishes.length === 0) {
    const dishLinks = root.querySelectorAll("a[href*='besin-degerleri.aspx']");
    dishLinks.forEach((el, index) => {
      const name = el.text.trim();
      const href = el.getAttribute("href") || "";
      const idMatch = href.match(/yemek=(\d+)/);
      const id = idMatch ? idMatch[1] : `dish-f-${index}`;
      const parent = el.parentNode;
      const parentText = parent?.text || "";

      dishes.push({
        id,
        name,
        category: mapCategory(parentText, name),
        calories: 0,
      });
    });
  }

  await Promise.all(
    dishes.map(async (dish) => {
      dish.calories = await fetchCalories(dish.id);
    }),
  );

  cachedMenu = { date: titleText, mealType, dishes };
  cacheTimestamp = now;
  return cachedMenu;
}
