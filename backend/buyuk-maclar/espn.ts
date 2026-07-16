export type MatchSport = "football" | "basketball" | "volleyball" | "f1";
export type MatchState = "live" | "upcoming" | "finished";

export interface BigMatch {
  id: string;
  sport: MatchSport;
  competition: string;
  competitionTr: string;
  competitionSlug: string;
  home: string;
  away: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeScore: string | null;
  awayScore: string | null;
  state: MatchState;
  statusText: string;
  clock: string | null;
  startAt: string;
  venue: string | null;
}

interface CompetitionDef {
  sportPath: "soccer" | "basketball" | "racing" | "volleyball";
  slug: string;
  sport: MatchSport;
  name: string;
  nameTr: string;
  /** Prefer race session for F1 weekends. */
  kind?: "team" | "f1";
}

/** Major cups / finals / F1 weekends — not every league matchday. */
const COMPETITIONS: CompetitionDef[] = [
  {
    sportPath: "soccer",
    slug: "fifa.world",
    sport: "football",
    name: "FIFA World Cup",
    nameTr: "Dünya Kupası",
  },
  {
    sportPath: "soccer",
    slug: "fifa.wwc",
    sport: "football",
    name: "FIFA Women's World Cup",
    nameTr: "Kadınlar Dünya Kupası",
  },
  {
    sportPath: "soccer",
    slug: "uefa.european_championship",
    sport: "football",
    name: "UEFA Euro",
    nameTr: "Avrupa Şampiyonası",
  },
  {
    sportPath: "soccer",
    slug: "conmebol.america",
    sport: "football",
    name: "Copa América",
    nameTr: "Copa América",
  },
  {
    sportPath: "soccer",
    slug: "fifa.cwc",
    sport: "football",
    name: "FIFA Club World Cup",
    nameTr: "Kulüpler Dünya Kupası",
  },
  {
    sportPath: "soccer",
    slug: "uefa.champions",
    sport: "football",
    name: "UEFA Champions League",
    nameTr: "Şampiyonlar Ligi",
  },
  {
    sportPath: "basketball",
    slug: "nba",
    sport: "basketball",
    name: "NBA",
    nameTr: "NBA",
  },
  {
    sportPath: "racing",
    slug: "f1",
    sport: "f1",
    name: "Formula 1",
    nameTr: "Formula 1",
    kind: "f1",
  },
];

/** Free TheSportsDB leagues for volleyball majors / continental cups. */
const VOLLEYBALL_LEAGUES: Array<{
  id: string;
  name: string;
  nameTr: string;
}> = [
  {
    id: "5613",
    name: "European Volleyball Championship",
    nameTr: "Avrupa Voleybol Şampiyonası",
  },
  {
    id: "5848",
    name: "European Volleyball League",
    nameTr: "Avrupa Voleybol Ligi",
  },
  {
    id: "5849",
    name: "Women's European Volleyball League",
    nameTr: "Kadınlar Avrupa Voleybol Ligi",
  },
];

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  order?: number;
  team?: {
    displayName?: string;
    shortDisplayName?: string;
    logo?: string;
  };
  athlete?: {
    displayName?: string;
    shortName?: string;
    flag?: { href?: string };
  };
}

