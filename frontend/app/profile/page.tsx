"use client";

import { useUser, SignOutButton } from "@clerk/clerk-react";
import AppBar, { ActivePage } from "@/components/AppBar";
import { Sparkle, Translate, SignOut, User } from "@phosphor-icons/react";
import { useLanguage, useTranslations } from "@/contexts/LanguageContext";

export default function Profile() {
  const { isLoaded, user } = useUser();
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("profile");

  if (!isLoaded) {
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

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Decorative Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>

      <main className="flex-1 px-6 pb-32 max-w-md mx-auto w-full pt-10">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-none">
            {t("title")}
          </h1>
        </header>

        {/* User Card */}
        <section className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-150 p-6 shadow-xl shadow-indigo-100/10 mb-6">
          <div className="flex items-center gap-5">
            {user ? (
              <>
                {/* User Avatar */}
                {user.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || "User"} 
                    className="w-16 h-16 rounded-[1.25rem] border-2 border-indigo-50 shadow-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
                    {user.firstName?.charAt(0) || "U"}
                  </div>
                )}
                
                {/* User Info */}
                <div className="min-w-0">
                  <h2 className="font-extrabold text-gray-900 text-lg leading-tight truncate">
                    {user.fullName}
                  </h2>
                  <p className="text-gray-500 text-sm truncate font-medium mt-0.5">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-[1.25rem] bg-gray-250 flex items-center justify-center text-gray-400 shadow-md shrink-0 border border-gray-100">
                  <User size={32} weight="bold" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-extrabold text-gray-950 text-lg leading-tight truncate">
                    {t("guest")}
                  </h2>
                  <p className="text-gray-400 text-xs truncate mt-0.5">
                    allminiapps.com
                  </p>
                </div>
              </>
            )}
          </div>

          {user && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <SignOutButton>
                <button className="flex items-center justify-center gap-2 w-full py-3.5 bg-red-50 hover:bg-red-100/75 active:scale-[0.98] transition-all rounded-[1.25rem] text-red-600 font-extrabold text-sm border border-red-100 cursor-pointer">
                  <SignOut size={18} weight="bold" />
                  {t("signOut")}
                </button>
              </SignOutButton>
            </div>
          )}
        </section>

        {/* Language Selection Card */}
        <section className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-155 p-6 shadow-xl shadow-indigo-100/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Translate size={20} weight="bold" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base leading-tight">
                {t("language")}
              </h3>
              <p className="text-gray-400 text-xs mt-0.5 font-medium">
                {t("selectLanguage")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Turkish Button */}
            <button
              onClick={() => setLocale("tr")}
              className={`py-4 rounded-[1.25rem] font-bold text-sm transition-all active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center border ${
                locale === "tr"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-lg mb-0.5">🇹🇷</span>
              {t("turkish")}
            </button>

            {/* English Button */}
            <button
              onClick={() => setLocale("en")}
              className={`py-4 rounded-[1.25rem] font-bold text-sm transition-all active:scale-[0.97] cursor-pointer flex flex-col items-center justify-center border ${
                locale === "en"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-lg mb-0.5">🇬🇧</span>
              {t("english")}
            </button>
          </div>
        </section>
      </main>

      <AppBar activePage={ActivePage.PROFILE} />
    </div>
  );
}
