"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";
import Header from "./Header";
import Footer from "./Footer";
import WebDirectoryView from "@/components/directory/WebDirectoryView";
import { useTranslations } from "@/contexts/LanguageContext";

export default function DirectoryPage() {
  const t = useTranslations("Directory");

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-zinc-100 overflow-x-hidden antialiased">
      <Header />

      <main className="pt-28 pb-8">
        <section className="max-w-6xl mx-auto px-6 mb-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold"
            >
              <Sparkle size={14} weight="fill" />
              {t("badge")}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl md:text-5xl font-[1000] tracking-tight text-white"
            >
              {t("title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-400 font-medium text-base md:text-lg leading-relaxed"
            >
              {t("subtitle")}
            </motion.p>
          </div>
        </section>

        <WebDirectoryView embedded />
      </main>

      <Footer hideCTA />
    </div>
  );
}
