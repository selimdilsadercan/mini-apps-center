import type { AssistantCard, AssistantChatReply } from "../lib/assistant-card-types";
import { AssistantToolError } from "../lib/assistant-tool-error";
import {
  kilerCardFromInput,
  mapChocolateCards,
  mapConcertCards,
  mapFriendCards,
  mapHobbyCards,
  mapIskambilCards,
  mapItuDishCards,
  mapKilerCards,
  mapMemedexCards,
  mapMovieCards,
  mapRecipeCards,
  mapSubcenterCards,
  mapTournamentCards,
  mergeResultCard,
  pickRandomIskambilCard,
  subcenterCardFromInput,
  asRows,
} from "./card-mappers";
import { executeAssistantTool } from "./registry";

interface ChatContext {
  userId: string | null;
  text: string;
  normalized: string;
}

type ChatRule = {
  id: string;
  test: (ctx: ChatContext) => boolean;
  run: (ctx: ChatContext) => Promise<AssistantChatReply>;
};

function reply(content: string, cards?: AssistantCard[]): AssistantChatReply {
  return { content, cards: cards?.length ? cards : undefined };
}

function listReply(
  label: string,
  cards: AssistantCard[],
  emptyText = "Kayıt bulunamadı.",
): AssistantChatReply {
  if (!cards.length) return reply(emptyText);
  return reply(`${label} (${cards.length}):`, cards);
}

function normalize(text: string): string {
  return text
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function requireSignIn(userId: string | null): string | null {
  if (userId?.trim()) return null;
  return "Uygulama verilerine erişmek için giriş yapmalısın.";
}

async function runTool(
  userId: string,
  appId: string,
  toolName: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  return executeAssistantTool({ userId, appId, toolName, args });
}

function toolErrorMessage(error: unknown): string {
  if (error instanceof AssistantToolError) return error.message;
  if (error instanceof Error) return error.message;
  return "İşlem yapılamadı.";
}

const SUB_BRAND_META: Record<
  string,
  { display: string; category: string; color: string; icon: string }
> = {
  netflix: { display: "Netflix", category: "Entertainment", color: "#E50914", icon: "🎬" },
  spotify: { display: "Spotify", category: "Music", color: "#1DB954", icon: "🎵" },
  youtube: { display: "YouTube", category: "Entertainment", color: "#FF0000", icon: "▶️" },
  disney: { display: "Disney+", category: "Entertainment", color: "#113CCF", icon: "✨" },
  apple: { display: "Apple", category: "Software", color: "#000000", icon: "🍎" },
  icloud: { display: "iCloud", category: "Cloud Storage", color: "#0284C7", icon: "☁️" },
  google: { display: "Google", category: "Software", color: "#4285F4", icon: "🔍" },
  microsoft: { display: "Microsoft", category: "Software", color: "#00A4EF", icon: "💻" },
  adobe: { display: "Adobe", category: "Design", color: "#FF0000", icon: "🎨" },
  chatgpt: { display: "ChatGPT", category: "AI", color: "#10A37F", icon: "🤖" },
  openai: { display: "OpenAI", category: "AI", color: "#10A37F", icon: "🤖" },
  amazon: { display: "Amazon Prime", category: "Entertainment", color: "#FF9900", icon: "📦" },
  hbo: { display: "HBO Max", category: "Entertainment", color: "#5822B4", icon: "🎬" },
  exxen: { display: "Exxen", category: "Entertainment", color: "#FACC15", icon: "🎬" },
  blutv: { display: "BluTV", category: "Entertainment", color: "#2563EB", icon: "📺" },
  gain: { display: "Gain", category: "Entertainment", color: "#22C55E", icon: "📺" },
};

type ParsedSubscription =
  | {
      ok: true;
      name: string;
      price: number;
      currency: string;
      cycle: "monthly" | "yearly";
      category: string;
      color: string;
      icon: string;
    }
  | { ok: false; message: string };

function parseSubscriptionAdd(normalized: string): ParsedSubscription {
  const wantsAdd =
    /\b(ekle|ekleyelim|oluştur|kaydet|koy)\b/.test(normalized) &&
    (/\b(abonelik|aboneliğe|subcenter)\b/.test(normalized) ||
      Object.keys(SUB_BRAND_META).some((b) => normalized.includes(b)));

  if (!wantsAdd) {
    return {
      ok: false,
      message:
        'Örnek: «netflix aboneliği ekle 199 tl aylık» veya «abonelik ekle spotify 59,99 tl»',
    };
  }

  const priceMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(tl|try|₺|usd|\$|eur|€)?/i);
  if (!priceMatch) {
    return {
      ok: false,
      message:
        "Fiyat belirtmelisin. Örnek: «netflix aboneliği ekle 199 tl aylık»",
    };
  }

  const price = parseFloat(priceMatch[1].replace(",", "."));
  let currency = "TRY";
  const cur = priceMatch[2]?.toLowerCase() ?? "";
  if (/usd|\$/.test(cur)) currency = "USD";
  else if (/eur|€/.test(cur)) currency = "EUR";

  const cycle: "monthly" | "yearly" = /\b(yıllık|yearly|senelik)\b/.test(normalized)
    ? "yearly"
    : "monthly";

  let name: string | undefined;
  let category = "Other";
  let color = "#64748B";
  let icon = "💳";

  for (const [key, meta] of Object.entries(SUB_BRAND_META)) {
    if (normalized.includes(key)) {
      name = meta.display;
      category = meta.category;
      color = meta.color;
      icon = meta.icon;
      break;
    }
  }

  if (!name) {
    const patterns = [
      /abonelik\s+ekle\s+(.+?)\s+\d/,
      /aboneliğe\s+(.+?)\s+ekle/,
      /(.+?)\s+abonelik.{0,24}?\b(ekle|oluştur)\b/,
      /\b(ekle|oluştur)\s+(.+?)\s+\d/,
      /yeni\s+abonelik[:\s]+(.+?)\s+\d/,
    ];
    for (const pattern of patterns) {
      const m = normalized.match(pattern);
      const raw = (m?.[1] ?? m?.[2])?.trim();
      if (raw && raw.length >= 2) {
        name = raw
          .replace(/\b(aylık|yıllık|tl|try|usd|eur|abonelik|aboneliği)\b/gi, "")
          .trim();
        name = name
          .split(/\s+/)
          .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
          .join(" ");
        break;
      }
    }
  }

  if (!name || name.length < 2) {
    return {
      ok: false,
      message:
        "Servis adını yaz. Örnek: «spotify aboneliği ekle 59,99 tl» veya «abonelik ekle Disney 149 tl»",
    };
  }

  return { ok: true, name, price, currency, cycle, category, color, icon };
}

