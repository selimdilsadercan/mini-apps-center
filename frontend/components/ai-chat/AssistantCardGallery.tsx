"use client";

import { useState } from "react";
import Link from "next/link";
import type { AssistantCard } from "@/lib/assistant-cards";
import { Calendar, MusicNotes, Trophy, User } from "@phosphor-icons/react";
import { iskambilSuitSymbol } from "@/components/ai-chat/iskambil-utils";
import IskambilGameModal from "@/components/ai-chat/IskambilGameModal";

const APP_LINKS: Partial<Record<string, string>> = {
  subcenter: "/apps/subcenter",
  kiler: "/apps/kiler",
  recipe: "/apps/recipe",
  "concert-list": "/apps/concert-list",
  "hobby-center": "/apps/hobby-center",
  "chocolate-db": "/apps/chocolate-db",
  memedex: "/apps/memedex",
  tournament: "/apps/tournament",
  iskambil: "/apps/iskambil",
  "itu-yemekhane": "/apps/itu-yemekhane",
  "movies-this-year": "/apps/movies-this-year",
  friendship: "/friends",
};

function str(data: Record<string, unknown>, key: string, fallback = ""): string {
  const v = data[key];
  return v == null ? fallback : String(v);
}

function num(data: Record<string, unknown>, key: string, fallback = 0): number {
  const n = Number(data[key]);
  return Number.isFinite(n) ? n : fallback;
}

function SubcenterCard({ data }: { data: Record<string, unknown> }) {
  const color = str(data, "color", "#6366F1");
  const cycle = str(data, "cycle", "monthly");
  const currency = str(data, "currency", "TRY");
  const price = num(data, "price");
  const priceText =
    currency === "USD" ? `$${price}` : currency === "EUR" ? `€${price}` : `₺${price}`;

  return (
    <div className="flex-shrink-0 w-[220px] bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      <div className="p-4 flex flex-col gap-3 min-h-[140px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">
              {str(data, "icon", "💳")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-800 truncate">{str(data, "name", "?")}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {str(data, "category", "Other")}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-black text-slate-800">{priceText}</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase">
              /{cycle === "yearly" ? "yıl" : "ay"}
            </p>
          </div>
        </div>
        <div className="mt-auto flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
          <Calendar size={12} />
          <span>{str(data, "planName", "Standard")}</span>
        </div>
      </div>
    </div>
  );
}

function KilerCard({ data }: { data: Record<string, unknown> }) {
  const storage = str(data, "storageType", "pantry");
  const styles =
    storage === "freezer"
      ? "from-cyan-500 to-cyan-700 border-cyan-900"
      : storage === "fridge"
        ? "from-indigo-500 to-indigo-700 border-indigo-900"
        : "from-orange-400 to-orange-600 border-orange-800";

  return (
    <div
      className={`flex-shrink-0 w-[130px] aspect-[4/5.5] rounded-2xl bg-gradient-to-br ${styles} border-b-[8px] shadow-lg overflow-hidden text-white`}
    >
      <div className="h-full p-3 flex flex-col justify-between relative z-10">
        <span className="text-[9px] font-bold uppercase opacity-80">
          {storage === "freezer" ? "Dondurucu" : storage === "fridge" ? "Buzdolabı" : "Kiler"}
        </span>
        <div>
          <p className="text-sm font-black leading-tight line-clamp-2">{str(data, "name", "?")}</p>
          <p className="text-[11px] font-semibold opacity-90 mt-1">
            {num(data, "amount")} {str(data, "unit", "adet")}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex-shrink-0 w-[160px] rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-orange-200/60 p-4 shadow-sm">
      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-1">Tarif</p>
      <p className="text-sm font-black text-gray-900 line-clamp-3">{str(data, "title", "?")}</p>
    </div>
  );
}

function ConcertCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex-shrink-0 w-[180px] rounded-2xl bg-zinc-900 text-white p-4 shadow-lg">
      <MusicNotes size={20} weight="fill" className="text-violet-400 mb-2" />
      <p className="text-sm font-black line-clamp-2">{str(data, "artist", "?")}</p>
      {str(data, "date") && (
        <p className="text-[11px] text-zinc-400 mt-1">{str(data, "date")}</p>
      )}
      {str(data, "venue") && (
        <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{str(data, "venue")}</p>
      )}
    </div>
  );
}

function HobbyCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex-shrink-0 w-[150px] rounded-2xl bg-violet-50 border border-violet-100 p-4">
      <p className="text-sm font-black text-violet-900 line-clamp-2">{str(data, "title", "?")}</p>
      <p className="text-[10px] font-bold text-violet-500 uppercase mt-2">{str(data, "status", "")}</p>
    </div>
  );
}

function IskambilCard({
  data,
  onOpen,
}: {
  data: Record<string, unknown>;
  onOpen: (gameId: string) => void;
}) {
  const categoryTr = str(data, "categoryTr", str(data, "category"));
  const gameId = str(data, "id");
  const suit = iskambilSuitSymbol(categoryTr);

  return (
    <button
      type="button"
      onClick={() => gameId && onOpen(gameId)}
      className="flex-shrink-0 w-[190px] rounded-2xl bg-[#ffffff] border border-[#e2dec5] p-5 relative flex flex-col min-h-[200px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden text-left text-[#1a2d22]"
    >
      <div className="absolute -bottom-10 -right-10 text-[8rem] font-serif opacity-[0.05] pointer-events-none select-none">
        {suit}
      </div>
      <p className="text-sm font-black line-clamp-2 relative z-10">{str(data, "name", "?")}</p>
      <p className="text-[10px] text-[#5c6b62] mt-2 relative z-10">{categoryTr || str(data, "category")}</p>
      <div className="flex gap-2 mt-auto pt-4 text-[10px] font-bold relative z-10">
        {data.isFavorite ? <span className="text-amber-600">★ Favori</span> : null}
        {data.isKnown ? <span className="text-emerald-600">Bilinen</span> : null}
      </div>
      <p className="text-[10px] font-bold text-[#0c3122]/60 mt-2 relative z-10">Detay için tıkla</p>
    </button>
  );
}

function MovieCard({ data }: { data: Record<string, unknown> }) {
  const poster = data.posterPath as string | null;
  const posterUrl = poster ? `https://image.tmdb.org/t/p/w154${poster}` : null;

  return (
    <div className="flex-shrink-0 w-[120px]">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-gray-200 shadow-md relative">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt={str(data, "title")} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 p-2 text-center font-bold">
            {str(data, "title", "?")}
          </div>
        )}
      </div>
      <p className="text-[11px] font-bold text-gray-800 mt-1.5 line-clamp-2">{str(data, "title", "?")}</p>
      {num(data, "voteAverage") > 0 && (
        <p className="text-[10px] text-gray-500">★ {num(data, "voteAverage").toFixed(1)}</p>
      )}
    </div>
  );
}

function ItuDishCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex-shrink-0 w-[140px] rounded-xl bg-white border border-gray-200 px-3 py-2.5 shadow-sm">
      <p className="text-xs font-bold text-gray-900 line-clamp-2">{str(data, "name", "?")}</p>
      {str(data, "category") && (
        <p className="text-[10px] text-gray-500 mt-0.5">{str(data, "category")}</p>
      )}
    </div>
  );
}

function FriendCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex-shrink-0 w-[140px] rounded-2xl bg-white border border-gray-100 p-3 flex items-center gap-2 shadow-sm">
      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
        <User size={18} weight="bold" className="text-violet-600" />
      </div>
      <p className="text-sm font-bold text-gray-900 truncate">{str(data, "username", "?")}</p>
    </div>
  );
}

function TournamentCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex-shrink-0 w-[160px] rounded-2xl bg-slate-900 text-white p-4">
      <Trophy size={22} weight="fill" className="text-amber-400 mb-2" />
      <p className="text-sm font-black line-clamp-2">{str(data, "name", "?")}</p>
      <p className="text-[10px] text-slate-400 mt-1">Kapasite: {num(data, "capacity")}</p>
    </div>
  );
}

function MemedexCard({ data }: { data: Record<string, unknown> }) {
  const media = str(data, "mediaUrl");
  return (
    <div className="flex-shrink-0 w-[160px] rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
      {media ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media} alt="" className="w-full h-20 object-cover" />
      ) : (
        <div className="h-20 bg-violet-50" />
      )}
      <div className="p-2.5">
        <p className="text-xs font-bold line-clamp-2">{str(data, "title", "?")}</p>
      </div>
    </div>
  );
}

