"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Layout, 
  User, 
  Lightning, 
  Users, 
  DeviceMobile, 
  Code 
} from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";

interface FeatureItem {
  id: string;
  icon: React.ComponentType<any>;
  gradient: string;
}

const FeaturesSection: React.FC = () => {
  const t = useTranslations("Features");

  const featureItems: FeatureItem[] = [
    {
      id: "daily",
      icon: Layout,
      gradient: "from-violet-500 to-purple-600",
    },
    {
      id: "chest",
      icon: User,
      gradient: "from-amber-500 to-yellow-600",
    },
    {
      id: "hints",
      icon: Lightning,
      gradient: "from-cyan-500 to-teal-600",
    },
    {
      id: "social",
      icon: Users,
      gradient: "from-pink-500 to-rose-600",
    },
    {
      id: "duel",
      icon: DeviceMobile,
      gradient: "from-red-500 to-orange-600",
    },
    {
      id: "premium",
      icon: Code,
      gradient: "from-indigo-500 to-blue-600",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-gray-50/50 border-t border-b border-gray-100">
      {/* Background Blurs */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold mb-4 shadow-sm"
          >
            {t("badge")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            {t("title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto font-semibold leading-relaxed"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureItems.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative bg-white border border-gray-100 rounded-3xl p-8 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-default"
              >
                {/* Icon Background Blur */}
                <div
                  className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 shadow-md shadow-indigo-100 transition-transform duration-300`}
                  >
                    <Icon size={24} weight="fill" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-gray-900 mb-3 tracking-tight">
                    {t(`items.${feature.id}.title` as any)}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-500 text-xs font-semibold leading-relaxed">
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
