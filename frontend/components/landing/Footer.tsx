"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { getAppRootUrl } from "@/lib/apps";

interface FooterProps {
  hideCTA?: boolean;
}

const Footer: React.FC<FooterProps> = ({ hideCTA = false }) => {
  const t = useTranslations("Footer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const footerLinks = {
    product: [
      { text: t("linkTexts.apps"), url: "#apps" },
      { text: t("linkTexts.features"), url: "#features" },
      { text: t("linkTexts.forBusinesses"), url: "/for-businesses" },
      { text: t("linkTexts.directory"), url: "/directory" },
    ],
    company: [
      { text: t("linkTexts.about"), url: "#" },
      { text: t("linkTexts.contact"), url: "mailto:contact@allminiapps.com" },
      { text: t("linkTexts.faq"), url: "#faq" },
    ],
    legal: [
      { text: t("linkTexts.privacy"), url: "/privacy" },
      { text: t("linkTexts.terms"), url: "/terms" },
    ],
  };

  return (
    <footer className="relative bg-[#111114] border-t border-zinc-800">
      {!hideCTA && (
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center relative"
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-zinc-400 text-base md:text-lg mb-8 leading-relaxed font-medium">
                {t("cta.subtitle")}
              </p>
              <Link
                href={mounted ? getAppRootUrl() : "/login"}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3.5 px-8 rounded-2xl transition-all active:scale-95"
              >
                <Sparkle size={18} weight="fill" />
                <span>{t("cta.openApp")}</span>
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 border-t border-zinc-800 pt-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4 group">
              <span className="text-lg font-black text-white group-hover:text-teal-400 transition-colors">
                Everything
              </span>
            </Link>
            <p className="text-zinc-500 text-xs leading-relaxed">{t("tagline")}</p>
          </div>

          {(["product", "company", "legal"] as const).map((section) => (
            <div key={section}>
              <h4 className="text-white font-bold text-sm mb-4">{t(`links.${section}`)}</h4>
              <ul className="space-y-3">
                {footerLinks[section].map((link) => (
                  <li key={link.text}>
                    <Link
                      href={link.url}
                      className="text-zinc-500 hover:text-zinc-200 text-xs font-medium transition-colors"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs font-medium">{t("copyright")}</p>
          <p className="text-zinc-600 text-xs font-medium">{t("madeWith")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
