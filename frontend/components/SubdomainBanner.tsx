"use client";

import { useState, useEffect } from "react";
import { X, ArrowSquareOut, Sparkle } from "@phosphor-icons/react";
import { MINI_APPS } from "@/lib/apps";

interface SubdomainBannerProps {
  /** The subdomain slug (e.g. "iskambil"). Used to find the current app's metadata. */
  subdomain: string;
}

/**
 * A non-intrusive sticky banner shown when the user visits via a subdomain.
 * It tells them about the broader "everything" ecosystem and links to the main platform.
 *
 * Visibility: set via the `x-subdomain` response header by middleware.ts, then
 * surfaced to the component through a `data-subdomain` attribute on <html>.
 * Alternatively, each app page can render this directly with the subdomain prop.
 */
export function SubdomainBanner({ subdomain }: SubdomainBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const app = MINI_APPS.find((a) => a.subdomain === subdomain);
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "everything.com";

  // Slight delay so it doesn't flash immediately on page load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (dismissed || !visible) return null;

  const otherApps = MINI_APPS.filter(
    (a) => a.isImplemented && a.subdomain !== subdomain
  ).slice(0, 4);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="max-w-2xl mx-auto rounded-2xl shadow-2xl overflow-hidden"
        style={{
          pointerEvents: "auto",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkle weight="fill" className="text-yellow-400" size={16} />
              <span className="text-white font-semibold text-sm">
                everything
              </span>
              <span className="text-white/40 text-xs font-light">.com</span>
            </div>
            <span className="text-white/30 text-xs">·</span>
            <span className="text-white/60 text-xs">
              {app ? `${app.name} ve çok daha fazlası` : "Mini uygulamalar merkezi"}
            </span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Kapat"
          >
            <X size={14} />
          </button>
        </div>

        {/* App pills + CTA */}
        <div className="flex items-center gap-2 px-4 pb-3 pt-1 flex-wrap">
          {otherApps.map((a) => (
            <a
              key={a.id}
              href={`https://${rootDomain}${a.href}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white/70 hover:text-white transition-all hover:scale-105"
              style={{
                background: `${a.color}22`,
                border: `1px solid ${a.color}44`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: a.color }}
              />
              {a.name}
            </a>
          ))}

          <a
            href={`https://${rootDomain}/home`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #FF6B35, #f7931e)",
              boxShadow: "0 2px 12px rgba(255,107,53,0.4)",
            }}
          >
            Tümünü Keşfet
            <ArrowSquareOut size={12} weight="bold" />
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-detects subdomain from the hostname and renders the banner if applicable.
 * Drop this into a layout that wraps all app pages.
 */
export function SubdomainBannerAuto() {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "everything.com";

    // Localhost: xxx.localhost
    if (hostname.endsWith(".localhost")) {
      const sub = hostname.replace(".localhost", "");
      if (sub) setSubdomain(sub);
      return;
    }

    // Production: xxx.everything.com
    if (hostname.endsWith(`.${rootDomain}`) && hostname !== rootDomain) {
      setSubdomain(hostname.replace(`.${rootDomain}`, ""));
    }
  }, []);

  if (!subdomain) return null;
  return <SubdomainBanner subdomain={subdomain} />;
}
