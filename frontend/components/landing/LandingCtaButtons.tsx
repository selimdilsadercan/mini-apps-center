"use client";

import { motion } from "framer-motion";
import { useTranslations } from "@/contexts/LanguageContext";

function GlobeIcon() {
  return (
    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" className="w-6 h-6 shrink-0">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
      />
    </svg>
  );
}

function GooglePlayIcon() {
  return (
    <svg viewBox="30 336.7 120.9 129.2" className="w-6 h-6 shrink-0">
      <path
        fill="#FFD400"
        d="M119.2,421.2c15.3-8.4,27-14.8,28-15.3c3.2-1.7,6.5-6.2,0-9.7c-2.1-1.1-13.4-7.3-28-15.3l-20.1,20.2L119.2,421.2z"
      />
      <path
        fill="#FF3333"
        d="M99.1,401.1l-64.2,64.7c1.5,0.2,3.2-0.2,5.2-1.3c4.2-2.3,48.8-26.7,79.1-43.3L99.1,401.1L99.1,401.1z"
      />
      <path
        fill="#48FF48"
        d="M99.1,401.1l20.1-20.2c0,0-74.6-40.7-79.1-43.1c-1.7-1-3.6-1.3-5.3-1L99.1,401.1z"
      />
      <path
        fill="#3BCCFF"
        d="M99.1,401.1l-64.3-64.3c-2.6,0.6-4.8,2.9-4.8,7.6c0,7.5,0,107.5,0,113.8c0,4.3,1.7,7.4,4.9,7.7L99.1,401.1z"
      />
    </svg>
  );
}

const storeButtonClass =
  "flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-5 py-2.5 rounded-2xl transition-all duration-300 shadow-lg active:scale-[0.98]";

interface LandingCtaButtonsProps {
  primaryHref: string;
  appStoreHref?: string;
  googlePlayHref?: string;
  className?: string;
}

export default function LandingCtaButtons({
  primaryHref,
  appStoreHref = "#",
  googlePlayHref = "#",
  className = "",
}: LandingCtaButtonsProps) {
  const t = useTranslations("Hero");

  return (
    <div className={`space-y-4 w-full sm:w-auto ${className}`}>
      <motion.a
        href={primaryHref}
        whileTap={{ scale: 0.98 }}
        className="inline-flex w-full sm:w-auto items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-teal-900/20 active:scale-[0.98]"
      >
        <GlobeIcon />
        <div className="text-left">
          <div className="text-xs text-white/70">{t("now")}</div>
          <div className="-mt-0.5 text-lg font-bold">{t("playWeb")}</div>
        </div>
      </motion.a>

      <div className="flex flex-wrap items-center gap-3">
        <a href={appStoreHref} className={storeButtonClass}>
          <AppleIcon />
          <div className="text-left font-semibold">
            <div className="text-[10px] text-white/50 leading-tight">{t("download")}</div>
            <div className="text-base leading-tight">App Store</div>
          </div>
        </a>
        <a href={googlePlayHref} className={storeButtonClass}>
          <GooglePlayIcon />
          <div className="text-left font-semibold">
            <div className="text-[10px] text-white/50 leading-tight">{t("download")}</div>
            <div className="text-base leading-tight">Google Play</div>
          </div>
        </a>
      </div>
    </div>
  );
}
