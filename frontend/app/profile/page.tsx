"use client";

import { useUser, SignOutButton } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import {
  SignOut,
  Users,
  CaretLeft,
  CaretRight,
  Globe,
  UserGear,
  Shield,
  PencilSimple,
  Sun,
  Moon,
  Desktop,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { APP_CONFIG } from "@/lib/config";
import { useProfileUser } from "@/lib/cache/profileCache";
import Link from "next/link";

const actionBtn =
  "w-8 h-8 rounded-lg flex items-center justify-center border border-app-border bg-app-surface text-app-muted hover:text-app-text hover:bg-app-surface-muted transition-all active:scale-95 cursor-pointer";

function ProfileRow({
  href,
  onClick,
  icon: RowIcon,
  iconColor = "text-app-text",
  iconBg = "bg-app-surface-muted",
  title,
  subtitle,
  trailing,
  titleColor = "text-app-text",
}: {
  href?: string;
  onClick?: () => void;
  icon: Icon;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  titleColor?: string;
}) {
  const content = (
    <div className="flex items-center gap-3.5 py-3 px-3 transition-all active:scale-[0.99] cursor-pointer">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        <RowIcon size={18} weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-black text-[13px] tracking-tight ${titleColor}`}>{title}</h3>
        {subtitle && (
          <p className="text-[10px] font-bold text-app-muted line-clamp-1 leading-tight mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {trailing !== undefined ? (
        trailing
      ) : (
        <CaretRight size={14} weight="bold" className="text-app-muted shrink-0" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline hover:bg-app-surface-muted/30 transition-colors">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-transparent border-0 p-0 hover:bg-app-surface-muted/30 transition-colors block outline-none"
    >
      {content}
    </button>
  );
}

export default function Profile() {
  const { user } = useUser();
  const { locale, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const t = useTranslations("profile");
  const { dbUser, isInitialLoading } = useProfileUser();

  const [hasFriendsBadge, setHasFriendsBadge] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
  const userEmail = (user as any)?.primaryEmailAddress?.emailAddress || (user as any)?.emailAddresses?.[0]?.emailAddress || "";

  const THEME_OPTIONS = [
    { id: "light", icon: Sun },
    { id: "dark", icon: Moon },
    { id: "system", icon: Desktop },
  ] as const;

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
          </div>
        </div>
      </header>

      <main className="px-4 pt-4 pb-safe-area-inset-bottom max-w-lg mx-auto w-full space-y-6">
        {/* Profile Card */}
        <div className="rounded-3xl border border-app-border bg-app-surface shadow-sm p-6 flex flex-col items-center text-center relative">
          <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 shadow-sm border border-app-border relative mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-black text-2xl">
                {displayName.charAt(0)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-app-surface flex items-center justify-center text-white">
              <Shield size={12} weight="fill" />
            </div>
          </div>

          <h2 className="text-base font-black text-app-text tracking-tight lowercase">
            {handleName}
          </h2>
          {userEmail && (
            <p className="text-[11px] font-bold text-app-muted mt-0.5 lowercase">
              {userEmail}
            </p>
          )}

          <button
            type="button"
            onClick={() => router.push("/profile/edit")}
            className="mt-4 px-4 py-2 bg-app-surface-muted hover:bg-app-border border border-app-border text-app-text font-black text-[11px] rounded-full flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <PencilSimple size={14} weight="bold" className="text-app-muted" />
            <span>{t("editProfile") || "Profili Düzenle"}</span>
          </button>
        </div>

        {/* HESAP */}
        <section className="space-y-2">
          <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em] px-1">
            {t("account") || "HESAP"}
          </h2>
          <div className="rounded-3xl border border-app-border bg-app-surface shadow-sm overflow-hidden">
            {/* Arkadaşlıklarım */}
            <ProfileRow
              href="/friends"
              icon={Users}
              iconColor="text-blue-500"
              iconBg="bg-blue-500/10 dark:bg-blue-500/20"
              title={t("manageFriends") || "Arkadaşlıklarım"}
              subtitle={t("manageFriendsSubtitle")}
              trailing={
                <div className="flex items-center gap-2 shrink-0">
                  {hasFriendsBadge && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <CaretRight size={14} weight="bold" className="text-app-muted" />
                </div>
              }
            />
          </div>
        </section>

        {/* AYARLAR */}
        <section className="space-y-2">
          <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em] px-1">
            {t("settings") || "AYARLAR"}
          </h2>
          <div className="rounded-3xl border border-app-border bg-app-surface shadow-sm overflow-hidden divide-y divide-app-border/60">
            {/* Uygulama Dili */}
            <ProfileRow
              icon={Globe}
              iconColor="text-purple-500"
              iconBg="bg-purple-500/10 dark:bg-purple-500/20"
              title={t("language") || "Uygulama Dili"}
              trailing={
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-app-surface-muted border border-app-border shrink-0">
                  <button
                    type="button"
                    onClick={() => setLocale("tr")}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
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
                    className={`px-2.5 py-1 text-[10px] font-black rounded-md transition-all ${
                      locale === "en"
                        ? "bg-app-tab-active text-app-text shadow-sm"
                        : "text-app-muted hover:text-app-text"
                    }`}
                  >
                    EN
                  </button>
                </div>
              }
            />

            {/* Tema Seçici */}
            {mounted && (
              <ProfileRow
                icon={theme === "light" ? Sun : theme === "dark" ? Moon : Desktop}
                iconColor="text-indigo-500"
                iconBg="bg-indigo-500/10 dark:bg-indigo-500/20"
                title={t("theme") || "Tema"}
                trailing={
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-app-surface-muted border border-app-border shrink-0">
                    {THEME_OPTIONS.map(({ id, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTheme(id)}
                        title={t(`theme${id.charAt(0).toUpperCase()}${id.slice(1)}` as any)}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          theme === id
                            ? "bg-app-tab-active text-app-text shadow-sm"
                            : "text-app-muted hover:text-app-text"
                        }`}
                      >
                        <Icon size={12} weight={theme === id ? "fill" : "bold"} />
                      </button>
                    ))}
                  </div>
                }
              />
            )}

            {/* Hesap Ayarları */}
            <ProfileRow
              href="/settings/account"
              icon={UserGear}
              iconColor="text-orange-500"
              iconBg="bg-orange-500/10 dark:bg-orange-500/20"
              title={t("accountSettings") || "Hesap Ayarları"}
            />
          </div>
        </section>

        {/* Çıkış Yap */}
        {user && (
          <div className="rounded-3xl border border-app-border bg-app-surface shadow-sm overflow-hidden">
            <SignOutButton>
              <ProfileRow
                icon={SignOut}
                iconColor="text-red-500"
                iconBg="bg-red-500/10 dark:bg-red-500/20"
                title={t("signOut") || "Çıkış Yap"}
                subtitle="Hesaptan çıkış yap"
                titleColor="text-red-500"
              />
            </SignOutButton>
          </div>
        )}

        <p className="text-center text-[10px] font-bold text-app-muted tracking-widest pt-2">
          v{APP_CONFIG.version}
        </p>
      </main>
    </div>
  );
}
