import * as fs from "fs/promises";
import * as path from "path";
import axios from "axios";
import { parse } from "node-html-parser";
import type { AssistantExecutor } from "../lib/assistant-types";
import {
  optionalNumber,
  optionalString,
  requireNumber,
  requireString,
} from "../lib/assistant-params";
import { runRpc } from "../lib/assistant-tool-error";
import { getAssistantSupabase } from "./supabase";
import { loadIskambilGamesForUser } from "../iskambil/load-games";

const TMDB_API_KEY = "cb4898718f8913cfdfa5d7ca0f99344e";
const TMDB_BASE = "https://api.themoviedb.org/3";
const MOVIES_DATA_PATH = path.join(
  process.cwd(),
  "movies-this-year",
  "data",
  "movies_2026.json",
);

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

async function fetchTmdbMovies(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB isteği başarısız: ${response.status}`);
  }
  const data = (await response.json()) as { results?: unknown[] };
  return { movies: data.results ?? [] };
}

const kilerExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("kiler");
  switch (toolName) {
    case "list_items":
      return runRpc("list_items", () => db.rpc("get_items", { clerk_id_param: userId }));
    case "add_item":
      return runRpc("add_item", () =>
        db.rpc("add_item", {
          clerk_id_param: userId,
          name_param: requireString(args, "name"),
          amount_param: requireNumber(args, "amount"),
          unit_param: requireString(args, "unit"),
          storage_type_param: requireString(args, "storageType"),
          purchase_date_param: requireString(args, "purchaseDate"),
          expiry_date_param: optionalString(args, "expiryDate"),
        }),
      );
    case "delete_item":
      return runRpc("delete_item", () =>
        db.rpc("delete_item", {
          clerk_id_param: userId,
          item_id_param: requireString(args, "id"),
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const subcenterExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("subcenter");
  switch (toolName) {
    case "list_subscriptions":
      return runRpc("list_subscriptions", () =>
        db.rpc("get_user_items", { clerk_id_param: userId }),
      );
    case "create_subscription":
      return runRpc("create_subscription", () =>
        db.rpc("create_item", {
          clerk_id_param: userId,
          name_param: requireString(args, "name"),
          plan_name_param: optionalString(args, "planName") ?? "Standard",
          region_param: optionalString(args, "region") ?? "TR",
          price_param: requireNumber(args, "price"),
          currency_param: requireString(args, "currency"),
          cycle_param: requireString(args, "cycle"),
          category_param: requireString(args, "category"),
          color_param: requireString(args, "color"),
          icon_param: requireString(args, "icon"),
          start_date_param: requireString(args, "startDate"),
          trial_duration_param: optionalNumber(args, "trialDuration"),
          website_param: optionalString(args, "website"),
        }),
      );
    case "update_subscription":
      return runRpc("update_subscription", () =>
        db.rpc("update_item", {
          item_id_param: requireString(args, "id"),
          clerk_id_param: userId,
          name_param: requireString(args, "name"),
          plan_name_param: optionalString(args, "planName") ?? "Standard",
          region_param: optionalString(args, "region") ?? "TR",
          price_param: requireNumber(args, "price"),
          currency_param: requireString(args, "currency"),
          cycle_param: requireString(args, "cycle"),
          category_param: requireString(args, "category"),
          color_param: requireString(args, "color"),
          icon_param: requireString(args, "icon"),
          start_date_param: requireString(args, "startDate"),
          trial_duration_param: optionalNumber(args, "trialDuration"),
          website_param: optionalString(args, "website"),
        }),
      );
    case "delete_subscription":
      return runRpc("delete_subscription", () =>
        db.rpc("delete_item", {
          item_id_param: requireString(args, "id"),
          clerk_id_param: userId,
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const recipeExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("recipe");
  switch (toolName) {
    case "list_recipes":
      return runRpc("list_recipes", () =>
        db.rpc("get_user_recipes", { user_id_param: userId }),
      );
    case "create_recipe":
      return runRpc("create_recipe", () =>
        db.rpc("create", {
          title_param: requireString(args, "title"),
          user_id_param: userId,
          ingredients_param: args.ingredients ?? null,
          instructions_param: args.instructions ?? null,
        }),
      );
    case "update_recipe":
      return runRpc("update_recipe", () =>
        db.rpc("update", {
          recipe_id_param: requireString(args, "id"),
          user_id_param: userId,
          title_param: requireString(args, "title"),
          ingredients_param: args.ingredients ?? null,
          instructions_param: args.instructions ?? null,
        }),
      );
    case "delete_recipe":
      return runRpc("delete_recipe", () =>
        db.rpc("delete", {
          recipe_id_param: requireString(args, "id"),
          user_id_param: userId,
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const concertListExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("concert_list");
  switch (toolName) {
    case "list_concerts":
      return runRpc("list_concerts", () =>
        db.rpc("get_concerts", { clerk_id_param: userId }),
      );
    case "add_concert":
      return runRpc("add_concert", () =>
        db.rpc("add_concert", {
          clerk_id_param: userId,
          artist_param: requireString(args, "artist"),
          date_param: requireString(args, "date"),
          venue_param: optionalString(args, "venue"),
          notes_param: optionalString(args, "notes"),
          rating_param: optionalNumber(args, "rating"),
        }),
      );
    case "delete_concert":
      return runRpc("delete_concert", () =>
        db.rpc("delete_concert", {
          clerk_id_param: userId,
          concert_id_param: requireString(args, "id"),
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const hobbyCenterExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("hobby_center");
  switch (toolName) {
    case "list_hobbies":
      return runRpc("list_hobbies", () =>
        db.rpc("get_user_hobbies", { clerk_id_param: userId }),
      );
    case "update_hobby":
      return runRpc("update_hobby", () =>
        db.rpc("update_user_hobby", {
          clerk_id_param: userId,
          hobby_id_param: requireString(args, "hobbyId"),
          status_param: requireString(args, "status"),
          notes_param: requireString(args, "notes"),
          completed_steps_param: args.completedSteps ?? [],
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const mapTrackerExecutor: AssistantExecutor = async ({ toolName, args }) => {
  const db = getAssistantSupabase().schema("map_tracker");
  switch (toolName) {
    case "get_data":
      return runRpc("get_data", () => db.rpc("get_data"));
    case "import_items":
      return runRpc("import_items", () =>
        db.rpc("import_items", {
          p_list_name: requireString(args, "listName"),
          p_items: args.items,
        }),
      );
    case "toggle_visited":
      return runRpc("toggle_visited", () =>
        db.rpc("toggle_visited", { p_id: requireString(args, "id") }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const chocolateDbExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("chocolate_db");
  switch (toolName) {
    case "list_chocolates":
      return runRpc("list_chocolates", () =>
        db.rpc("get_chocolates", { p_clerk_id: userId }),
      );
    case "set_user_state":
      return runRpc("set_user_state", () =>
        db.rpc("set_user_state", {
          p_clerk_id: userId,
          p_chocolate_id: requireString(args, "chocolateId"),
          p_state: optionalString(args, "state"),
        }),
      );
    case "add_review":
      return runRpc("add_review", () =>
        db.rpc("add_review", {
          p_chocolate_id: requireString(args, "chocolateId"),
          p_rating: requireNumber(args, "rating"),
          p_comment: optionalString(args, "comment"),
          p_reviewer_name: optionalString(args, "reviewerName") ?? "Anonim",
          p_clerk_id: userId,
        }),
      );
    case "delete_review":
      return runRpc("delete_review", () =>
        db.rpc("delete_review", {
          p_chocolate_id: requireString(args, "chocolateId"),
          p_clerk_id: userId,
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const memedexExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("memedex");
  switch (toolName) {
    case "list_memes":
      return runRpc("list_memes", () =>
        db.rpc("get_memes", {
          search_param: optionalString(args, "search") ?? "",
          tag_param: "",
          trend_param: "",
          parent_id_param: null,
          only_parents_param: true,
          limit_param: 32,
          offset_param: 0,
        }),
      );
    case "create_meme":
      return runRpc("create_meme", () =>
        db.rpc("create_meme", {
          title_param: requireString(args, "title"),
          description_param: optionalString(args, "description") ?? "",
          context_param: optionalString(args, "context") ?? "",
          example_param: optionalString(args, "example") ?? "",
          trend_status_param: optionalString(args, "trendStatus") ?? "stable",
          media_url_param: optionalString(args, "mediaUrl") ?? "",
          tags_param: args.tags ?? [],
          created_by_param: userId,
          parent_id_param: null,
        }),
      );
    case "update_meme":
      return runRpc("update_meme", () =>
        db.rpc("update_meme", {
          id_param: requireString(args, "id"),
          title_param: requireString(args, "title"),
          trend_status_param: requireString(args, "trendStatus"),
          media_url_param: requireString(args, "mediaUrl"),
        }),
      );
    case "delete_meme":
      return runRpc("delete_meme", () =>
        db.rpc("delete_meme", { id_param: requireString(args, "id") }),
      );
    case "like_meme":
      return runRpc("like_meme", () =>
        db.rpc("like_meme", { id_param: requireString(args, "id") }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const tournamentExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("tournament");
  switch (toolName) {
    case "list_tournaments":
      return runRpc("list_tournaments", () => db.rpc("get_tournaments"));
    case "create_tournament":
      return runRpc("create_tournament", () =>
        db.rpc("create_tournament", {
          name_param: requireString(args, "name"),
          slug_param: requireString(args, "slug"),
          icon_param: optionalString(args, "icon") ?? "🏆",
          capacity_param: requireNumber(args, "capacity"),
          format_param: requireString(args, "format"),
          league_match_count_param: optionalNumber(args, "leagueMatchCount") ?? 3,
          advance_count_param: optionalNumber(args, "advanceCount") ?? 4,
          players_per_match_param: optionalNumber(args, "playersPerMatch") ?? 2,
          admin_clerk_id: userId,
        }),
      );
    case "join_tournament":
      return runRpc("join_tournament", () =>
        db.rpc("join_tournament", {
          slug_param: requireString(args, "slug"),
          clerk_id_param: userId,
          username_param: requireString(args, "username"),
          avatar_param: optionalString(args, "avatar"),
          avoid_list_param: args.avoidList ?? [],
        }),
      );
    case "update_match_score":
      return runRpc("update_match_score", () =>
        db.rpc("update_match_score", {
          match_id: requireString(args, "matchId"),
          scores_param: args.scores,
        }),
      );
    case "delete_tournament":
      return runRpc("delete_tournament", () =>
        db.rpc("delete_tournament", {
          slug_param: requireString(args, "slug"),
          admin_clerk_id: userId,
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const iskambilExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("iskambil");
  switch (toolName) {
    case "list_games":
      return runRpc("list_games", () =>
        loadIskambilGamesForUser(getAssistantSupabase(), userId),
      );
    case "toggle_favorite":
      return runRpc("toggle_favorite", () =>
        db.rpc("toggle_favorite", {
          clerk_id_param: userId,
          game_id_param: requireString(args, "gameId"),
        }),
      );
    case "toggle_known":
      return runRpc("toggle_known", () =>
        db.rpc("toggle_known", {
          clerk_id_param: userId,
          game_id_param: requireString(args, "gameId"),
        }),
      );
    case "save_note":
      return runRpc("save_note", () =>
        db.rpc("save_note", {
          clerk_id_param: userId,
          game_id_param: requireString(args, "gameId"),
          note_param: requireString(args, "note"),
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const iconSetGuideExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase().schema("icon_set_guide");
  switch (toolName) {
    case "list_icon_sets":
      return runRpc("list_icon_sets", () =>
        db.rpc("get_icon_sets", { clerk_id_param: userId }),
      );
    case "toggle_favorite":
      return runRpc("toggle_favorite", () =>
        db.rpc("toggle_favorite", {
          clerk_id_param: userId,
          icon_set_id_param: requireString(args, "iconSetId"),
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const ituYemekhaneExecutor: AssistantExecutor = async ({ toolName, args }) => {
  const db = getAssistantSupabase().schema("itu_yemekhane");
  switch (toolName) {
    case "get_menu":
      return runRpc("get_menu", () => fetchItuMenu());
    case "toggle_dislike":
      return runRpc("toggle_dislike", () =>
        db.rpc("toggle_dislike", { dish_name_param: requireString(args, "dishName") }),
      );
    case "list_disliked":
      return runRpc("list_disliked", () => db.rpc("get_dislikes"));
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const moviesThisYearExecutor: AssistantExecutor = async ({ toolName }) => {
  switch (toolName) {
    case "list_movies":
      return runRpc("list_movies", async () => {
        const raw = await fs.readFile(MOVIES_DATA_PATH, "utf-8");
        return { movies: JSON.parse(raw) };
      });
    case "list_upcoming":
      return runRpc("list_upcoming", () =>
        fetchTmdbMovies(
          `${TMDB_BASE}/movie/upcoming?api_key=${TMDB_API_KEY}&language=tr-TR&region=TR`,
        ),
      );
    case "list_top_rated":
      return runRpc("list_top_rated", () =>
        fetchTmdbMovies(
          `${TMDB_BASE}/movie/top_rated?api_key=${TMDB_API_KEY}&language=tr-TR`,
        ),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const friendshipExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase();
  switch (toolName) {
    case "list_friends":
      return runRpc("list_friends", () =>
        db.rpc("get_friends", { clerk_id_param: userId }),
      );
    case "list_pending_requests":
      return runRpc("list_pending_requests", () =>
        db.rpc("get_pending_requests", { clerk_id_param: userId }),
      );
    case "send_friend_request":
      return runRpc("send_friend_request", () =>
        db.rpc("send_friend_request", {
          sender_clerk_id: userId,
          receiver_clerk_id: requireString(args, "targetClerkId"),
        }),
      );
    case "accept_friend_request":
      return runRpc("accept_friend_request", () =>
        db.rpc("accept_friend_request", {
          receiver_clerk_id: userId,
          sender_clerk_id: requireString(args, "friendClerkId"),
        }),
      );
    case "reject_friend_request":
      return runRpc("reject_friend_request", () =>
        db.rpc("reject_friend_request", {
          receiver_clerk_id: userId,
          sender_clerk_id: requireString(args, "friendClerkId"),
        }),
      );
    case "remove_friend":
      return runRpc("remove_friend", () =>
        db.rpc("remove_friend", {
          user_clerk_id: userId,
          friend_clerk_id: requireString(args, "friendClerkId"),
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

const usersExecutor: AssistantExecutor = async ({ userId, toolName, args }) => {
  const db = getAssistantSupabase();
  switch (toolName) {
    case "get_app_order":
      return runRpc("get_app_order", () =>
        db.rpc("get_user_preferences", { clerk_id_param: userId }),
      );
    case "update_app_order":
      return runRpc("update_app_order", () =>
        db.rpc("update_user_app_order", {
          clerk_id_param: userId,
          app_order_param: args.appOrder,
        }),
      );
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

export const ASSISTANT_EXECUTORS: Record<string, AssistantExecutor> = {
  kiler: kilerExecutor,
  subcenter: subcenterExecutor,
  recipe: recipeExecutor,
  "concert-list": concertListExecutor,
  "hobby-center": hobbyCenterExecutor,
  "map-tracker": mapTrackerExecutor,
  "chocolate-db": chocolateDbExecutor,
  memedex: memedexExecutor,
  tournament: tournamentExecutor,
  iskambil: iskambilExecutor,
  "icon-set-guide": iconSetGuideExecutor,
  "itu-yemekhane": ituYemekhaneExecutor,
  "movies-this-year": moviesThisYearExecutor,
  friendship: friendshipExecutor,
  users: usersExecutor,
};
