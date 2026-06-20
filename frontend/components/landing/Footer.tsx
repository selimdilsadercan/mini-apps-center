"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { getAppRootUrl } from "@/lib/apps";

const Footer: React.FC = () => {
  const t = useTranslations("Footer");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const footerLinksData = {
    product: [
      { text: t("linkTexts.games"), url: "#apps" },
      { text: t("linkTexts.features"), url: "#features" },
      { text: t("linkTexts.premium"), url: "#" },
      { text: t("linkTexts.howToPlay"), url: "#" },
    ],
    company: [
      { text: t("linkTexts.about"), url: "#" },
      { text: t("linkTexts.blog"), url: "#" },
      { text: t("linkTexts.careers"), url: "#" },
      { text: t("linkTexts.contact"), url: "#" },
    ],
    legal: [
      { text: t("linkTexts.privacy"), url: "/privacy" },
      { text: t("linkTexts.terms"), url: "#" },
      { text: t("linkTexts.cookies"), url: "#" },
    ],
  };

  return (
    <footer className="relative bg-gray-50 border-t border-gray-100">
      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-gray-500 text-base md:text-lg mb-8 leading-relaxed">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={mounted ? getAppRootUrl() : "/"}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/10 active:scale-95 text-center flex items-center justify-center gap-2"
              >
                <Sparkle size={18} weight="fill" />
                <span>{t("cta.openApp")}</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 border-t border-gray-200/50 pt-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkle size={16} weight="fill" />
              </div>
              <span className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                Everything
              </span>
            </Link>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-gray-900 font-bold text-sm mb-4">{t("links.product")}</h4>
            <ul className="space-y-3">
              {footerLinksData.product.map((link) => (
                <li key={link.text}>
                  <Link
                    href={link.url}
                    className="text-gray-500 hover:text-indigo-600 text-xs font-medium transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-gray-900 font-bold text-sm mb-4">{t("links.company")}</h4>
            <ul className="space-y-3">
              {footerLinksData.company.map((link) => (
                <li key={link.text}>
                  <Link
                    href={link.url}
                    className="text-gray-500 hover:text-indigo-600 text-xs font-medium transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-gray-900 font-bold text-sm mb-4">{t("links.legal")}</h4>
            <ul className="space-y-3">
              {footerLinksData.legal.map((link) => (
                <li key={link.text}>
                  <Link
                    href={link.url}
                    className="text-gray-500 hover:text-indigo-600 text-xs font-medium transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-xs font-bold">
            {t("copyright")}
          </p>
          <p className="text-gray-400 text-xs font-bold">
            {t("madeWith")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
