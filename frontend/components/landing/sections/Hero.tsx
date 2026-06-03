"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkle, Play } from "@phosphor-icons/react";
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

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center pt-28 pb-16 px-6 overflow-hidden bg-[#FAF9F7]"
    >
      {/* Background Decorative Circles */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] bg-indigo-100/40 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-100/30 blur-[150px] rounded-full" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left pt-6 lg:pt-0"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-sm">
                <Sparkle size={14} weight="fill" className="animate-pulse" />
                {t("badge")}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-6 leading-[1.1] tracking-tight"
            >
              <span>{t("title1")}</span>
              <br />
              <span className="text-indigo-600">{t("title2")}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-base sm:text-lg text-gray-500 max-w-lg mb-8 leading-relaxed font-semibold"
            >
              {t("subtitle")}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Link
                href={mounted ? getAppRootUrl() : "/"}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/10 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <Play size={18} weight="fill" />
                <div className="text-left">
                  <div className="text-[10px] opacity-75 leading-tight">{t("now")}</div>
                  <div className="text-base leading-none font-black">{t("openApp")}</div>
                </div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12 pt-8 border-t border-gray-200/50 w-full"
            >
              {[
                { value: "5K+", key: "players" },
                { value: "20+", key: "games" },
                { value: "48K+", key: "puzzles" },
                { value: "%99", key: "rating" },
              ].map((stat) => (
                <div key={stat.key} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    {t(`stats.${stat.key}` as any)}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-5 flex justify-center mt-8 lg:mt-0 relative"
          >
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
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
