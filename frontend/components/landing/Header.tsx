"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, Sparkle } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getAppRootUrl } from "@/lib/apps";

const Header: React.FC = () => {
  const t = useTranslations("Header");
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menuItems = [
    { text: t("apps"), url: "#apps" },
    { text: t("features"), url: "#features" },
    { text: t("faq"), url: "#faq" },
  ];

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-xl py-3 border-b border-gray-100/80 shadow-sm"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <Sparkle size={20} weight="fill" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
              Everything
            </span>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.url}
                  className="text-sm font-bold text-gray-600 hover:text-indigo-600 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 border border-gray-200/50 rounded-xl p-1">
              <button
                onClick={() => setLocale("tr")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  locale === "tr"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                TR
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  locale === "en"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                EN
              </button>
            </div>

            <Link
              href={mounted ? getAppRootUrl() : "/"}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md shadow-indigo-500/10 active:scale-95"
            >
              {t("openApp")}
            </Link>
          </div>

          {/* Mobile Menu Trigger & Language */}
          <div className="flex items-center gap-3 md:hidden">
            {/* Language Switcher Small */}
            <button
              onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-gray-700 active:scale-95 transition-all"
            >
              <span className="text-xs font-black">{locale.toUpperCase()}</span>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {isOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6 text-center">
              {menuItems.map((item) => (
                <Link
                  key={item.text}
                  href={item.url}
                  onClick={() => setIsOpen(false)}
                  className="text-xl font-bold text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  {item.text}
                </Link>
              ))}
              <Link
                href={mounted ? getAppRootUrl() : "/"}
                onClick={() => setIsOpen(false)}
                className="bg-indigo-600 text-white py-3.5 rounded-2xl text-base font-bold shadow-lg shadow-indigo-500/10 mt-2 active:scale-95 transition-all"
              >
                {t("openApp")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
