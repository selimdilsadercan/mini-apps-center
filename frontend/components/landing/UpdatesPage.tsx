"use client";

import React from "react";
import { motion } from "framer-motion";
import { Megaphone } from "@phosphor-icons/react";
import Header from "./Header";
import Footer from "./Footer";
import { useTranslations } from "@/contexts/LanguageContext";

const UPDATE_IDS = [0, 1, 2, 3] as const;
type UpdateId = (typeof UPDATE_IDS)[number];
type UpdateTag = "feature" | "improvement" | "new";

const TAG_STYLES: Record<UpdateTag, string> = {
  feature: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  improvement: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  new: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function UpdatesPage() {
  const t = useTranslations("Updates");

  return (
    <div className="relative min-h-screen bg-[#0a0a0c] text-zinc-100 overflow-x-hidden antialiased">
      <Header />

      <main className="pt-32 pb-24">
        <section className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold"
            >
              <Megaphone size={14} weight="fill" />
              {t("badge")}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black text-white tracking-tight"
            >
              {t("title")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-400 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto"
            >
              {t("subtitle")}
            </motion.p>
          </div>

          <div className="space-y-4">
            {UPDATE_IDS.map((id, index) => {
              const tag = t(`entries.${id}.tag` as `entries.${UpdateId}.tag`) as UpdateTag;
              return (
                <motion.article
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <time className="text-xs font-bold text-zinc-500">
                      {t(`entries.${id}.date` as `entries.${UpdateId}.date`)}
                    </time>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${TAG_STYLES[tag] ?? TAG_STYLES.feature}`}
                    >
                      {t(`tags.${tag}` as `tags.${UpdateTag}`)}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mb-2">
                    {t(`entries.${id}.title` as `entries.${UpdateId}.title`)}
                  </h2>
                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                    {t(`entries.${id}.body` as `entries.${UpdateId}.body`)}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </section>
      </main>

      <Footer hideCTA />
    </div>
  );
}
