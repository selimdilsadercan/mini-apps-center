"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CaretLeft,
  Trophy,
  Circle,
  Basketball,
  SoccerBall,
  Volleyball,
  FlagCheckered,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";
import { createBrowserClient } from "@/lib/api";
import type { buyuk_maclar } from "@/lib/client";
import { useLanguage } from "@/contexts/LanguageContext";

const ACCENT = "#059669";
const client = createBrowserClient();

type Match = buyuk_maclar.BigMatch;
type Tab = "all" | "live" | "football" | "basketball" | "volleyball" | "f1";

function sportIcon(sport: Match["sport"]) {
  if (sport === "basketball") return Basketball;
  if (sport === "volleyball") return Volleyball;
  if (sport === "f1") return FlagCheckered;
  return SoccerBall;
}

function formatKickoff(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function TeamSide({
  name,
  logo,
  score,
  align,
}: {
  name: string;
  logo: string | null;
  score: string | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-8 w-8 shrink-0 object-contain" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-surface-muted text-[10px] font-black text-app-muted">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-app-text">{name}</p>
      </div>
      {score != null && score !== "" && (
        <span className="shrink-0 text-lg font-black tabular-nums text-app-text">
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({ match, locale }: { match: Match; locale: string }) {
  const competition = locale === "en" ? match.competition : match.competitionTr;
  const isLive = match.state === "live";
  const SportIcon = sportIcon(match.sport);
  const divider = match.sport === "f1" ? "·" : "vs";

  return (
    <article className="rounded-2xl border border-app-border bg-app-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-app-muted">
          <SportIcon size={14} weight="fill" className="shrink-0 text-emerald-600" />
          <span className="truncate">{competition}</span>
        </div>
        {isLive ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-red-600">
            <Circle size={8} weight="fill" className="animate-pulse" />
            {match.clock || (locale === "en" ? "Live" : "Canlı")}
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wide text-app-muted">
            {match.state === "upcoming"
              ? formatKickoff(match.startAt, locale)
              : match.statusText || (locale === "en" ? "FT" : "Bitti")}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <TeamSide
          name={match.home}
          logo={match.homeLogo}
          score={match.state === "upcoming" ? null : match.homeScore}
          align="left"
        />
        <span className="shrink-0 text-[10px] font-black uppercase text-app-muted">
          {divider}
        </span>
        <TeamSide
          name={match.away}
          logo={match.awayLogo}
          score={match.state === "upcoming" ? null : match.awayScore}
          align="right"
        />
      </div>

      {match.venue && (
        <p className="mt-3 truncate text-[11px] text-app-muted">{match.venue}</p>
      )}
    </article>
  );
}

export default function BuyukMaclarPage() {
  const { locale } = useLanguage();
  const [tab, setTab] = useState<Tab>("all");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const listRes = await client.buyuk_maclar.listMatches({ sport: "all" });
      setMatches(listRes.matches);
      setFetchedAt(listRes.fetchedAt);
    } catch (e) {
      console.error(e);
      setError(
        locale === "en"
          ? "Could not load matches. Try again."
          : "Maçlar yüklenemedi. Tekrar dene.",
      );
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "live") return matches.filter((m) => m.state === "live");
    if (tab === "football") return matches.filter((m) => m.sport === "football");
    if (tab === "basketball") return matches.filter((m) => m.sport === "basketball");
    if (tab === "volleyball") return matches.filter((m) => m.sport === "volleyball");
    if (tab === "f1") return matches.filter((m) => m.sport === "f1");
    return matches;
  }, [matches, tab]);

  const liveCount = matches.filter((m) => m.state === "live").length;

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: locale === "en" ? "All" : "Tümü" },
    {
      id: "live",
      label: locale === "en" ? `Live${liveCount ? ` (${liveCount})` : ""}` : `Canlı${liveCount ? ` (${liveCount})` : ""}`,
    },
    { id: "football", label: locale === "en" ? "Football" : "Futbol" },
    { id: "basketball", label: locale === "en" ? "NBA" : "NBA" },
    { id: "volleyball", label: locale === "en" ? "Volleyball" : "Voleybol" },
    { id: "f1", label: "F1" },
  ];

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] ${
      active
        ? "bg-app-tab-active text-app-text shadow-sm"
        : "text-app-muted hover:text-app-text hover:bg-app-surface-muted/50"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="mx-auto w-full max-w-xl px-4 pb-3 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = getAppRootUrl();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-muted transition-all hover:text-app-text active:scale-95"
            >
              <CaretLeft size={14} weight="bold" style={{ color: ACCENT }} />
            </button>

            <h1 className="flex min-w-0 flex-1 items-center gap-1.5 text-base font-black uppercase leading-none tracking-tight text-app-text">
              <Trophy size={18} weight="fill" className="shrink-0" style={{ color: ACCENT }} />
              <span className="truncate">
                {locale === "en" ? (
                  <>
                    Big <span style={{ color: ACCENT }}>Matches</span>
                  </>
                ) : (
                  <>
                    Büyük <span style={{ color: ACCENT }}>Maçlar</span>
                  </>
                )}
              </span>
            </h1>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-muted transition-all hover:text-app-text active:scale-95 disabled:opacity-50"
              aria-label="Refresh"
            >
              <ArrowsClockwise
                size={14}
                weight="bold"
                className={loading ? "animate-spin" : ""}
                style={{ color: ACCENT }}
              />
            </button>
          </div>

          <div className="mt-2.5 flex max-w-full items-center gap-0.5 overflow-x-auto rounded-2xl border border-app-border bg-app-tab-track p-1 no-scrollbar">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={tabClass(tab === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-10 pt-4">
        <p className="mb-3 text-xs text-app-muted">
          {locale === "en"
            ? "World Cup, Euro, UCL, NBA, F1 weekends & European volleyball — majors only."
            : "Dünya Kupası, Euro, UCL, NBA, F1 hafta sonları ve Avrupa voleybolu — sadece büyükler."}
        </p>

        {loading && matches.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-app-border bg-app-surface"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-app-surface p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-xl px-4 py-2 text-xs font-black uppercase text-white"
              style={{ backgroundColor: ACCENT }}
            >
              {locale === "en" ? "Retry" : "Tekrar dene"}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-app-border bg-app-surface p-8 text-center shadow-sm">
            <Trophy size={28} weight="duotone" className="mx-auto text-emerald-600" />
            <p className="mt-3 text-sm font-bold text-app-text">
              {locale === "en" ? "No matches in this view" : "Bu görünümde maç yok"}
            </p>
            <p className="mt-1 text-xs text-app-muted">
              {locale === "en"
                ? "When a World Cup or other major tournament is on, it shows up here."
                : "Dünya Kupası veya başka bir büyük turnuva varken burada görünür."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MatchCard key={m.id} match={m} locale={locale} />
            ))}
          </div>
        )}

        {fetchedAt && (
          <p className="mt-6 text-center text-[10px] text-app-muted">
            {locale === "en" ? "Updated" : "Güncellendi"}{" "}
            {formatKickoff(fetchedAt, locale)} · ESPN + TheSportsDB
          </p>
        )}
      </main>
    </div>
  );
}
