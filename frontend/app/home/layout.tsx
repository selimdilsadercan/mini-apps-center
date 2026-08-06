"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext, useUser } from "@/contexts/AuthContext";
import { House, Compass, Wrench, Storefront, UserCircle, Gear, Heart, GameController, Trophy } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { hubPath, matchHubRoute } from "@/lib/hub-routes";
import { useShareIntent } from "@/lib/use-share-intent";
import { MINI_APPS, MiniApp, getAppHref } from "@/lib/apps";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext(); 
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLanguage();

  const sharedText = useShareIntent();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Instagram paylaşımı gelirse kaydedilenler'e yönlendir
  useEffect(() => {
    if (sharedText && sharedText.includes("instagram.com")) {
      const targetUrl = `/apps/kaydedilenler?sharedText=${encodeURIComponent(sharedText)}`;
      router.push(targetUrl);
    }
  }, [sharedText, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg text-app-text">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Active state based on the current Next.js route
  const getActiveTab = () => {
    const route = matchHubRoute(pathname || "");
    if (route === "today") return "today";
    if (route === "explore") return "explore";
    if (route === "tools") return "tools";
    if (route === "life") return "life";
    if (route === "hobby") return "hobby";
    if (route === "studio") return "studio";
    if (route === "profile" || route === "profileEdit") return "profile";
    return "today";
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-app-bg">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-app-border bg-app-surface text-app-text h-screen sticky top-0 px-4 py-6 justify-between select-none shrink-0">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center px-2 py-1">
            <span className="font-black text-sm tracking-widest uppercase text-app-text">
              Everything
            </span>
          </div>

          {/* Greet User Info */}
          {clerkUser && (
            <div className="bg-app-surface-muted/30 border border-app-border/40 p-3 rounded-2xl space-y-1">
              <p className="text-[11px] font-bold text-app-text truncate">
                İyi akşamlar, {clerkUser.firstName || clerkUser.username || "selim"}
              </p>
              <span className="text-[9px] text-app-muted font-bold block capitalize">
                {new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date())}
              </span>
            </div>
          )}

          {/* Nav Items */}
          <nav className="space-y-1">
            {[
              { id: "today", label: "Bugün", path: hubPath("today"), icon: House },
              { id: "explore", label: "Sıralama", path: hubPath("explore"), icon: Trophy },
              { id: "life", label: "Yaşam", path: hubPath("life"), icon: Heart },
              { id: "hobby", label: "Hobi", path: hubPath("hobby"), icon: GameController },
              { id: "tools", label: "Araçlar", path: hubPath("tools"), icon: Wrench },
              { id: "studio", label: "Stüdyo", path: hubPath("studio"), icon: Storefront },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? "bg-app-tab-active text-app-text shadow-sm border border-app-border/40"
                      : "text-app-muted hover:text-app-text hover:bg-app-surface-muted/50 border border-transparent"
                  }`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "bold"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile info */}
        {clerkUser && (
          <div className="flex items-center gap-3 pt-4 border-t border-app-border/60 w-full justify-between">
            {/* Clickable Profile Card */}
            <div
              onClick={() => router.push(hubPath("profile"))}
              className={`flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group rounded-xl px-1 py-1 transition-colors ${
                activeTab === "profile" ? "bg-app-tab-active" : ""
              }`}
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-app-border shrink-0 group-hover:border-app-text/30 transition-colors">
                {clerkUser.imageUrl ? (
                  <img src={clerkUser.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-app-surface-muted flex items-center justify-center">
                    <UserCircle size={28} weight="fill" className="text-app-muted" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-black text-app-text truncate group-hover:text-app-text/80 transition-colors">
                  {clerkUser.firstName || clerkUser.username || "selim"}
                </p>
                <span className="text-[8px] font-bold text-app-muted uppercase tracking-wider block">
                  Profilimi Gör
                </span>
              </div>
            </div>

            {/* Settings Button */}
            <button
              onClick={() => router.push("/settings")}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-app-surface-muted/65 text-app-muted hover:text-app-text transition-colors cursor-pointer shrink-0"
              title="Ayarlar"
            >
              <Gear size={16} weight="bold" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-app-bg pb-32 md:pb-12">
        {children}
      </div>
    </div>
  );
}
