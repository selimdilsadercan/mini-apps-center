"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { StatusBar, Style } from "@capacitor/status-bar";
import { NavigationBar } from "@capgo/capacitor-navigation-bar";
import { MINI_APPS } from "@/lib/apps";
import { isCapacitorNative } from "@/lib/apps";

export interface MobileThemeConfig {
  statusBarColor?: string;
  statusBarStyle?: "light" | "dark"; // "light" background (dark text), "dark" background (light text)
  navigationBarColor?: string;
  navigationBarStyle?: "light" | "dark"; // "light" background (dark buttons), "dark" background (light buttons)
}

interface MobileThemeContextType {
  themeConfig: MobileThemeConfig;
  setThemeConfig: (config: MobileThemeConfig) => void;
  resetToDefault: () => void;
}

const MobileThemeContext = createContext<MobileThemeContextType | undefined>(undefined);

export const useMobileTheme = () => {
  const context = useContext(MobileThemeContext);
  if (!context) {
    throw new Error("useMobileTheme must be used within a MobileThemeProvider");
  }
  return context;
};

interface MobileThemeProviderProps {
  children: ReactNode;
}

export const MobileThemeProvider: React.FC<MobileThemeProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const [themeConfig, setThemeConfig] = useState<MobileThemeConfig>({});

  // 1. Get default theme based on current pathname and hostname/subdomain
  const getDefaultThemeForPath = (path: string): MobileThemeConfig => {
    // Check if we are inside a mini-app
    // Paths are normally: /apps/[app-id]/...
    const match = path.match(/^\/apps\/([^/]+)/);
    const appId = match ? match[1] : null;

    let app = null;
    if (appId) {
      app = MINI_APPS.find((a) => a.id === appId || a.subdomain === appId);
    }

    // Fallback: check subdomain from hostname if path matching did not yield an app
    if (!app && typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const parts = hostname.split(".");
      if (parts.length > 1) {
        const potentialSubdomain = parts[0];
        app = MINI_APPS.find((a) => a.subdomain === potentialSubdomain);
      }
    }

    if (app) {
      return {
        statusBarColor: app.statusBarColor || app.color || "#FAF9F7",
        statusBarStyle: app.statusBarStyle || "light", // default dark text/icons on light background
        navigationBarColor: app.navigationBarColor || "#FFFFFF",
        navigationBarStyle: app.navigationBarStyle || "light", // default light background (dark buttons)
      };
    }

    // Default system/hub values
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    return {
      statusBarColor: isDark ? "#09090b" : "#FAF9F7",
      statusBarStyle: isDark ? "dark" : "light",
      navigationBarColor: isDark ? "#09090b" : "#FAF9F7",
      navigationBarStyle: isDark ? "dark" : "light",
    };
  };

  // Reset/update theme automatically when pathname changes
  useEffect(() => {
    const defaultTheme = getDefaultThemeForPath(pathname);
    setThemeConfig(defaultTheme);
  }, [pathname]);

  // Re-apply when dark class toggles (hub / renewed apps)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new MutationObserver(() => {
      setThemeConfig(getDefaultThemeForPath(pathname));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [pathname]);

  // Apply the configurations to Capacitor native plugins and DOM body
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyTheme = async () => {
      try {
        const isDark = document.documentElement.classList.contains("dark");
        
        // Determine final colors
        const finalSbColor = themeConfig.statusBarColor || (isDark ? "#09090b" : "#FAF9F7");
        const finalNbColor = themeConfig.navigationBarColor || (isDark ? "#09090b" : "#FAF9F7");

        // 1. Color DOM html & body background for safe area coloring in WebViews/Browsers (iOS and mobile Web)
        document.documentElement.style.backgroundColor = finalNbColor;
        document.body.style.backgroundColor = finalNbColor;

        // 2. Update meta theme-color for system/browser bar integrations
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
          metaThemeColor = document.createElement('meta');
          metaThemeColor.setAttribute('name', 'theme-color');
          document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.setAttribute('content', finalSbColor);

        // 2. Set Capacitor Native settings if running natively
        if (isCapacitorNative()) {
          // Status Bar Setup
          await StatusBar.setBackgroundColor({ color: finalSbColor });

          let sbStyle: Style;
          if (themeConfig.statusBarStyle === "dark") {
            // Dark background -> White text
            sbStyle = Style.Dark;
          } else if (themeConfig.statusBarStyle === "light") {
            // Light background -> Black text
            sbStyle = Style.Light;
          } else {
            sbStyle = isDark ? Style.Dark : Style.Light;
          }
          await StatusBar.setStyle({ style: sbStyle });
          await StatusBar.show();

          // Navigation Bar Setup (Android only)
          const useDarkButtons = themeConfig.navigationBarStyle !== "dark"; // darkButtons = true when light background (so we want dark icons)
          await NavigationBar.setNavigationBarColor({
            color: finalNbColor,
            darkButtons: useDarkButtons,
          });
        }
      } catch (err) {
        console.warn("Failed to apply Mobile Theme settings:", err);
      }
    };

    applyTheme();
  }, [themeConfig]);

  const resetToDefault = () => {
    setThemeConfig(getDefaultThemeForPath(pathname));
  };

  return (
    <MobileThemeContext.Provider value={{ themeConfig, setThemeConfig, resetToDefault }}>
      {children}
    </MobileThemeContext.Provider>
  );
};