interface EspnCompetition {
  date?: string;
  type?: { abbreviation?: string; text?: string };
  competitors?: EspnCompetitor[];
  venue?: { fullName?: string };
  status?: {
    displayClock?: string;
    type?: {
      state?: string;
      completed?: boolean;
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
}

interface EspnEvent {
  id?: string;
  name?: string;
  shortName?: string;
  date?: string;
  status?: {
    displayClock?: string;
    type?: {
      state?: string;
      completed?: boolean;
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
  competitions?: EspnCompetition[];
}

interface EspnScoreboard {
  events?: EspnEvent[];
  leagues?: Array<{ name?: string }>;
}

interface TsdbEvent {
  idEvent?: string;
  strEvent?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string;
  strTimestamp?: string;
  dateEvent?: string;
  strTime?: string;
  strVenue?: string;
  strLeague?: string;
}

const CACHE_TTL_MS = 45_000;
let cache: { at: number; matches: BigMatch[] } | null = null;

function yyyymmdd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function dateRangeQuery(daysAhead = 5): string {
  const start = new Date();
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + daysAhead);
  return `${yyyymmdd(start)}-${yyyymmdd(end)}`;
}

function mapEspnState(state?: string): MatchState {
  if (state === "in") return "live";
  if (state === "pre") return "upcoming";
  return "finished";
}

function pickSide(competitors: EspnCompetitor[] | undefined, side: "home" | "away") {
  return competitors?.find((c) => c.homeAway === side) ?? null;
}

function normalizeTeamEvent(event: EspnEvent, def: CompetitionDef): BigMatch | null {
  if (!event.id || !event.date) return null;
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors ?? [];
  const home = pickSide(competitors, "home");
  const away = pickSide(competitors, "away");
  if (!home?.team?.displayName || !away?.team?.displayName) return null;

  const state = mapEspnState(event.status?.type?.state);
  const status = event.status?.type;
  const clock =
    state === "live"
      ? event.status?.displayClock || status?.shortDetail || status?.detail || null
      : null;

  return {
    id: `${def.slug}:${event.id}`,
    sport: def.sport,
    competition: def.name,
    competitionTr: def.nameTr,
    competitionSlug: def.slug,
    home: home.team.displayName,
    away: away.team.displayName,
    homeLogo: home.team.logo || null,
    awayLogo: away.team.logo || null,
    homeScore: home.score ?? null,
    awayScore: away.score ?? null,
    state,
    statusText: status?.shortDetail || status?.description || status?.detail || "",
    clock,
    startAt: event.date,
    venue: competition?.venue?.fullName ?? null,
  };
}

function pickF1Session(comps: EspnCompetition[]): EspnCompetition | null {
  if (!comps.length) return null;
  const byAbbr = (abbr: string) =>
    comps.find((c) => (c.type?.abbreviation || "").toLowerCase() === abbr.toLowerCase());

  const race = byAbbr("Race");
  const raceState = mapEspnState(race?.status?.type?.state);
  if (race && (raceState === "live" || raceState === "finished")) return race;

  const order = ["Race", "Qual", "FP3", "FP2", "FP1"];
  for (const abbr of order) {
    const session = byAbbr(abbr);
    if (session?.status?.type?.state === "in") return session;
  }
  for (const abbr of order) {
    const session = byAbbr(abbr);
    if (session?.status?.type?.state === "pre") return session;
  }
  return race ?? comps[comps.length - 1] ?? null;
}

function normalizeF1Event(event: EspnEvent, def: CompetitionDef): BigMatch | null {
  if (!event.id) return null;
  const session = pickF1Session(event.competitions ?? []);
  const startAt = session?.date || event.date;
  if (!startAt) return null;

  const status = session?.status?.type || event.status?.type;
  const state = mapEspnState(status?.state);
  const sessionLabel =
    session?.type?.abbreviation || session?.type?.text || "Race";
  const gpName = event.shortName || event.name || "Grand Prix";

  const drivers = [...(session?.competitors ?? [])].sort(
    (a, b) => (a.order ?? 999) - (b.order ?? 999),
  );
  const p1 = drivers[0];
  const p2 = drivers[1];

  let home = gpName;
  let away = sessionLabel;
  let homeLogo: string | null = null;
  let awayLogo: string | null = null;
  let homeScore: string | null = null;
  let awayScore: string | null = null;

  if (p1?.athlete?.displayName && (state === "live" || state === "finished")) {
    home = p1.athlete.displayName;
    homeLogo = p1.athlete.flag?.href || null;
    homeScore = "P1";
    if (p2?.athlete?.displayName) {
      away = p2.athlete.displayName;
      awayLogo = p2.athlete.flag?.href || null;
      awayScore = "P2";
    } else {
      away = gpName;
    }
  }

  const clock =
    state === "live"
      ? session?.status?.displayClock || status?.shortDetail || status?.detail || null
      : null;

  return {
    id: `${def.slug}:${event.id}`,
    sport: "f1",
    competition: def.name,
    competitionTr: def.nameTr,
    competitionSlug: def.slug,
    home,
    away,
    homeLogo,
    awayLogo,
    homeScore,
    awayScore,
    state,
    statusText:
      state === "upcoming"
        ? `${gpName} · ${sessionLabel}`
        : status?.shortDetail || status?.description || sessionLabel,
    clock,
    startAt,
    venue: session?.venue?.fullName ?? null,
  };
}

async function fetchEspnCompetition(
  def: CompetitionDef,
  dates: string,
): Promise<BigMatch[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${def.sportPath}/${def.slug}/scoreboard?dates=${dates}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as EspnScoreboard;
    const matches: BigMatch[] = [];
    for (const event of data.events ?? []) {
      const match =
        def.kind === "f1"
          ? normalizeF1Event(event, def)
          : normalizeTeamEvent(event, def);
      if (match) matches.push(match);
    }
    return matches;
  } catch (err) {
    console.error(`buyuk-maclar ESPN fetch failed for ${def.slug}:`, err);
    return [];
  }
}

function mapTsdbState(status?: string): MatchState {
  const s = (status || "").toUpperCase();
  if (!s || s === "NS" || s === "NOT STARTED" || s === "TBD") return "upcoming";
  if (s === "FT" || s === "AET" || s === "PEN" || s === "CANC" || s === "PST") {
    return "finished";
  }
  // Live-ish codes: 1H, 2H, HT, LIVE, IN PLAY, etc.
  if (
    s === "LIVE" ||
    s === "HT" ||
    s === "1H" ||
    s === "2H" ||
    s === "IN PLAY" ||
    s === "INPLAY"
  ) {
    return "live";
  }
  // Numeric period or set scores often mean live
  if (/^\d/.test(s) || s.includes("SET")) return "live";
  return "finished";
}

function tsdbStartAt(event: TsdbEvent): string | null {
  if (event.strTimestamp) {
    const iso = event.strTimestamp.endsWith("Z")
      ? event.strTimestamp
      : `${event.strTimestamp}Z`;
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  if (event.dateEvent) {
    const time = (event.strTime || "00:00:00").slice(0, 8);
    const iso = `${event.dateEvent}T${time}Z`;
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  return null;
}

function normalizeTsdbVolleyball(
  event: TsdbEvent,
  league: { id: string; name: string; nameTr: string },
): BigMatch | null {
  if (!event.idEvent || !event.strHomeTeam || !event.strAwayTeam) return null;
  const startAt = tsdbStartAt(event);
  if (!startAt) return null;

  const state = mapTsdbState(event.strStatus);
  return {
    id: `vb:${league.id}:${event.idEvent}`,
    sport: "volleyball",
    competition: league.name,
    competitionTr: league.nameTr,
    competitionSlug: `vb-${league.id}`,
    home: event.strHomeTeam.replace(/\s+Volleyball(?:\s+Women)?$/i, "").trim() || event.strHomeTeam,
    away: event.strAwayTeam.replace(/\s+Volleyball(?:\s+Women)?$/i, "").trim() || event.strAwayTeam,
    homeLogo: event.strHomeTeamBadge || null,
    awayLogo: event.strAwayTeamBadge || null,
    homeScore: event.intHomeScore != null ? String(event.intHomeScore) : null,
    awayScore: event.intAwayScore != null ? String(event.intAwayScore) : null,
    state,
    statusText: event.strStatus || "",
    clock: state === "live" ? event.strStatus || null : null,
    startAt,
    venue: event.strVenue || null,
  };
}

function inVolleyballWindow(iso: string, now = Date.now()): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  // Continental cups are sparse — keep a wider lookahead than football scoreboards.
  const pastMs = 7 * 24 * 60 * 60 * 1000;
  const futureMs = 90 * 24 * 60 * 60 * 1000;
  return t >= now - pastMs && t <= now + futureMs;
}

async function fetchTsdbLeagueEvents(leagueId: string): Promise<TsdbEvent[]> {
  const base = "https://www.thesportsdb.com/api/v1/json/123";
  const urls = [
    `${base}/eventsnextleague.php?id=${leagueId}`,
    `${base}/eventspastleague.php?id=${leagueId}`,
  ];
  const all: TsdbEvent[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const data = (await res.json()) as { events?: TsdbEvent[] | null };
      for (const e of data.events ?? []) all.push(e);
    } catch (err) {
      console.error(`buyuk-maclar TSDB fetch failed for ${leagueId}:`, err);
    }
  }
  return all;
}

async function fetchVolleyballMatches(): Promise<BigMatch[]> {
  const batches = await Promise.all(
    VOLLEYBALL_LEAGUES.map(async (league) => {
      const events = await fetchTsdbLeagueEvents(league.id);
      return events
        .map((e) => normalizeTsdbVolleyball(e, league))
        .filter((m): m is BigMatch => !!m && inVolleyballWindow(m.startAt));
    }),
  );
  return batches.flat();
}

function sortMatches(a: BigMatch, b: BigMatch): number {
  const rank: Record<MatchState, number> = { live: 0, upcoming: 1, finished: 2 };
  const byState = rank[a.state] - rank[b.state];
  if (byState !== 0) return byState;
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

export async function fetchBigMatches(opts?: {
  sport?: MatchSport | "all";
  liveOnly?: boolean;
}): Promise<BigMatch[]> {
  const now = Date.now();
  if (!cache || now - cache.at > CACHE_TTL_MS) {
    const dates = dateRangeQuery(5);
    const [espnBatches, volleyball] = await Promise.all([
      Promise.all(COMPETITIONS.map((c) => fetchEspnCompetition(c, dates))),
      fetchVolleyballMatches(),
    ]);
    const byId = new Map<string, BigMatch>();
    for (const list of espnBatches) {
      for (const m of list) byId.set(m.id, m);
    }
    for (const m of volleyball) byId.set(m.id, m);
    cache = { at: now, matches: Array.from(byId.values()).sort(sortMatches) };
  }

  let matches = cache.matches;
  if (opts?.sport && opts.sport !== "all") {
    matches = matches.filter((m) => m.sport === opts.sport);
  }
  if (opts?.liveOnly) {
    matches = matches.filter((m) => m.state === "live");
  }
  return matches;
}

export function pickWatchSuggestion(matches: BigMatch[]): BigMatch | null {
  const live = matches.find((m) => m.state === "live");
  if (live) return live;
  const upcoming = matches.find((m) => m.state === "upcoming");
  return upcoming ?? null;
}
