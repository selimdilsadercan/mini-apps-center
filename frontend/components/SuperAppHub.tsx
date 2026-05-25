"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowSquareOut,
  SquaresFour,
  House,
  ArrowLeft,
} from "@phosphor-icons/react";
import { MINI_APPS, getAppHref, getRootHomeUrl } from "@/lib/apps";
import { useRouter, usePathname } from "next/navigation";

function getSubdomainFromHost(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "everything.com";

  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return sub && sub !== "localhost" ? sub : null;
  }

  if (hostname.endsWith(`.${rootDomain}`) && hostname !== rootDomain) {
    return hostname.replace(`.${rootDomain}`, "") || null;
  }

  return null;
}

interface SuperAppHubProps {
  subdomain: string;
}

/**
 * Sabit köşe butonu: ana sayfa + diğer mini uygulamalar.
 * Alt banner yerine — içerik üstüne binmez, keşif isteğe bağlı.
 */
export function SuperAppHub({ subdomain }: SuperAppHubProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const app = MINI_APPS.find((a) => a.subdomain === subdomain);
  const homeUrl = getRootHomeUrl();
  const otherApps = MINI_APPS.filter(
    (a) => a.isImplemented && a.subdomain && a.subdomain !== subdomain,
  ).slice(0, 5);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={panelRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2"
    >
      {open && (
        <div
          className="w-[min(100vw-2.5rem,20rem)] rounded-2xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            background:
              "linear-gradient(160deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)",
          }}
        >
          <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                style={{
                  background: "linear-gradient(135deg, #FF6B35, #f7931e)",
                }}
                aria-hidden
              >
                ◆
              </span>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-tight truncate">
                  everything
                  <span className="text-white/40 font-normal">.com</span>
                </p>
                {app && (
                  <p className="text-white/50 text-[10px] truncate">
                    {app.name}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white/80 p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Kapat"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-2 pb-2 flex flex-col gap-0.5">
            <a
              href={homeUrl}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <House
                size={18}
                weight="fill"
                className="text-orange-400 shrink-0"
              />
              Ana sayfa
            </a>

            {otherApps.map((a) => (
              <a
                key={a.id}
                href={getAppHref(a)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/75 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: a.color }}
                />
                <span className="truncate">{a.name}</span>
              </a>
            ))}
          </div>

          <div className="px-3 pb-3 pt-1 border-t border-white/10">
            <a
              href={homeUrl}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #FF6B35, #f7931e)",
                boxShadow: "0 2px 12px rgba(255,107,53,0.35)",
              }}
            >
              Tümünü keşfet
              <ArrowSquareOut size={12} weight="bold" />
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-white shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
        style={{
          background: "linear-gradient(135deg, #FF6B35, #f7931e)",
          boxShadow: "0 4px 20px rgba(255,107,53,0.45)",
        }}
        aria-label={open ? "Menüyü kapat" : "Everything menüsü"}
        aria-expanded={open}
      >
        {open ? (
          <X size={20} weight="bold" />
        ) : (
          <>
            <span className="text-xl drop-shadow-sm select-none">◆</span>
            <div className="flex flex-col items-start text-left leading-[1.1]">
              <span className="text-[11px] font-black uppercase tracking-tight drop-shadow-sm">
                Tüm Everything
              </span>
              <span className="text-[10px] font-bold opacity-90 uppercase tracking-widest drop-shadow-sm">
                Uygulamaları
              </span>
            </div>
          </>
        )}
      </button>
    </div>
  );
}

/** Subdomain host’ta otomatik hub; ana domainde render etmez. */
export function SuperAppHubAuto() {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setSubdomain(getSubdomainFromHost());
  }, []);

  if (!subdomain) return null;

  return (
    <>
      {/* Global Geri Tuşu - Sadece alt sayfalarda veya her zaman? 
          Subdomain ana sayfasındaysak ana platforma döner, 
          alt sayfadaysak bir geri gider. */}
      <GlobalBackButton subdomain={subdomain} />

      <SuperAppHub subdomain={subdomain} />
    </>
  );
}

function GlobalBackButton({ subdomain }: { subdomain: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const homeUrl = getRootHomeUrl();

  // Eğer uygulamanın ana sayfasındaysak (örn: /apps/iskambil veya /)
  // "Geri" demek ana platforma dönmek demek.
  const isAppRoot = pathname === "/" || pathname.startsWith("/apps/");
  // Not: Middleware rewrite yaptığı için pathname bazen /apps/iskambil olabilir.

  const handleBack = () => {
    if (window.history.length > 1 && !isAppRoot) {
      router.back();
    } else {
      window.location.href = homeUrl;
    }
  };

  return (
    <button
      onClick={handleBack}
      className="fixed top-4 left-4 z-50 flex h-10 items-center gap-2 rounded-xl border border-black/5 bg-white/80 px-3 text-[#0c3122] shadow-sm backdrop-blur-md transition-all hover:bg-white hover:shadow-md active:scale-95 sm:top-6 sm:left-6"
    >
      <ArrowLeft size={18} weight="bold" />
      <span className="text-xs font-bold uppercase tracking-tight">Geri</span>
    </button>
  );
}

/** Subdomain’deyken geri = ana sayfa; değilse history.back */
export function useSuperAppNavigation() {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    setSubdomain(getSubdomainFromHost());
  }, []);

  const goBackOrHome = () => {
    if (subdomain) {
      window.location.href = getRootHomeUrl();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/home";
    }
  };

  return {
    isSubdomain: !!subdomain,
    subdomain,
    homeUrl: getRootHomeUrl(),
    goBackOrHome,
  };
}
