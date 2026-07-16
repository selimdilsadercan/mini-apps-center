"use client";

import Link from "next/link";
import { Star, Check, BookmarkSimple } from "@phosphor-icons/react";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { chocolate_db } from "@/lib/client";

const client = createBrowserClient();

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=400&auto=format&fit=crop";

interface ChocolateListItemProps {
  choco: chocolate_db.Chocolate;
  loginRequired: string;
  onUpdate: () => void;
}

export default function ChocolateListItem({
  choco,
  loginRequired,
  onUpdate,
}: ChocolateListItemProps) {
  const { user } = useUser();

  const handleStateToggle = async (
    e: React.MouseEvent,
    state: "tried" | "wishlist" | "dislike"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert(loginRequired);
      return;
    }
    const newState: "tried" | "wishlist" | "dislike" | "" =
      choco.user_state === state ? "" : state;
    try {
      await client.chocolate_db.setUserState({
        userId: user.id,
        chocolateId: choco.id,
        state: newState,
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to update user state:", err);
    }
  };

  return (
    <Link
      href={`/apps/chocolate-db/${choco.id}`}
      className="flex flex-col h-full p-2.5 bg-app-surface rounded-2xl border border-app-border shadow-sm hover:border-app-muted/40 active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="aspect-square relative overflow-hidden rounded-xl bg-app-surface-muted border border-app-border mb-2">
        <img
          src={choco.image_url || FALLBACK_IMAGE}
          alt={choco.name}
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-app-surface/90 backdrop-blur-sm border border-app-border text-[9px] font-black text-app-text">
          <Star size={9} weight="fill" className="text-yellow-400" />
          {choco.avg_rating.toFixed(1)}
        </span>
      </div>

      <h3 className="text-[11px] font-black text-app-text leading-tight line-clamp-2 min-h-[2lh]">
        {choco.name}
      </h3>
      <p className="text-[9px] text-app-muted font-medium truncate mt-0.5">{choco.brand}</p>

      <div className="flex gap-1 mt-auto pt-2">
        <button
          type="button"
          onClick={(e) => handleStateToggle(e, "wishlist")}
          className={`flex-1 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
            choco.user_state === "wishlist"
              ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/40 dark:border-amber-900/50"
              : "bg-app-surface border-app-border text-app-muted hover:bg-app-surface-muted"
          }`}
        >
          <BookmarkSimple weight={choco.user_state === "wishlist" ? "fill" : "bold"} size={12} />
        </button>
        <button
          type="button"
          onClick={(e) => handleStateToggle(e, "tried")}
          className={`flex-1 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90 cursor-pointer ${
            choco.user_state === "tried"
              ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/50"
              : "bg-app-surface border-app-border text-app-muted hover:bg-app-surface-muted"
          }`}
        >
          <Check weight="bold" size={12} />
        </button>
        <div
          className={`flex-1 h-7 rounded-lg flex items-center justify-center border ${
            choco.user_rating && choco.user_rating > 0
              ? "bg-yellow-50 border-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:border-yellow-900/50"
              : "bg-app-surface border-app-border text-app-muted"
          }`}
        >
          <Star weight={choco.user_rating && choco.user_rating > 0 ? "fill" : "bold"} size={12} />
        </div>
      </div>
    </Link>
  );
}
