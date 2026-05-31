import type { AssistantCard } from "../lib/assistant-card-types";

export function asRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["items", "subscriptions", "movies", "dishes", "chocolates", "games"]) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function mapKilerCards(data: unknown): AssistantCard[] {
  return asRows(data).map((r) => ({
    type: "kiler" as const,
    data: {
      id: str(r.id),
      name: str(r.name ?? r.name_param, "?"),
      amount: num(r.amount ?? r.amount_param, 1),
      unit: str(r.unit ?? r.unit_param, "adet"),
      storageType: str(r.storage_type ?? r.storage_type_param, "pantry"),
      expiryDate: r.expiry_date ?? r.expiry_date_param ?? null,
    },
  }));
}

export function mapSubcenterCards(data: unknown): AssistantCard[] {
  return asRows(data).map((r) => ({
    type: "subcenter" as const,
    data: {
      id: str(r.id),
      name: str(r.name, "?"),
      price: num(r.price),
      currency: str(r.currency, "TRY"),
      cycle: str(r.cycle, "monthly"),
      category: str(r.category, "Other"),
      color: str(r.color, "#6366F1"),
      icon: str(r.icon, "💳"),
      startDate: str(r.start_date, ""),
      planName: str(r.plan_name, "Standard"),
    },
  }));
}

export function mapRecipeCards(data: unknown): AssistantCard[] {
  return asRows(data).map((r) => ({
    type: "recipe" as const,
    data: {
      id: str(r.id),
      title: str(r.title ?? r.title_param, "?"),
    },
  }));
}

export function mapConcertCards(data: unknown): AssistantCard[] {
  return asRows(data).map((r) => ({
    type: "concert" as const,
    data: {
      id: str(r.id),
      artist: str(r.artist, "?"),
      date: str(r.date, ""),
      venue: str(r.venue, ""),
      rating: r.rating ?? null,
    },
  }));
}

export function mapHobbyCards(data: unknown): AssistantCard[] {
  return asRows(data).map((r) => ({
    type: "hobby" as const,
    data: {
      id: str(r.hobby_id ?? r.id),
      title: str(r.title ?? r.name ?? r.hobby_id, "?"),
      status: str(r.status, "interested"),
    },
  }));
}

export function mapChocolateCards(data: unknown): AssistantCard[] {
  const rows = asRows(data);
  const list =
    rows.length > 0
      ? rows
      : asRows((data as Record<string, unknown>)?.chocolates);
  return list.slice(0, 12).map((r) => ({
    type: "chocolate" as const,
    data: {
      id: str(r.id ?? r.slug),
      name: str(r.name, "?"),
      brand: str(r.brand, ""),
      rating: r.avg_rating ?? r.rating ?? null,
    },
  }));
}

export function mapMemedexCards(data: unknown): AssistantCard[] {
  return asRows(data).slice(0, 12).map((r) => ({
    type: "memedex" as const,
    data: {
      id: str(r.id),
      title: str(r.title, "?"),
      trendStatus: str(r.trend_status ?? r.trendStatus, ""),
      mediaUrl: str(r.media_url ?? r.mediaUrl, ""),
    },
  }));
}

export function mapTournamentCards(data: unknown): AssistantCard[] {
  return asRows(data).map((r) => ({
    type: "tournament" as const,
    data: {
      id: str(r.id),
      name: str(r.name, "?"),
      slug: str(r.slug, ""),
      icon: str(r.icon, "🏆"),
      capacity: num(r.capacity),
    },
  }));
}

export function mapIskambilCards(data: unknown): AssistantCard[] {
  return asRows(data).slice(0, 12).map((r) => mapIskambilCard(r));
}

export function mapIskambilCard(r: Record<string, unknown>): AssistantCard {
  return {
    type: "iskambil" as const,
    data: {
      id: str(r.id),
      name: str(r.name ?? r.name_tr, "?"),
      category: str(r.category ?? r.category_tr, ""),
      categoryTr: str(r.category_tr ?? r.category, ""),
      isFavorite: Boolean(r.is_favorite),
      isKnown: Boolean(r.is_known),
    },
  };
}

export function pickRandomIskambilCard(data: unknown): AssistantCard | null {
  const rows = asRows(data);
  if (!rows.length) return null;
  const pick = rows[Math.floor(Math.random() * rows.length)];
  return mapIskambilCard(pick);
}

export function mapItuDishCards(data: unknown): AssistantCard[] {
  const dishes = asRows((data as Record<string, unknown>)?.dishes ?? data);
  return dishes.map((r) => ({
    type: "itu-dish" as const,
    data: {
      name: str(r.name, "?"),
      category: str(r.category, ""),
    },
  }));
}

export function mapMovieCards(data: unknown): AssistantCard[] {
  const movies = asRows((data as Record<string, unknown>)?.movies ?? data);
  return movies.slice(0, 10).map((r) => ({
    type: "movie" as const,
    data: {
      id: num(r.id),
      title: str(r.title, "?"),
      releaseDate: str(r.release_date, ""),
      voteAverage: num(r.vote_average),
      posterPath: r.poster_path ?? null,
    },
  }));
}

export function mapFriendCards(data: unknown): AssistantCard[] {
  return asRows(data).map((r) => ({
    type: "friend" as const,
    data: {
      id: str(r.id ?? r.friend_clerk_id ?? r.sender_clerk_id),
      username: str(r.username, "?"),
      avatarUrl: r.avatar_url ?? r.avatar ?? null,
    },
  }));
}

export function kilerCardFromInput(input: {
  name: string;
  amount: number;
  unit: string;
  storageType: string;
}): AssistantCard {
  return {
    type: "kiler",
    data: {
      id: "new",
      name: input.name,
      amount: input.amount,
      unit: input.unit,
      storageType: input.storageType,
      expiryDate: null,
    },
  };
}

export function subcenterCardFromInput(input: {
  name: string;
  price: number;
  currency: string;
  cycle: string;
  category: string;
  color: string;
  icon: string;
}): AssistantCard {
  return {
    type: "subcenter",
    data: {
      id: "new",
      name: input.name,
      price: input.price,
      currency: input.currency,
      cycle: input.cycle,
      category: input.category,
      color: input.color,
      icon: input.icon,
      startDate: new Date().toISOString().slice(0, 10),
      planName: "Standard",
    },
  };
}

export function mergeResultCard(
  cards: AssistantCard[],
  result: unknown,
  mapper: (data: unknown) => AssistantCard[],
): AssistantCard[] {
  const fromResult = mapper(result);
  if (fromResult.length === 1) return fromResult;
  if (fromResult.length > 0) return fromResult;
  return cards;
}
