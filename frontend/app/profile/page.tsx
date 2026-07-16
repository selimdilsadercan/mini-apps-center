"use client";

import { useUser, SignOutButton } from "@clerk/clerk-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  SignOut,
  Users,
  CaretLeft,
  Globe,
  UserGear,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import ThemeSelector from "@/components/ThemeSelector";
import { APP_CONFIG } from "@/lib/config";
import { useProfileUser } from "@/lib/cache/profileCache";

const actionBtn =
  "w-8 h-8 rounded-lg flex items-center justify-center border border-app-border bg-app-surface text-app-muted hover:text-app-text hover:bg-app-surface-muted transition-all active:scale-95 cursor-pointer";

function ProfileRow({
  href,
  icon: RowIcon,
  color,
  title,
  subtitle,
  trailing,
}: {
  href: string;
  icon: Icon;
  color: string;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 py-3 px-1 transition-all active:scale-[0.98] border-b border-app-border last:border-0"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <RowIcon size={22} weight="fill" className="text-white relative z-10" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-app-text text-[15px] tracking-tight truncate">{title}</h3>
        <p className="text-[11px] font-medium text-app-muted line-clamp-1 leading-tight">
          {subtitle}
        </p>
      </div>
      {trailing}
    </Link>
  );
}

export default function Profile() {
  const { user } = useUser();
  const { locale, setLocale } = useLanguage();
  const router = useRouter();
  const t = useTranslations("profile");
  const { dbUser, isInitialLoading } = useProfileUser();

  const [hasFriendsBadge, setHasFriendsBadge] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasFriendsBadge(localStorage.getItem("has_pending_requests") === "true");
    }

    const handleBadgeUpdate = (e: any) => {
      setHasFriendsBadge(e.detail.hasPending);
    };

    window.addEventListener("incoming-requests-badge", handleBadgeUpdate);
    return () => {
      window.removeEventListener("incoming-requests-badge", handleBadgeUpdate);
    };
  }, []);

  if (isInitialLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-app-bg pb-8">
        <header className="sticky top-0 z-30 app-chrome-top">
          <div className="max-w-lg mx-auto w-full px-4 py-3">
            <div className="h-4 w-32 bg-app-surface-muted rounded animate-pulse" />
          </div>
        </header>
        <main className="px-4 pt-4 pb-safe-area-inset-bottom max-w-lg mx-auto w-full">
          <div className="h-16 bg-app-surface-muted rounded-2xl animate-pulse mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-app-surface-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const handleName = dbUser?.username || user?.username || "kullanici_adi";
  const displayName = dbUser?.full_name || user?.fullName || t("guest");
  const avatarUrl = dbUser?.avatar_url || user?.imageUrl;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text pb-8">
      <header className="sticky top-0 z-30 app-chrome-top">
        <div className="max-w-lg mx-auto w-full px-4 py-3 flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => router.push("/home")}
            className={actionBtn}
            aria-label="Geri"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-black text-app-text tracking-tight truncate leading-none">
              {t("title")}
            </h1>
            <p className="text-[10px] font-medium text-app-muted truncate mt-1 lowercase">
              @{handleName}
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 pb-safe-area-inset-bottom max-w-lg mx-auto w-full space-y-8">
        <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm border border-app-border">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-black">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-app-text tracking-tight truncate lowercase">
                {handleName}
              </p>
              <p className="text-[9px] font-bold text-app-muted uppercase tracking-wider truncate">
                {displayName}
              </p>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-[11px] font-[1000] text-app-muted uppercase tracking-[0.2em] px-1">
            {t("accountSettings")}
          </h2>
          <div className="space-y-0">
            <ProfileRow
              href="/friends"
              icon={Users}
              color="#3B82F6"
              title={t("manageFriends")}
              subtitle={t("manageFriendsSubtitle")}
              trailing={
                hasFriendsBadge ? (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                ) : null
              }
            />
            <ProfileRow
              href="/settings/account"
              icon={UserGear}
              color="#FF6B35"
              title={t("accountSettings")}
              subtitle={t("accountSettingsSubtitle")}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[11px] font-[1000] text-app-muted uppercase tracking-[0.2em] px-1">
            {t("language")} & {t("theme")}
          </h2>

          <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: "#8B5CF6" }}
              >
                <Globe size={20} weight="fill" className="text-white" />
              </div>
              <span className="text-[12px] font-black text-app-text">{t("language")}</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-app-surface-muted border border-app-border shrink-0">
              <button
                type="button"
                onClick={() => setLocale("tr")}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                  locale === "tr"
                    ? "bg-app-tab-active text-app-text shadow-sm"
                    : "text-app-muted hover:text-app-text"
                }`}
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                  locale === "en"
                    ? "bg-app-tab-active text-app-text shadow-sm"
                    : "text-app-muted hover:text-app-text"
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <ThemeSelector />
        </section>

        {user && (
          <div className="rounded-2xl border border-app-border bg-app-surface shadow-sm p-3">
            <SignOutButton>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100/70 dark:hover:bg-red-950/50 active:scale-[0.98] transition-all text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-wider"
              >
                <SignOut size={16} weight="bold" />
                {t("signOut")}
              </button>
            </SignOutButton>
          </div>
        )}

        <p className="text-center text-[10px] font-bold text-app-muted tracking-widest">
          v{APP_CONFIG.version}
        </p>
      </main>
    </div>
  );
}
