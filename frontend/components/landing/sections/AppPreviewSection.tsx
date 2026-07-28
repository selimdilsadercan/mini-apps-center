"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, CalendarCheck, Storefront, Code, Megaphone } from "@phosphor-icons/react";
import type { ElementType } from "react";
import PhoneMockup from "../PhoneMockup";
import PhoneScreen from "../PhoneScreen";
import BrowserMockup from "../BrowserMockup";
import LandingPhoneAppPreview from "../LandingPhoneAppPreview";
import LandingPhoneDailyPreview from "../LandingPhoneDailyPreview";
import LandingPhoneBusinessPreview from "../LandingPhoneBusinessPreview";
import LandingBrowserDevPreview from "../LandingBrowserDevPreview";
import { useTranslations } from "@/contexts/LanguageContext";
import { getAppRootUrl, MINI_APPS, BUSINESS_APPS, type MiniApp } from "@/lib/apps";

const MODULE_IDS = ["explore", "daily", "business", "developers"] as const;
type ModuleId = (typeof MODULE_IDS)[number];

const ALL_APPS: MiniApp[] = [...MINI_APPS, ...BUSINESS_APPS];

const CUSTOM_TOOLS: Record<string, { icon: ElementType; color: string }> = {
  campaigns: { icon: Megaphone, color: "#F59E0B" },
};

function findApp(id: string): MiniApp | undefined {
  return ALL_APPS.find((app) => app.id === id);
}

function resolveTool(
  toolId: string,
  tApps: (key: string) => string,
  tPreview: (key: string) => string
): {
  id: string;
  label: string;
  icon: ElementType;
  color: string;
} | null {
  const custom = CUSTOM_TOOLS[toolId];
  if (custom) {
    const label = tPreview(`toolLabels.${toolId}`);
    if (!label || label === `AppPreview.toolLabels.${toolId}`) return null;
    return { id: toolId, label, icon: custom.icon, color: custom.color };
  }

  const app = findApp(toolId);
  if (!app) return null;

  const translated = tApps(`${toolId}.name`);
  const label =
    translated !== `apps.${toolId}.name` ? translated : app.name;

  return { id: toolId, label, icon: app.icon, color: app.color };
}

type ModuleTool = NonNullable<ReturnType<typeof resolveTool>>;

const MODULE_META: Record<
  ModuleId,
  {
    icon: React.ComponentType<{ size?: number; weight?: "bold" | "fill" }>;
    color: string;
    previewMode: "phone" | "browser";
    url: string;
  }
> = {
  explore: { icon: Compass, color: "#0F766E", previewMode: "phone", url: "my.allminiapps.com/explore" },
  daily: { icon: CalendarCheck, color: "#6366F1", previewMode: "phone", url: "my.allminiapps.com/today" },
  business: { icon: Storefront, color: "#6366F1", previewMode: "phone", url: "allminiapps.com/for-businesses" },
  developers: { icon: Code, color: "#7C3AED", previewMode: "browser", url: "my.allminiapps.com/studio" },
};

function ModulePreview({ moduleId }: { moduleId: ModuleId }) {
  switch (moduleId) {
    case "explore":
      return <LandingPhoneAppPreview />;
    case "daily":
      return <LandingPhoneDailyPreview />;
    case "business":
      return <LandingPhoneBusinessPreview />;
    case "developers":
      return <LandingBrowserDevPreview />;
  }
}

const AppPreviewSection: React.FC = () => {
  const t = useTranslations("AppPreview");
  const tApps = useTranslations("apps");
  const [selectedModuleId, setSelectedModuleId] = useState<ModuleId>("explore");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedMeta = MODULE_META[selectedModuleId];

  const ctaHref = useMemo(() => {
    if (!mounted) return "/login";
    const root = getAppRootUrl();
    switch (selectedModuleId) {
      case "explore":
        return `${root}/explore`;
      case "daily":
        return `${root}/today`;
      case "business":
        return "/for-businesses";
      case "developers":
        return `${root}/studio`;
    }
  }, [mounted, selectedModuleId]);

  const tools = useMemo(() => {
    const raw = t(`modules.${selectedModuleId}.toolIds`);
    if (!raw) return [];
    return raw
      .split("|")
      .map((id: string) => id.trim())
      .map((id: string) => resolveTool(id, tApps, t))
      .filter((tool: ModuleTool | null): tool is ModuleTool => tool !== null);
  }, [t, tApps, selectedModuleId]);

  return (
    <section id="apps" className="py-24 relative overflow-hidden bg-[#0a0a0c]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold"
          >
            {t("badge")}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-black text-white tracking-tight"
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

        <div className="max-w-5xl mx-auto w-full">
          <div className="overflow-x-auto pb-4 no-scrollbar flex justify-center">
            <div className="flex gap-2 px-1">
              {MODULE_IDS.map((id, index) => {
                const isSelected = selectedModuleId === id;
                const meta = MODULE_META[id];
                const Icon = meta.icon;
                return (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedModuleId(id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-white border-white text-zinc-950 shadow-lg"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      <Icon size={16} weight="fill" />
                    </div>
                    <span className="text-xs font-bold">{t(`modules.${id}.name`)}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-zinc-800 bg-[#111114] px-6 py-4 md:px-10 md:py-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center lg:items-stretch">
            <div className="flex h-full w-full items-center justify-center order-2 lg:order-1 relative py-3 lg:py-4">
              <AnimatePresence mode="wait">
                {selectedMeta.previewMode === "phone" ? (
                  <motion.div
                    key={`phone-${selectedModuleId}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10"
                  >
                    <PhoneMockup>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedModuleId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="h-full w-full"
                        >
                          <PhoneScreen>
                            <ModulePreview moduleId={selectedModuleId} />
                          </PhoneScreen>
                        </motion.div>
                      </AnimatePresence>
                    </PhoneMockup>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`browser-${selectedModuleId}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative z-10 w-full"
                  >
                    <BrowserMockup url={selectedMeta.url}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedModuleId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="h-full w-full"
                        >
                          <ModulePreview moduleId={selectedModuleId} />
                        </motion.div>
                      </AnimatePresence>
                    </BrowserMockup>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              key={selectedModuleId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="order-1 lg:order-2 space-y-6 text-center lg:text-left lg:justify-self-start w-full max-w-lg mx-auto lg:mx-0 flex flex-col justify-center"
            >
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: selectedMeta.color }}
                >
                  <selectedMeta.icon size={28} weight="fill" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight">
                    {t(`modules.${selectedModuleId}.name`)}
                  </h3>
                  <div className="flex items-center gap-1.5 text-teal-400 text-xs font-bold uppercase tracking-wider mt-1 justify-center lg:justify-start">
                    <span className="flex h-2 w-2 rounded-full bg-teal-400" />
                    <span>{t(`modules.${selectedModuleId}.platform`)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800">
                <p className="text-zinc-300 text-base leading-relaxed mb-6 font-medium">
                  {t(`modules.${selectedModuleId}.description`)}
                </p>

                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-3">
                    {t("includedTools")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tools.map((tool: ModuleTool) => {
                      const Icon = tool.icon;
                      return (
                        <span
                          key={tool.id}
                          className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
                        >
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: tool.color }}
                          >
                            <Icon size={13} weight="fill" />
                          </span>
                          <span className="text-xs font-bold">{tool.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a
                  href={ctaHref}
                  className="px-8 py-3.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold transition-all active:scale-95 text-center"
                >
                  {t(`modules.${selectedModuleId}.cta`)}
                </a>
              </div>
            </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreviewSection;
