import axios from "axios";
import { parse } from "node-html-parser";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";
import { runRpc } from "../lib/assistant-tool-error";
import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");
const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());
const db = supabase.schema("itu_yemekhane");

let ituMenuCache: { data: unknown; at: number } | null = null;

async function fetchItuMenu(): Promise<unknown> {
  const now = Date.now();
  if (ituMenuCache && now - ituMenuCache.at < 60 * 60 * 1000) {
    return ituMenuCache.data;
  }

  const url =
    "https://bilgiekrani.itu.edu.tr/ExternalPages/sks/yemek-menu-v2/uzerinde-calisilan/yemek-menu.aspx";
  const { data } = await axios.get(url);
  const root = parse(data);
  const titleEl = root.querySelector("h2") || root.querySelector("h1");
  const titleText = titleEl ? titleEl.text.trim() : "Günün Menüsü";
  const mealType = titleText.includes("Öğle") ? "Öğle Yemeği" : "Akşam Yemeği";
  const dishes: Array<{ id: string; name: string; category: string }> = [];

  root.querySelectorAll("tr").forEach((row, index) => {
    const cells = row.querySelectorAll("td");
    if (cells.length < 2) return;
    const categoryRaw = cells[0].text.trim();
    const dishLink = cells[1].querySelector("a[href*='besin-degerleri.aspx']");
    if (!dishLink || !categoryRaw || categoryRaw.toLowerCase().includes("şerh")) {
      return;
    }
    const name = dishLink.text.trim();
    const href = dishLink.getAttribute("href") || "";
    const idMatch = href.match(/yemek=(\d+)/);
    dishes.push({
      id: idMatch ? idMatch[1] : `dish-${index}`,
      name,
      category: categoryRaw,
    });
  });

  const menu = {
    date: new Date().toISOString().slice(0, 10),
    mealType,
    dishes,
  };
  ituMenuCache = { data: menu, at: now };
  return menu;
}

export const ituYemekhaneAssistant: AppAssistantModule = {
  appId: "itu-yemekhane",
  name: "İTÜ Yemekhane",
  description: "Menüyü okur ve yemek beğenmeme durumunu günceller.",
  schema: "itu_yemekhane",
  tools: [
    {
      name: "get_menu",
      description: "Günlük menüyü getirir.",
      permission: "read",
      parameters: {
        date: { type: "string", description: "YYYY-MM-DD" },
      },
    },
    {
      name: "toggle_dislike",
      description: "Yemeği beğenmeme listesine ekler/çıkarır.",
      permission: "update",
      parameters: {
        dishName: { type: "string", required: true, description: "Yemek adı" },
      },
    },
    {
      name: "list_disliked",
      description: "Beğenilmeyen yemekleri listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    get_menu: async () => {
      return fetchItuMenu();
    },
    toggle_dislike: async ({ args }) => {
      return runRpc("toggle_dislike", async () =>
        await db.rpc("toggle_dislike", { dish_name_param: requireString(args, "dishName") }),
      );
    },
    list_disliked: async () => {
      return runRpc("list_disliked", async () => await db.rpc("get_dislikes"));
    },
  },
};
