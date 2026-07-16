"use client";

import React, { useEffect, useState } from "react";
import { Star, Check, BookmarkSimple, Prohibit } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { chocolate_db } from "@/lib/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUser } from "@clerk/clerk-react";
import ChocolateDBShell from "../components/ChocolateDBShell";
import ChocolateListItem from "../components/ChocolateListItem";
import { SavedPageSkeleton } from "../components/ChocolateListSkeleton";

const client = createBrowserClient();

const translations = {
  tr: {
    noResults: "Bu listede henüz hiçbir çikolata bulunmuyor...",
    tried: "Denedim",
    wishlist: "Denemek İstiyorum",
    dislike: "Engellenenler",
    rated: "Puanladıklarım",
    loginRequired: "Lütfen önce giriş yapın.",
    loginHint: "Listelerinizi görmek için giriş yapın.",
  },
  en: {
    noResults: "No chocolates found in this list yet...",
    tried: "Tried",
    wishlist: "Wishlist",
    dislike: "Blocked",
    rated: "Rated",
    loginRequired: "Please log in first.",
    loginHint: "Log in to see your lists.",
  },
};

type ListTab = "wishlist" | "tried" | "rated" | "dislike";

export default function SavedChocolatesPage() {
  const { locale: lang } = useLanguage();
  const t = translations[lang as "tr" | "en"] || translations.tr;
  const { user, isLoaded: isUserLoaded } = useUser();

  const [chocolates, setChocolates] = useState<chocolate_db.Chocolate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ListTab>("wishlist");

  const fetchChocolates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const resp = await client.chocolate_db.listChocolates({ userId: user.id });
      setChocolates(resp.chocolates);
    } catch (err) {
      console.error("Failed to fetch chocolates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChocolates();
  }, [user?.id]);

  const filteredChocolates = chocolates.filter((c) => {
    if (activeTab === "wishlist") return c.user_state === "wishlist";
    if (activeTab === "tried") return c.user_state === "tried";
    if (activeTab === "dislike") return c.user_state === "dislike";
    if (activeTab === "rated") return !!(c.user_rating && c.user_rating > 0);
    return false;
  });

  const listTabs: { id: ListTab; label: string; icon: React.ReactNode }[] = [
    { id: "wishlist", label: t.wishlist, icon: <BookmarkSimple size={13} weight="fill" /> },
    { id: "tried", label: t.tried, icon: <Check size={13} weight="bold" /> },
    { id: "rated", label: t.rated, icon: <Star size={13} weight="fill" /> },
    { id: "dislike", label: t.dislike, icon: <Prohibit size={13} weight="fill" /> },
  ];

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all active:scale-[0.98] cursor-pointer ${
      active ? "bg-app-tab-active text-app-text shadow-sm" : "text-app-muted hover:text-app-text"
    }`;

  if (!isUserLoaded || loading) {
    return (
      <ChocolateDBShell activeTab="saved">
        <SavedPageSkeleton />
      </ChocolateDBShell>
    );
  }

  if (!user) {
    return (
      <ChocolateDBShell activeTab="saved">
        <div className="text-center py-16 bg-app-surface border border-app-border rounded-2xl shadow-sm">
          <p className="text-sm font-bold text-app-muted">{t.loginHint}</p>
        </div>
      </ChocolateDBShell>
    );
  }

  return (
    <ChocolateDBShell activeTab="saved">
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-0.5 p-1 rounded-2xl border border-app-border bg-app-tab-track overflow-x-auto max-w-full">
          {listTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={tabClass(activeTab === tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {filteredChocolates.length === 0 ? (
          <div className="text-center py-12 bg-app-surface border border-app-border rounded-2xl shadow-sm">
            <p className="text-sm font-bold text-app-muted">{t.noResults}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredChocolates.map((choco) => (
              <ChocolateListItem
                key={choco.id}
                choco={choco}
                loginRequired={t.loginRequired}
                onUpdate={fetchChocolates}
              />
            ))}
          </div>
        )}
      </div>
    </ChocolateDBShell>
  );
}
