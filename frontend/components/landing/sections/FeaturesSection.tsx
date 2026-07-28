"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Layout,
  User,
  Users,
  DeviceMobile,
  Sparkle,
} from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";

interface FeatureItem {
  id: string;
  icon: React.ComponentType<{ size?: number; weight?: "bold" | "fill" }>;
  iconBg: string;
  iconColor: string;
}

const FeaturesSection: React.FC = () => {
  const t = useTranslations("Features");

  const featureItems: FeatureItem[] = [
    { id: "city", icon: Compass, iconBg: "bg-teal-950", iconColor: "text-teal-400" },
    { id: "hub", icon: Layout, iconBg: "bg-violet-950", iconColor: "text-violet-400" },
    { id: "account", icon: User, iconBg: "bg-amber-950", iconColor: "text-amber-400" },
    { id: "social", icon: Users, iconBg: "bg-rose-950", iconColor: "text-rose-400" },
    { id: "crossplatform", icon: DeviceMobile, iconBg: "bg-sky-950", iconColor: "text-sky-400" },
    { id: "modular", icon: Sparkle, iconBg: "bg-zinc-800", iconColor: "text-zinc-300" },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#111114] border-t border-zinc-800/60">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 text-xs font-bold mb-4"
          >
            {t("badge")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureItems.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="relative z-10">
                  <div
                    className={`w-11 h-11 rounded-xl ${feature.iconBg} ${feature.iconColor} border border-zinc-800 flex items-center justify-center mb-5`}
                  >
                    <Icon size={22} weight="fill" />
                  </div>
                  <h3 className="text-base font-black text-white mb-2 tracking-tight">
                    {t(`items.${feature.id}.title` as any)}
                  </h3>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                    {t(`items.${feature.id}.description` as any)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