function ChocolateCard({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="flex-shrink-0 w-[140px] rounded-2xl bg-amber-950/90 text-amber-50 p-3 border border-amber-800">
      <p className="text-sm font-black line-clamp-2">{str(data, "name", "?")}</p>
      {str(data, "brand") && <p className="text-[10px] opacity-70 mt-1">{str(data, "brand")}</p>}
    </div>
  );
}

function HelpCard({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ title: string; icon: string; color: string; examples: string[] }>) || [];

  const handleExampleClick = (val: string) => {
    window.dispatchEvent(new CustomEvent("insert-chat-input", { detail: val }));
  };

  return (
    <div className="flex-shrink-0 w-full max-w-[28rem] bg-white rounded-3xl border border-slate-100 shadow-lg p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-lg shrink-0">
          💡
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800">Mini Uygulamalar Rehberi</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Neler Yapabilirim?</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 flex flex-col gap-2 transition-all"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="text-xs font-extrabold text-slate-700 truncate">{item.title}</span>
            </div>
            <div className="flex flex-col gap-1">
              {item.examples.map((ex, exIdx) => (
                <button
                  key={exIdx}
                  type="button"
                  onClick={() => handleExampleClick(ex)}
                  className="text-left text-[11px] font-semibold text-slate-500 hover:text-violet-600 hover:bg-violet-50/50 px-2.5 py-1.5 rounded-xl border border-slate-200/40 hover:border-violet-200/50 truncate transition-all duration-200 active:scale-95"
                  title={`Tıkla ve dene: "${ex}"`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardByType({
  card,
  onIskambilOpen,
}: {
  card: AssistantCard;
  onIskambilOpen: (gameId: string) => void;
}) {
  const { type, data } = card;
  switch (type) {
    case "subcenter":
      return <SubcenterCard data={data} />;
    case "kiler":
      return <KilerCard data={data} />;
    case "recipe":
      return <RecipeCard data={data} />;
    case "concert":
      return <ConcertCard data={data} />;
    case "hobby":
      return <HobbyCard data={data} />;
    case "iskambil":
      return <IskambilCard data={data} onOpen={onIskambilOpen} />;
    case "movie":
      return <MovieCard data={data} />;
    case "itu-dish":
      return <ItuDishCard data={data} />;
    case "friend":
      return <FriendCard data={data} />;
    case "tournament":
      return <TournamentCard data={data} />;
    case "memedex":
      return <MemedexCard data={data} />;
    case "chocolate":
      return <ChocolateCard data={data} />;
    case "help":
      return <HelpCard data={data} />;
    default:
      return (
        <div className="flex-shrink-0 w-[140px] rounded-xl bg-gray-100 p-3 text-xs">
          {JSON.stringify(data).slice(0, 80)}
        </div>
      );
  }
}

function appLinkForCard(card: AssistantCard): string | undefined {
  const map: Record<string, string> = {
    subcenter: "subcenter",
    kiler: "kiler",
    recipe: "recipe",
    concert: "concert-list",
    hobby: "hobby-center",
    chocolate: "chocolate-db",
    memedex: "memedex",
    tournament: "tournament",
    iskambil: "iskambil",
    "itu-dish": "itu-yemekhane",
    movie: "movies-this-year",
    friend: "friendship",
  };
  const appId = map[card.type];
  return appId ? APP_LINKS[appId] : undefined;
}

export default function AssistantCardGallery({
  cards,
  userId,
}: {
  cards: AssistantCard[];
  userId?: string | null;
}) {
  const [iskambilGameId, setIskambilGameId] = useState<string | null>(null);

  if (!cards.length) return null;

  const isIskambilOnly = cards.every((c) => c.type === "iskambil");
  const href = isIskambilOnly ? undefined : appLinkForCard(cards[0]);

  const gallery = (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
      {cards.map((card, i) => (
        <div key={`${card.type}-${i}-${str(card.data, "id", String(i))}`} className="snap-start">
          <CardByType card={card} onIskambilOpen={setIskambilGameId} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="mt-3 w-full max-w-full">
      {gallery}
      {href && (
        <Link
          href={href}
          className="inline-block mt-2 text-[11px] font-bold text-violet-600 hover:text-violet-800"
        >
          Uygulamada aç →
        </Link>
      )}
      <IskambilGameModal
        gameId={iskambilGameId}
        userId={userId ?? null}
        open={!!iskambilGameId}
        onClose={() => setIskambilGameId(null)}
      />
    </div>
  );
}
