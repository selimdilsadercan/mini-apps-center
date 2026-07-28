"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
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
    { id: "apps", text: t("apps"), url: "/directory" },
    { id: "updates", text: t("updates"), url: "/updates" },
    { id: "forBusinesses", text: t("forBusinesses"), url: "/for-businesses" },
  ];

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0a0c]/85 backdrop-blur-xl py-3 border-b border-zinc-800/80"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex justify-between items-center">
          <Link href="/" className="group">
            <span className="text-xl font-black tracking-tight text-white group-hover:text-teal-400">
              Everything
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.url}
                  className="text-sm font-medium text-zinc-500 px-4 py-2 rounded-lg hover:text-white hover:bg-[#1d2128]"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setLocale("tr")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  locale === "tr"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                TR
              </button>
              <button
                onClick={() => setLocale("en")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  locale === "en"
                    ? "bg-zinc-700 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                EN
              </button>
            </div>

            <Link
              href={mounted ? getAppRootUrl() : "/login"}
              className="bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95"
            >
              {t("openApp")}
            </Link>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 active:scale-95 transition-all"
            >
              <span className="text-xs font-black">{locale.toUpperCase()}</span>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white active:scale-95 transition-all"
            >
              {isOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#111114] border-b border-zinc-800 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6 text-center">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-zinc-500 px-4 py-3 rounded-lg hover:text-white hover:bg-[#1d2128]"
                >
                  {item.text}
                </Link>
              ))}
              <Link
                href={mounted ? getAppRootUrl() : "/login"}
                onClick={() => setIsOpen(false)}
                className="bg-white text-zinc-950 py-3.5 rounded-2xl text-base font-bold mt-2 active:scale-95 transition-all"
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
