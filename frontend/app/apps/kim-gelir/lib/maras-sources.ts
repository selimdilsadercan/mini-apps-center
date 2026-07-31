import type { concert_list, film_graph, workplaces } from "@/lib/client";

export const MARAS_CITY = "kahramanmaras";

export const MARAS_CINEMA_DEFAULTS = [
  { slug: "piazza-kahramanmaras", name: "Paribu Cineverse Piazza", district: "Onikişubat" },
  { slug: "kahramanmaras-arsan-sinemasi", name: "Arsan Sineması", district: "Dulkadiroğlu" },
] as const;

export interface MarasCinema {
  slug: string;
  name: string;
  district: string;
  moviesToday: { title: string; times: string[]; posterUrl?: string }[];
}

export interface MarasEventOption {
  id: string;
  title: string;
  location: string;
  dateLabel: string;
  kind: "concert" | "campus" | "standup";
}

export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function matchesQuery(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return normalizeSearch(text).includes(normalizeSearch(query));
}

export function buildCinemasFromSessions(
  sessions: film_graph.CineverseSession[],
  movies: film_graph.CineverseMovie[],
): MarasCinema[] {
  const bySlug = new Map<string, MarasCinema>();

  for (const def of MARAS_CINEMA_DEFAULTS) {
    bySlug.set(def.slug, { ...def, moviesToday: [] });
  }

  for (const session of sessions) {
    const slug = session.theater_slug;
    const existing =
      bySlug.get(slug) ??
      ({
        slug,
        name: session.theater_name,
        district: "Kahramanmaraş",
        moviesToday: [],
      } satisfies MarasCinema);

    let movie = existing.moviesToday.find((m) => m.title === session.movie_title);
    if (!movie) {
      const meta = movies.find((m) => m.title === session.movie_title);
      movie = {
        title: session.movie_title,
        times: [],
        posterUrl: meta?.image_url,
      };
      existing.moviesToday.push(movie);
    }
    if (!movie.times.includes(session.time)) {
      movie.times.push(session.time);
    }
    bySlug.set(slug, existing);
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

export function filterWorkplacesByTypes(
  places: workplaces.Place[],
  types: string[],
  query = "",
): workplaces.Place[] {
  return places.filter((p) => {
    const venueTypes = p.types || [];
    const typeMatch = types.some((t) => venueTypes.includes(t));
    if (!typeMatch) return false;
    const haystack = [p.name, p.district, p.address, ...(p.tags || [])].filter(Boolean).join(" ");
    return matchesQuery(haystack, query);
  });
}

export function filterStudyPlaces(places: workplaces.Place[], query = ""): workplaces.Place[] {
  const studyTypes = ["library", "coworking", "cafe"];
  return filterWorkplacesByTypes(places, studyTypes, query);
}

export function filterFoodPlaces(places: workplaces.Place[], query = ""): workplaces.Place[] {
  return filterWorkplacesByTypes(places, ["restaurant", "dessert", "cafe"], query);
}

export function filterCafePlaces(places: workplaces.Place[], query = ""): workplaces.Place[] {
  return filterWorkplacesByTypes(places, ["cafe"], query);
}

export function filterTheaterVenues(places: workplaces.Place[], query = ""): workplaces.Place[] {
  return places.filter((p) => {
    const haystack = [p.name, p.district, p.address, ...(p.tags || []), ...(p.types || [])]
      .filter(Boolean)
      .join(" ");
    const isVenue =
      /kültür|kultur|tiyatro|merkez|salon|konser|etkinlik|mehmet akif|arsan/i.test(haystack) ||
      (p.types || []).some((t) => ["library"].includes(t) === false && /event|venue/i.test(t));
    if (!isVenue && !/mehmet akif|kafum|arsan sinema|piazza|devlet tiyatro/i.test(p.name)) {
      return false;
    }
    return matchesQuery(haystack, query);
  });
}

export function buildEventOptions(
  concerts: concert_list.UpcomingConcert[],
  campusEvents: { id: string; title: string; location?: string | null; event_date: string }[],
  standupShows: { id: string; title: string; venue_name?: string | null; show_date: string }[],
): MarasEventOption[] {
  const now = Date.now();
  const options: MarasEventOption[] = [];

  for (const c of concerts) {
    const t = Date.parse(c.date);
    if (!Number.isNaN(t) && t < now - 24 * 60 * 60 * 1000) continue;
    options.push({
      id: `concert-${c.id}`,
      title: c.artist,
      location: c.venue || "Kahramanmaraş",
      dateLabel: formatEventDate(c.date),
      kind: "concert",
    });
  }

  for (const e of campusEvents) {
    const t = Date.parse(e.event_date);
    if (!Number.isNaN(t) && t < now - 24 * 60 * 60 * 1000) continue;
    options.push({
      id: `campus-${e.id}`,
      title: e.title,
      location: e.location || "Kahramanmaraş",
      dateLabel: formatEventDate(e.event_date),
      kind: "campus",
    });
  }

  for (const s of standupShows) {
    const t = Date.parse(s.show_date);
    if (!Number.isNaN(t) && t < now - 24 * 60 * 60 * 1000) continue;
    options.push({
      id: `standup-${s.id}`,
      title: s.title,
      location: s.venue_name || "Kahramanmaraş",
      dateLabel: formatEventDate(s.show_date),
      kind: "standup",
    });
  }

  return options.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel, "tr"));
}

function formatEventDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    });
  } catch {
    return iso;
  }
}

export interface NeYapsakSuggestion {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  presetId: string;
  location: string;
  timeOption?: string;
}

export function buildNeYapsakSuggestions(input: {
  cinemas: MarasCinema[];
  studyPlaces: workplaces.Place[];
  events: MarasEventOption[];
}): NeYapsakSuggestion[] {
  const suggestions: NeYapsakSuggestion[] = [];

  const cinemaWithMovie = input.cinemas.find((c) => c.moviesToday.length > 0);
  if (cinemaWithMovie) {
    const movie = cinemaWithMovie.moviesToday[0];
    const times = [...movie.times].sort();
    suggestions.push({
      id: "cinema",
      icon: "🎬",
      title: movie.title,
      subtitle: `${cinemaWithMovie.name}${times[0] ? ` · ${times[0]}` : ""}`,
      presetId: "movie",
      location: `${cinemaWithMovie.name} (${cinemaWithMovie.district})`,
      timeOption: "Bugün akşam",
    });
  } else if (input.cinemas[0]) {
    suggestions.push({
      id: "cinema-empty",
      icon: "🎬",
      title: "Sinema",
      subtitle: input.cinemas.map((c) => c.name).join(" · "),
      presetId: "movie",
      location: `${input.cinemas[0].name} (${input.cinemas[0].district})`,
    });
  }

  const study = input.studyPlaces[0];
  if (study) {
    suggestions.push({
      id: "study",
      icon: "📚",
      title: "Birlikte çalışalım",
      subtitle: `${study.name}${study.district ? ` · ${study.district}` : ""}`,
      presetId: "study",
      location: `${study.name}${study.district ? ` (${study.district})` : ""}`,
      timeOption: "Şimdi",
    });
  }

  const nextEvent = input.events[0];
  if (nextEvent) {
    const presetId =
      nextEvent.kind === "concert" ? "concert" : nextEvent.kind === "standup" ? "standup" : "festival";
    suggestions.push({
      id: nextEvent.id,
      icon: nextEvent.kind === "concert" ? "🎵" : nextEvent.kind === "standup" ? "🎙️" : "🎪",
      title: nextEvent.title,
      subtitle: `${nextEvent.location} · ${nextEvent.dateLabel}`,
      presetId,
      location: nextEvent.location,
      timeOption: "Yarın",
    });
  }

  return suggestions.slice(0, 4);
}

export function buildKimGelirPrefillUrl(s: NeYapsakSuggestion): string {
  const params = new URLSearchParams({
    preset: s.presetId,
    title: s.title,
    location: s.location,
  });
  if (s.timeOption) params.set("time", s.timeOption);
  return `/apps/kim-gelir/create?${params.toString()}`;
}
