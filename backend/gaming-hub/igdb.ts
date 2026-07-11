import { secret } from "encore.dev/config";

const IGDB_BASE = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

const twitchClientId = secret("TwitchClientId");
const twitchClientSecret = secret("TwitchClientSecret");

export interface IgdbGame {
  id: number;
  name: string;
  cover?: { image_id: string };
  genres?: { name: string }[];
  platforms?: { name: string }[];
  rating?: number;
  summary?: string;
}

export interface CatalogGame {
  gameId: string;
  title: string;
  coverUrl: string | null;
  genres: string[];
  platforms: string[];
  rating: number | null;
  summary: string | null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function coverUrl(imageId?: string): string | null {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}

export function mapIgdbGame(game: IgdbGame): CatalogGame {
  return {
    gameId: String(game.id),
    title: game.name,
    coverUrl: coverUrl(game.cover?.image_id),
    genres: game.genres?.map((g) => g.name) ?? [],
    platforms: game.platforms?.map((p) => p.name) ?? [],
    rating: game.rating != null ? Math.round(game.rating) / 10 : null,
    summary: game.summary ?? null,
  };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = twitchClientId();
  const clientSecret = twitchClientSecret();

  const res = await fetch(
    `${TWITCH_TOKEN_URL}?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error(`Twitch OAuth failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 120) * 1000,
  };

  return cachedToken.token;
}

async function igdbQuery<T>(endpoint: string, body: string): Promise<T[]> {
  const clientId = twitchClientId();
  const token = await getAccessToken();

  const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IGDB request failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T[];
}

const GAME_FIELDS =
  "fields id,name,cover.image_id,genres.name,platforms.name,rating,summary;";

export async function searchGames(query: string, limit = 10): Promise<CatalogGame[]> {
  const escaped = query.replace(/"/g, '\\"');
  const games = await igdbQuery<IgdbGame>(
    "games",
    `search "${escaped}"; ${GAME_FIELDS} limit ${limit};`
  );
  return games.map(mapIgdbGame);
}

export async function getGame(gameId: string): Promise<CatalogGame | null> {
  const id = parseInt(gameId, 10);
  if (Number.isNaN(id)) return null;

  const games = await igdbQuery<IgdbGame>(
    "games",
    `${GAME_FIELDS} where id = ${id};`
  );
  return games[0] ? mapIgdbGame(games[0]) : null;
}

export async function discoverCoopGames(limit = 20): Promise<CatalogGame[]> {
  const games = await igdbQuery<IgdbGame>(
    "games",
    `${GAME_FIELDS} where game_modes = (3) & rating > 60; sort rating desc; limit ${limit};`
  );
  return games.map(mapIgdbGame);
}

export async function discoverPopularGames(limit = 20): Promise<CatalogGame[]> {
  const games = await igdbQuery<IgdbGame>(
    "games",
    `${GAME_FIELDS} where rating > 75 & rating_count > 20; sort rating desc; limit ${limit};`
  );
  return games.map(mapIgdbGame);
}
