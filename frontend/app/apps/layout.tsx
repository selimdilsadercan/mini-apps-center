"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { MINI_APPS } from "@/lib/apps";
import { createBrowserClient } from "@/lib/api";
import { Prohibit, CaretLeft, Sparkle } from "@phosphor-icons/react";
import { getAppRootUrl } from "@/lib/apps";

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded: isUserLoaded, user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Extract app ID from pathname (e.g. /apps/kiler -> kiler)
  const segments = pathname.split("/");
  const appsIdx = segments.indexOf("apps");
  const appId = appsIdx !== -1 && segments[appsIdx + 1] ? segments[appsIdx + 1] : null;

  const currentApp = MINI_APPS.find((app) => app.id === appId);

  // Only check admin status if the current app is cancelled
  useEffect(() => {
    if (!currentApp?.isCancelled) {
      setCheckingAdmin(false);
      return;
    }

    if (!isUserLoaded) return;

    if (!user) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    async function checkAdmin() {
      try {
        const client = createBrowserClient();
        const res = await client.users.checkAdmin(user!.id);
        setIsAdmin(res.isAdmin);
      } catch (err) {
        console.error("Failed to check admin status for cancelled app:", err);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    }

    checkAdmin();
  }, [currentApp, isUserLoaded, user]);

  // If the app is cancelled and user is not admin
  if (currentApp?.isCancelled) {
    if (checkingAdmin) {
      return (
        <div className="flex min-h-screen flex-col bg-app-bg items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-blue-100/20 border-t-[#339AF0] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkle size={16} className="text-[#339AF0]/60 animate-pulse" />
            </div>
          </div>
          <p className="text-app-muted text-xs font-semibold mt-4 tracking-wider uppercase">Yetki kontrol ediliyor...</p>
        </div>
      );
    }

    if (!isAdmin) {
      return (
        <div className="flex min-h-screen flex-col bg-app-bg text-app-text justify-center items-center p-6 text-center">
          <div className="bg-red-500/10 p-6 rounded-full text-red-500 mb-6 border border-red-500/20 shadow-sm animate-pulse">
            <Prohibit size={48} weight="bold" />
          </div>
          <h1 className="text-2xl font-[1000] tracking-tight leading-none mb-3">
            Uygulama Devre Dışı
          </h1>
          <p className="text-app-muted text-sm max-w-sm mb-8 leading-relaxed font-medium">
            Bu uygulama geçici olarak yayından kaldırılmış veya iptal edilmiştir. Sadece yöneticiler bu uygulamaya erişebilir.
          </p>
          <button
            onClick={() => {
              window.location.href = getAppRootUrl();
            }}
            className="flex items-center gap-1.5 text-app-muted hover:text-app-text transition-all bg-app-surface border border-app-border px-5 py-3 rounded-2xl shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest cursor-pointer"
          >
            <CaretLeft size={16} weight="bold" />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>
      );
    }
  }

  return (
    <>
      {children}
    </>
  );
}
