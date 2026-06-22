import axios from "axios";
import { parse } from "node-html-parser";

export type TraySlot = "soup" | "main" | "side" | "extras";

export interface Dish {
  id: string;
  name: string;
  category: string;
  traySlot: TraySlot;
  calories: number;
  isSelectable: boolean;
}

export interface MenuTrays {
  soup: Dish[];
  main: Dish[];
  side: Dish[];
  extras: Dish[];
}

export interface MenuVariant {
  dishes: Dish[];
  trays: MenuTrays;
}

export interface MenuResponse {
  date: string;
  mealType: string;
  dishes: Dish[];
  trays: MenuTrays;
  vegan?: MenuVariant;
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

function mapTraySlot(categoryRaw: string): TraySlot {
  const c = categoryRaw.toLowerCase();
  if (c.includes("çorba")) return "soup";
  if (c.includes("ana yemek")) return "main";
  if (c.includes("yan yemek")) return "side";
  return "extras";
}

function mapCategory(categoryText: string, dishName: string): string {
  const c = categoryText.toLowerCase();
  const n = dishName.toLowerCase();

  if (c.includes("çorba")) return "soup";
  if (c.includes("ana yemek")) return "main";
  if (c.includes("yan yemek")) return "side";
  if (c.includes("tatlı") || c.includes("meyve") || c.includes("içecek")) return "dessert";
  if (c.includes("salata")) return "salad";

  if (n.includes("çorba")) return "soup";
  if (n.includes("köfte") || n.includes("tavuk") || n.includes("et") || n.includes("kavurma") || n.includes("dolma"))
    return "main";
  if (n.includes("pilav") || n.includes("makarna") || n.includes("püre") || n.includes("erişte")) return "side";
  if (n.includes("tatlı") || n.includes("meyve") || n.includes("komposto") || n.includes("puding")) return "dessert";
  if (n.includes("salata") || n.includes("piyaz") || n.includes("yoğurt") || n.includes("cacık")) return "salad";
  if (n.includes("gazoz") || n.includes("ayran") || n.includes("su") || n.includes("kola") || n.includes("içecek"))
    return "drink";

  return "extras";
}

function buildTrays(dishes: Dish[]): MenuTrays {
  const trays: MenuTrays = { soup: [], main: [], side: [], extras: [] };
  const counts: Record<TraySlot, number> = { soup: 0, main: 0, side: 0, extras: 0 };

  for (const dish of dishes) {
    trays[dish.traySlot].push(dish);
    counts[dish.traySlot]++;
  }

  for (const slot of Object.keys(trays) as TraySlot[]) {
    if (counts[slot] > 1) {
      for (const dish of trays[slot]) {
        dish.isSelectable = true;
      }
    }
  }

  return trays;
}

function cleanDishName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDishLinksFromCell(cellHtml: string, categoryRaw: string, rowIndex: number): Dish[] {
  const cell = parse(cellHtml);
  const links = cell.querySelectorAll("a[href*='besin-degerleri.aspx']");
  const traySlot = mapTraySlot(categoryRaw);

  return links.map((link, linkIndex) => {
    const name = cleanDishName(link.text.replace(/\s+/g, " ").trim());
    const href = link.getAttribute("href") || "";
    const idMatch = href.match(/yemek=(\d+)/);
    const id = idMatch ? idMatch[1] : `dish-${rowIndex}-${linkIndex}`;

    return {
      id,
      name,
      category: mapCategory(categoryRaw, name),
      traySlot,
      calories: 0,
      isSelectable: false,
    };
  });
}

const MENU_PAGE_BASE =
  "https://bidb.itu.edu.tr/ExternalPages/sks/yemek-menu-v2/uzerinde-calisilan/yemek-menu.aspx";

function veganMealTip(mealTip: string, mealType: string): string {
  if (mealTip.includes("-vegan")) return mealTip;
  if (mealTip.endsWith("-genel")) return mealTip.replace(/-genel$/, "-vegan");
  return mealType.includes("Öğle") ? "itu-ogle-yemegi-vegan" : "itu-aksam-yemegi-vegan";
}

function parseDishesFromRoot(root: ReturnType<typeof parse>): Dish[] {
  const dishes: Dish[] = [];
  const rows = root.querySelectorAll("tr");

  if (rows.length > 0) {
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 2) {
        const categoryRaw = cells[0].text.trim();
        if (!categoryRaw || categoryRaw.toLowerCase().includes("şerh")) return;

        const parsed = parseDishLinksFromCell(cells[1].toString(), categoryRaw, index);
        dishes.push(...parsed);
      }
    });
  }

  if (dishes.length === 0) {
    const dishLinks = root.querySelectorAll("a[href*='besin-degerleri.aspx']");
    dishLinks.forEach((el, index) => {
      const name = cleanDishName(el.text.trim());
      const href = el.getAttribute("href") || "";
      const idMatch = href.match(/yemek=(\d+)/);
      const id = idMatch ? idMatch[1] : `dish-f-${index}`;
      const parent = el.parentNode;
      const parentText = parent?.text || "";

      dishes.push({
        id,
        name,
        category: mapCategory(parentText, name),
        traySlot: mapTraySlot(parentText),
        calories: 0,
        isSelectable: false,
      });
    });
  }

  return dishes;
}

