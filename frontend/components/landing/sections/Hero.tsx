"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Storefront } from "@phosphor-icons/react";
import PhoneMockup from "../PhoneMockup";
import PhoneScreen from "../PhoneScreen";
import { useTranslations } from "@/contexts/LanguageContext";
import { getAppRootUrl } from "@/lib/apps";

const Hero: React.FC = () => {
  const t = useTranslations("Hero");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = [
    { value: "60+", key: "modules" },
    { value: "KM", key: "city" },
    { value: "2", key: "platforms" },
    { value: "100%", key: "free" },
  ] as const;

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex flex-col justify-center pt-28 pb-16 px-6 overflow-hidden bg-[#0a0a0c]"
    >
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left pt-6 lg:pt-0 lg:pl-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold">
                {t("badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-[3.5rem] font-black text-white mb-6 leading-[1.08] tracking-tight"
            >
              <span>{t("title1")}</span>
              <br />
              <span className="text-teal-400">{t("title2")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base sm:text-lg text-zinc-400 max-w-xl mb-8 leading-relaxed font-medium"
            >
              {t("subtitle")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
            >
              <Link
                href={mounted ? getAppRootUrl() : "/login"}
                className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-white/5 active:scale-95 text-center flex items-center justify-center gap-2.5"
              >
                <Play size={18} weight="fill" />
                <div className="text-left">
                  <div className="text-[10px] opacity-60 leading-tight">{t("now")}</div>
                  <div className="text-sm leading-none font-black">{t("openApp")}</div>
                </div>
              </Link>
              <Link
                href="/for-businesses"
                className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-bold py-3.5 px-8 rounded-2xl border border-zinc-700 transition-all active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <Storefront size={18} weight="bold" className="text-amber-400" />
                <span className="text-sm">{t("forBusinesses")}</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-10 mt-12 pt-8 border-t border-zinc-800 w-full"
            >
              {stats.map((stat) => (
                <div key={stat.key} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                    {t(`stats.${stat.key}` as any)}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-5 flex justify-center mt-8 lg:mt-0 relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <PhoneMockup>
                <PhoneScreen />
              </PhoneMockup>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
