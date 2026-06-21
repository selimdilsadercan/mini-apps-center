"use client";

import { useUser, SignOutButton } from "@clerk/clerk-react";
import AppBar, { ActivePage } from "@/components/AppBar";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkle, Translate, SignOut, User, Users, CaretRight, Shield, Globe, UserGear } from "@phosphor-icons/react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

export default function Profile() {
  const { isLoaded, user } = useUser();
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("profile");

  const [dbUser, setDbUser] = useState<any>(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [activeAppsCount, setActiveAppsCount] = useState(0);
  const [loadingDb, setLoadingDb] = useState(true);
  const [hasFriendsBadge, setHasFriendsBadge] = useState(false);

  // Tek elemanlı sabit deps: isLoaded + oturum durumu (HMR'da dizi boyutu değişmesin)
  const profileLoadKey = !isLoaded
    ? "clerk-loading"
    : user?.id ?? "signed-out";

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

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setDbUser(null);
      setFriendsCount(0);
      setActiveAppsCount(0);
      setLoadingDb(false);
      return;
    }

    let cancelled = false;
    setLoadingDb(true);

    client.users
      .getUserByClerkId(user.id)
      .then((res) => {
        if (!cancelled) {
          setDbUser(res.user ?? null);
        }
      })
      .catch((err) => console.error("Error loading user profile handle:", err))
      .finally(() => {
        if (!cancelled) setLoadingDb(false);
      });

    client.friendship
      .getFriends(user.id)
      .then((res) => {
        if (!cancelled && res.friends) {
          setFriendsCount(res.friends.length);
        }
      })
      .catch((err) => console.error("Error loading friends count:", err));

    client.users
      .getUserPreferences(user.id)
      .then((res) => {
        if (!cancelled && res.appOrder) {
          setActiveAppsCount(res.appOrder.length);
        }
      })
      .catch((err) => console.error("Error loading active apps count:", err));

    return () => {
      cancelled = true;
    };
  }, [profileLoadKey]);

  if (!isLoaded || loadingDb) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FAF9F7]">
        <main className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkle size={16} className="text-indigo-400 animate-pulse" />
            </div>
          </div>
        </main>
        <AppBar activePage={ActivePage.PROFILE} />
      </div>
    );
  }

  // Display name helpers
  const handleName = dbUser?.username || user?.username || "kullanici_adi";
  const displayName = dbUser?.full_name || user?.fullName || t("guest");

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Decorative Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Main Profile View */}
      <main className="flex-1 px-4 pb-32 max-w-md mx-auto w-full pt-8">
        
        {/* Instagram Style Profile Header */}
        <div className="flex flex-col items-center text-center mt-4 mb-8">
          
          {/* Avatar container */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full -m-1 animate-spin-slow opacity-90" style={{ padding: '2px' }} />
            <div className="relative bg-white rounded-full p-1">
              {user?.imageUrl || dbUser?.avatar_url ? (
                <img 
                  src={dbUser?.avatar_url || user?.imageUrl} 
                  alt={displayName} 
                  className="w-24 h-24 rounded-full border border-gray-100 shadow-sm object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-sm">
                  {displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* User Username Handle */}
          <h1 className="text-xl font-black text-gray-900 tracking-tight lowercase">
            {handleName}
          </h1>

          {/* User Full Name */}
          <p className="text-sm font-semibold text-gray-500 mt-1">
            {displayName}
          </p>

          {/* Social Stats line */}
          <div className="grid grid-cols-2 divide-x divide-gray-150 mt-6 py-3.5 bg-white/60 border border-gray-100 rounded-2xl shadow-sm text-center w-full max-w-[240px]">
            <Link href="/friends" className="flex flex-col items-center no-underline text-gray-900 justify-center">
              <span className="text-lg font-black">{friendsCount}</span>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t("friendsStat")}</span>
            </Link>
            <div className="flex flex-col items-center justify-center">
              <span className="text-lg font-black">{activeAppsCount}</span>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{t("appsStat")}</span>
            </div>
          </div>
        </div>

        {/* Profile Navigation Menus */}
        <div className="space-y-4">
          
          {/* Action Links */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <Link
              href="/friends"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors no-underline cursor-pointer border-b border-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Users size={18} weight="fill" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-gray-900 block">{t("manageFriends")}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{t("manageFriendsSubtitle")}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasFriendsBadge && (
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
                <CaretRight size={16} className="text-gray-400" />
              </div>
            </Link>

            <Link
              href="/settings/account"
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors no-underline cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-[#FF6B35] rounded-2xl">
                  <UserGear size={18} weight="fill" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-black text-gray-900 block">{t("accountSettings")}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{t("accountSettingsSubtitle")}</span>
                </div>
              </div>
              <CaretRight size={16} className="text-gray-400" />
            </Link>
          </div>

          {/* Language Preference selection inside settings container */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                <Globe size={18} weight="bold" />
              </div>
              <span className="text-xs font-black text-gray-900">{t("language")}</span>
            </div>

            {/* Segmented language switcher on the right */}
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-1 shrink-0">
              <button
                onClick={() => setLocale("tr")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  locale === "tr"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                TR
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  locale === "en"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Sign Out Card */}
          {user && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3">
              <SignOutButton>
                <button className="flex items-center justify-center gap-2 w-full py-4 bg-red-50 hover:bg-red-100/70 active:scale-[0.98] transition-all rounded-2xl text-red-600 font-black text-xs border border-red-100 cursor-pointer uppercase tracking-wider">
                  <SignOut size={16} weight="bold" />
                  {t("signOut")}
                </button>
              </SignOutButton>
            </div>
          )}
        </div>
      </main>

      <AppBar activePage={ActivePage.PROFILE} />
    </div>
  );
}