function parseMenuMetadata(root: ReturnType<typeof parse>): {
  date: string;
  mealType: string;
  mealTip: string;
  menuDate: string;
} {
  const titleEl = root.querySelector("h2") || root.querySelector("h1");
  const date = titleEl ? titleEl.text.trim() : "Günün Menüsü";
  const mealType = date.includes("Öğle") ? "Öğle Yemeği" : "Akşam Yemeği";
  const mealTip =
    root.querySelector("#hfYemekTipi")?.getAttribute("value")?.trim() ||
    root.querySelector("#ddlYemekTipi option[selected]")?.getAttribute("value")?.trim() ||
    (mealType.includes("Öğle") ? "itu-ogle-yemegi-genel" : "itu-aksam-yemegi-genel");
  const menuDate =
    root.querySelector("#hfDate")?.getAttribute("value")?.trim() ||
    new Date().toLocaleDateString("tr-TR").replace(/\//g, ".");

  return { date, mealType, mealTip, menuDate };
}

async function fetchMenuPage(mealTip: string, menuDate: string): Promise<string> {
  const url = `${MENU_PAGE_BASE}?tip=${encodeURIComponent(mealTip)}&&value=${encodeURIComponent(menuDate)}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  return data;
}

async function hydrateCalories(dishes: Dish[]): Promise<void> {
  await Promise.all(
    dishes.map(async (dish) => {
      dish.calories = await fetchCalories(dish.id);
    }),
  );
}

export async function fetchMenu(forceRefresh = false): Promise<MenuResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedMenu && now - cacheTimestamp < CACHE_TTL) {
    return cachedMenu;
  }

  const generalUrl =
    "https://bilgiekrani.itu.edu.tr/ExternalPages/sks/yemek-menu-v2/uzerinde-calisilan/yemek-menu.aspx";
  const { data: generalHtml } = await axios.get(generalUrl, { timeout: 10000 });
  const generalRoot = parse(generalHtml);
  const meta = parseMenuMetadata(generalRoot);
  const generalDishes = parseDishesFromRoot(generalRoot);

  let veganDishes: Dish[] = [];
  try {
    const veganTip = veganMealTip(meta.mealTip, meta.mealType);
    const veganHtml = await fetchMenuPage(veganTip, meta.menuDate);
    veganDishes = parseDishesFromRoot(parse(veganHtml));
  } catch (error) {
    console.warn("Vegan menu fetch failed:", error);
  }

  const allDishes = [...generalDishes, ...veganDishes];
  await hydrateCalories(allDishes);

  const trays = buildTrays(generalDishes);
  const vegan =
    veganDishes.length > 0
      ? {
          dishes: veganDishes,
          trays: buildTrays(veganDishes),
        }
      : undefined;

  cachedMenu = {
    date: meta.date,
    mealType: meta.mealType,
    dishes: generalDishes,
    trays,
    vegan,
  };
  cacheTimestamp = now;
  return cachedMenu;
}