const RULES: ChatRule[] = [
  {
    id: "greeting",
    test: (c) =>
      /^(merhaba|selam|hey|günaydın|iyi akşamlar|naber|naber\?)$/.test(c.normalized) ||
      /\b(merhaba|selam)\b/.test(c.normalized) && c.normalized.length < 40,
    run: async () =>
      reply(
        "Merhaba! Mini uygulamalarında işlem yapmana yardımcı olabilirim. Örneğin: «kilerim», «aboneliklerim», «tariflerim», «konserlerim» veya «yardım» yaz.",
      ),
  },
  {
    id: "thanks",
    test: (c) => /^(teşekkür|teşekkürler|sağ ol|eyvallah|thanks)$/.test(c.normalized),
    run: async () => reply("Rica ederim! Başka bir şey istersen yazman yeterli."),
  },
  {
    id: "help",
    test: (c) =>
      /\b(yardım|help|ne yapabil|komutlar|neler yap)\b/.test(c.normalized),
    run: async () =>
      reply(
        "Sana yardımcı olabileceğimiz bazı konular ve örnek komutlar aşağıda listelenmiştir. Örnek komutlara tıklayarak doğrudan yazma alanına aktarabilirsin:",
        [
          {
            type: "help",
            data: {
              items: [
                { title: "Kiler", icon: "🍎", color: "#F97316", examples: ["kilerim", "kilere süt ekle"] },
                { title: "Abonelikler", icon: "💳", color: "#6366F1", examples: ["aboneliklerim", "netflix aboneliği ekle 199 tl aylık"] },
                { title: "Tarifler", icon: "🍲", color: "#EC4899", examples: ["tariflerim"] },
                { title: "Konserler", icon: "🎵", color: "#8B5CF6", examples: ["konserlerim"] },
                { title: "Hobiler", icon: "🎨", color: "#10B981", examples: ["hobilerim"] },
                { title: "Harita", icon: "📍", color: "#EF4444", examples: ["harita listelerim"] },
                { title: "Çikolata", icon: "🍫", color: "#78350F", examples: ["çikolatalarım"] },
                { title: "Meme", icon: "🤪", color: "#F59E0B", examples: ["memeler"] },
                { title: "Turnuva", icon: "🏆", color: "#3B82F6", examples: ["turnuvalar"] },
                { title: "Kart Oyunları", icon: "🃏", color: "#059669", examples: ["kart oyunlarım", "rastgele kart oyunu", "bana bir kart oyunu öner"] },
                { title: "İkon Setleri", icon: "🎭", color: "#8B5CF6", examples: ["ikon setleri"] },
                { title: "Yemekhane", icon: "🍽️", color: "#14B8A6", examples: ["menü", "beğenmediğim yemekler"] },
                { title: "Filmler", icon: "🎬", color: "#E11D48", examples: ["filmler", "yaklaşan filmler", "en iyi filmler"] },
                { title: "Arkadaşlar", icon: "👥", color: "#6366F1", examples: ["arkadaşlarım", "bekleyen istekler"] },
              ],
            },
          },
        ],
      ),
  },
  {
    id: "kiler-list",
    test: (c) => /\b(kilerim|kilerde|kilere bak|stoklarım|kiler listesi)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "kiler", "list_items");
        return listReply("Kilerindeki ürünler", mapKilerCards(data), "Kilerinde ürün yok.");
      } catch (e) {
        return reply(`Kiler listelenemedi: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "kiler-add",
    test: (c) =>
      /\b(kilere|kilerime)\b/.test(c.normalized) &&
      /\b(ekle|koy)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      const m =
        c.normalized.match(/kilere\s+(.+?)\s+ekle/) ??
        c.normalized.match(/kilerime\s+(.+?)\s+(ekle|koy)/);
      const name = m?.[1]?.trim();
      if (!name) {
        return reply(
          'Ürün adını belirt: örn. «kilere süt ekle» veya «kilerime 2 kg elma koy».',
        );
      }
      const amountMatch = c.normalized.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|adet)?/);
      const amount = amountMatch ? parseFloat(amountMatch[1].replace(",", ".")) : 1;
      const unit = amountMatch?.[2] ?? "adet";
      let storageType = "pantry";
      if (/\b(buzdolab|fridge|soğuk)\b/.test(c.normalized)) storageType = "fridge";
      if (/\b(dondurucu|freezer)\b/.test(c.normalized)) storageType = "freezer";
      const draft = kilerCardFromInput({ name, amount, unit, storageType });
      try {
        const result = await runTool(c.userId!, "kiler", "add_item", {
          name,
          amount,
          unit,
          storageType,
          purchaseDate: todayIso(),
        });
        const cards = mergeResultCard([draft], result, mapKilerCards);
        return reply(`Tamam, kilere **${name}** eklendi.`, cards);
      } catch (e) {
        return reply(`Eklenemedi: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "subcenter-add",
    test: (c) => {
      if (!/\b(ekle|ekleyelim|oluştur|kaydet|koy)\b/.test(c.normalized)) {
        return false;
      }
      return (
        /\b(abonelik|aboneliğe|subcenter)\b/.test(c.normalized) ||
        Object.keys(SUB_BRAND_META).some((b) => c.normalized.includes(b))
      );
    },
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);

      const parsed = parseSubscriptionAdd(c.normalized);
      if (!parsed.ok) return reply(parsed.message);

      const cycleLabel = parsed.cycle === "yearly" ? "yıllık" : "aylık";
      const draft = subcenterCardFromInput(parsed);
      try {
        const result = await runTool(c.userId!, "subcenter", "create_subscription", {
          name: parsed.name,
          price: parsed.price,
          currency: parsed.currency,
          cycle: parsed.cycle,
          category: parsed.category,
          color: parsed.color,
          icon: parsed.icon,
          startDate: todayIso(),
        });
        const cards = mergeResultCard([draft], result, mapSubcenterCards);
        return reply(
          `Tamam, **${parsed.name}** aboneliği eklendi (${parsed.price} ${parsed.currency}, ${cycleLabel}).`,
          cards,
        );
      } catch (e) {
        return reply(`Abonelik eklenemedi: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "subcenter-list",
    test: (c) =>
      /\b(abonelik|subcenter|aboneliklerim)\b/.test(c.normalized) &&
      !/\b(ekle|ekleyelim|oluştur|kaydet|koy)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "subcenter", "list_subscriptions");
        return listReply("Aboneliklerin", mapSubcenterCards(data), "Abonelik bulunamadı.");
      } catch (e) {
        return reply(`Liste alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "recipe-list",
    test: (c) => /\b(tarif|tariflerim|yemek planı)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "recipe", "list_recipes");
        return listReply("Tariflerin", mapRecipeCards(data), "Tarif bulunamadı.");
      } catch (e) {
        return reply(`Tarifler alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "concert-list",
    test: (c) => /\b(konser|konserlerim|konser listesi)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "concert-list", "list_concerts");
        return listReply("Konser listen", mapConcertCards(data), "Konser kaydı yok.");
      } catch (e) {
        return reply(`Konserler alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "hobby-list",
    test: (c) => /\b(hobi|hobilerim)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "hobby-center", "list_hobbies");
        return listReply("Hobilerin", mapHobbyCards(data), "Hobi kaydı yok.");
      } catch (e) {
        return reply(`Hobiler alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "map-list",
    test: (c) => /\b(harita|harita listelerim|map tracker)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        await runTool(c.userId!, "map-tracker", "get_data");
        return reply("Harita verilerin güncellendi. Uygulamadan listeleri görebilirsin.");
      } catch (e) {
        return reply(`Harita verisi alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "chocolate-list",
    test: (c) => /\b(çikolata|chocolatedb|chocolate)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "chocolate-db", "list_chocolates");
        return listReply("Çikolatalar", mapChocolateCards(data), "Çikolata bulunamadı.");
      } catch (e) {
        return reply(`Liste alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "memedex-list",
    test: (c) => /\b(meme|memedex|memeler)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "memedex", "list_memes");
        return listReply("Memeler", mapMemedexCards(data), "Meme bulunamadı.");
      } catch (e) {
        return reply(`Memeler alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "tournament-list",
    test: (c) => /\b(turnuva|turnuvalar)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "tournament", "list_tournaments");
        return listReply("Turnuvalar", mapTournamentCards(data), "Turnuva bulunamadı.");
      } catch (e) {
        return reply(`Turnuvalar alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "iskambil-random",
    test: (c) =>
      (/\b(rastgele|random)\b/.test(c.normalized) &&
        /\b(kart|iskambil|oyun|codex)\b/.test(c.normalized)) ||
      /\b(rastgele kart oyunu|rastgele iskambil|bir kart oyunu|kart oyunu söyle|kart oyunu öner|hangi kart oyunu|bir iskambil oyunu)\b/.test(
        c.normalized,
      ) ||
      (/\b(öner|tavsiye|oner)\b/.test(c.normalized) &&
        /\b(kart oyunu|iskambil|card game)\b/.test(c.normalized)),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "iskambil", "list_games");
        const card = pickRandomIskambilCard(data);
        if (!card) return reply("Kart oyunu bulunamadı.");
        const name = String(card.data.name ?? "?");
        return reply(
          `İşte rastgele bir kart oyunu: **${name}**. Detay için karta tıkla.`,
          [card],
        );
      } catch (e) {
        return reply(`Oyun seçilemedi: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "iskambil-list",
    test: (c) => /\b(kart oyun|iskambil|oyun kataloğu)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "iskambil", "list_games");
        return listReply("Kart oyunları", mapIskambilCards(data), "Oyun bulunamadı.");
      } catch (e) {
        return reply(`Oyunlar alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "icon-list",
    test: (c) => /\b(ikon set|icon set)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "icon-set-guide", "list_icon_sets");
        const cards = asRows(data).map((r) => ({
          type: "recipe" as const,
          data: {
            id: String(r.id ?? ""),
            title: String(r.name ?? r.title ?? "?"),
          },
        }));
        return listReply("İkon setleri", cards, "İkon seti bulunamadı.");
      } catch (e) {
        return reply(`Liste alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "itu-menu",
    test: (c) => /\b(menü|yemekhane|öğün|yemek listesi)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "itu-yemekhane", "get_menu");
        const cards = mapItuDishCards(data);
        const mealType = (data as { mealType?: string })?.mealType ?? "Menü";
        return listReply(mealType, cards, "Bugün için menü bulunamadı.");
      } catch (e) {
        return reply(`Menü alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "itu-dislikes",
    test: (c) => /\b(beğenmediğim yemek|sevmediğim yemek)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "itu-yemekhane", "list_disliked");
        const cards = asRows(data).map((r) => ({
          type: "itu-dish" as const,
          data: { name: String(r.dish_name ?? r.name ?? "?"), category: "Beğenilmeyen" },
        }));
        return listReply("Beğenmediğin yemekler", cards, "Liste boş.");
      } catch (e) {
        return reply(`Liste alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "movies-list",
    test: (c) =>
      /\b(film|filmler|vizyon|yaklaşan film)\b/.test(c.normalized) &&
      !/\b(en iyi|puan)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      const tool = /\b(yaklaşan|gelecek)\b/.test(c.normalized)
        ? "list_upcoming"
        : "list_movies";
      try {
        const data = await runTool(c.userId!, "movies-this-year", tool);
        return listReply("Filmler", mapMovieCards(data), "Film bulunamadı.");
      } catch (e) {
        return reply(`Filmler alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "movies-top",
    test: (c) => /\b(en iyi film|yüksek puan|top rated)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "movies-this-year", "list_top_rated");
        return listReply("En yüksek puanlı filmler", mapMovieCards(data), "Film bulunamadı.");
      } catch (e) {
        return reply(`Liste alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "friends-list",
    test: (c) =>
      /\b(arkadaş|arkadaşlarım)\b/.test(c.normalized) &&
      !/\b(istek|bekleyen)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "friendship", "list_friends");
        return listReply("Arkadaşların", mapFriendCards(data), "Arkadaş bulunamadı.");
      } catch (e) {
        return reply(`Arkadaş listesi alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "friends-pending",
    test: (c) => /\b(bekleyen istek|arkadaşlık isteği|isteklerim)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = await runTool(c.userId!, "friendship", "list_pending_requests");
        return listReply("Bekleyen istekler", mapFriendCards(data), "Bekleyen istek yok.");
      } catch (e) {
        return reply(`İstekler alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
  {
    id: "app-order",
    test: (c) => /\b(uygulama sırası|ana ekran sırası|app order)\b/.test(c.normalized),
    run: async (c) => {
      const auth = requireSignIn(c.userId);
      if (auth) return reply(auth);
      try {
        const data = (await runTool(c.userId!, "users", "get_app_order")) as {
          app_order?: string[];
        };
        const order = data?.app_order ?? (data as { appOrder?: string[] })?.appOrder;
        if (!order?.length) return reply("Kayıtlı uygulama sırası yok.");
        return reply(`Ana ekran sıran:\n${order.map((id, i) => `${i + 1}. ${id}`).join("\n")}`);
      } catch (e) {
        return reply(`Sıra alınamadı: ${toolErrorMessage(e)}`);
      }
    },
  },
];

const DEFAULT_REPLY =
  "Bu isteği henüz tanımıyorum. «yardım» yazarak deneyebileceğin komutları görebilirsin.";

export async function runStaticAssistantChat(params: {
  userId: string | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<AssistantChatReply> {
  const lastUser = [...params.messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content.trim()) {
    return reply(DEFAULT_REPLY);
  }

  const ctx: ChatContext = {
    userId: params.userId?.trim() || null,
    text: lastUser.content,
    normalized: normalize(lastUser.content),
  };

  for (const rule of RULES) {
    if (rule.test(ctx)) {
      return rule.run(ctx);
    }
  }

  return reply(DEFAULT_REPLY);
}
