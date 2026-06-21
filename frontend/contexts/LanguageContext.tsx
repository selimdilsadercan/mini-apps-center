"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import trMessages from "@/locales/tr/index";
import { setCookie, getCookie } from "@/lib/cookies";

type Locale = "tr" | "en";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, messages: initialMessages }: { children: ReactNode; messages: any }) {
  const [locale, setLocaleState] = useState<Locale>("tr"); // Default TR
  const [messages, setMessages] = useState(initialMessages || trMessages);
  const [isInitialized, setIsInitialized] = useState(false);

  const setLocale = async (newLocale: Locale) => {
    if (locale === newLocale && messages && isInitialized) return;

    try {
      const newMessages = (await import(`@/locales/${newLocale}/index`)).default;
      setLocaleState(newLocale);
      setMessages(newMessages);
      setCookie("everything_locale", newLocale);
      document.documentElement.lang = newLocale;
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  useEffect(() => {
    const initLanguage = async () => {
      const savedLocale = getCookie("everything_locale") as Locale;
      let initialLocale: Locale = "tr";

      if (savedLocale && (savedLocale === "tr" || savedLocale === "en")) {
        initialLocale = savedLocale;
      } else {
        const browserLang = navigator.language.split("-")[0];
        initialLocale = browserLang === "en" ? "en" : "tr";
      }

      if (initialLocale !== locale || !isInitialized) {
        await setLocale(initialLocale);
      }
      setIsInitialized(true);
    };

    initLanguage();
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, messages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslations(namespace?: string) {
  const { messages } = useLanguage();

  return (key: string, values?: Record<string, string | number>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    
    // Resolve nested keys like "home.myApps"
    let val = fullKey.split(".").reduce((acc, k) => acc?.[k], messages);
    
    if (val === undefined || val === null) {
      return fullKey;
    }

    if (typeof val === "string") {
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          val = (val as string).replace(`{${k}}`, String(v));
        });
      }
      return val;
    }

    return val;
  };
}
