"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Storefront,
  List,
  UserCircle,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { useTranslations, useLanguage } from "@/contexts/LanguageContext";
import { useProfileUser } from "@/lib/cache/profileCache";

type HomeTab = "discover" | "deck";

interface HomeHeaderProps {
  activeTab: string;
  isLoaded: boolean;
  user: {
    firstName?: string | null;
    username?: string | null;
    imageUrl?: string;
  } | null | undefined;
  isAdmin: boolean;
  hasBusinesses: boolean;
}

function getGreetingKey(hour: number): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour < 12) return "greetingMorning";
  if (hour < 18) return "greetingAfternoon";
  return "greetingEvening";
}

const TAB_KEYS: Record<HomeTab, string> = {
  discover: "tabDiscover",
  deck: "tabDeck",
};

export default function HomeHeader({
  activeTab,
  isLoaded,
  user,
  isAdmin,
  hasBusinesses,
}: HomeHeaderProps) {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = useTranslations("home");
  const { dbUser } = useProfileUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tab = (["discover", "deck"].includes(activeTab)
    ? activeTab
    : "discover") as HomeTab;

  const showMenu = isAdmin;

  const actionBtn =
    "w-8 h-8 rounded-lg flex items-center justify-center border border-app-border bg-app-surface text-app-muted hover:text-app-text hover:bg-app-surface-muted transition-all active:scale-95 cursor-pointer";

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const { greeting, dateShort, dateLong, displayName, tabLabel } = useMemo(() => {
    const now = new Date();
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: "Europe/Istanbul",
      }).format(now)
    );

    const dateLocale = locale === "tr" ? "tr-TR" : "en-US";
    const dateShort = new Intl.DateTimeFormat(dateLocale, {
      day: "numeric",
      month: "short",
      timeZone: "Europe/Istanbul",
    })
      .format(now)
      .replace(/\.$/, "");

    const dateLong = new Intl.DateTimeFormat(dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Istanbul",
    }).format(now);

    return {
      greeting: t(getGreetingKey(hour)),
      dateShort,
      dateLong,
      displayName: dbUser?.username || dbUser?.full_name || user?.firstName || user?.username || t("guestName"),
      tabLabel: tab === "deck" ? "Günün Kartları" : t(TAB_KEYS[tab]),
    };
  }, [locale, t, tab, user?.firstName, user?.username, dbUser?.username, dbUser?.full_name]);

  return (
    <header className="sticky top-0 z-30 app-chrome-top">
      <div className="max-w-lg mx-auto w-full px-4 py-3 flex items-center justify-between gap-3">
        {!isLoaded ? (
          <>
            <div className="flex-1 min-w-0 space-y-1.5 animate-pulse">
              <div className="h-4 w-36 bg-app-surface-muted rounded" />
              <div className="h-2.5 w-48 bg-app-surface-muted/70 rounded" />
            </div>
            <div className="w-9 h-9 rounded-lg bg-app-surface-muted animate-pulse shrink-0" />
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black text-app-text tracking-tight truncate leading-none">
                {greeting}, {displayName}
              </h1>
              <p className="text-[10px] font-medium text-app-muted truncate mt-1">
                <span className="sm:hidden">{dateShort}</span>
                <span className="hidden sm:inline capitalize">{dateLong}</span>
                <span className="mx-1.5 opacity-50">·</span>
                {tabLabel}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className={actionBtn}
                  title={t("adminPanel")}
                >
                  <ShieldCheck size={16} weight="bold" />
                </button>
              )}

              {(isAdmin || hasBusinesses) && (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className={actionBtn}
                  title={t("businessPanel")}
                >
                  <Storefront size={16} weight="bold" />
                </button>
              )}

              {/* List sayfasının butonu - Sadece Admin */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => router.push("/home/list")}
                  className={actionBtn}
                  title={t("appList")}
                >
                  <List size={16} weight="bold" />
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="w-9 h-9 rounded-lg overflow-hidden border border-app-border active:scale-95 transition-transform cursor-pointer"
              >
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-app-surface-muted flex items-center justify-center">
                    <UserCircle size={36} weight="fill" className="text-app-muted" />
                  </div>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
