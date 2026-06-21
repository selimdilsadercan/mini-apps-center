"use client";

import { useEffect, useState } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";

interface StatusBarProps {
  backgroundColor?: string;
  style?: Style | "light" | "dark";
  overlay?: boolean;
}

const StatusBarComponent: React.FC<StatusBarProps> = ({
  backgroundColor,
  style,
  overlay = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if we're in a mobile environment
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice =
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
        );
      setIsMobile(isMobileDevice);

      // Check if Capacitor is available
      const isCapacitorAvailable =
        typeof window !== "undefined" &&
        (window as any).Capacitor &&
        (window as any).Capacitor.isNativePlatform();
      setIsCapacitor(isCapacitorAvailable);
    };

    // Check dark mode by checking HTML class
    const checkDarkMode = () => {
      if (typeof window !== "undefined") {
        const htmlElement = document.documentElement;
        const isDark = htmlElement.classList.contains("dark");
        setIsDarkMode(isDark);
      }
    };

    checkMobile();
    checkDarkMode();

    // Listen for dark mode changes by observing HTML class changes
    if (typeof window !== "undefined") {
      const observer = new MutationObserver(() => {
        checkDarkMode();
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!isMobile || !isCapacitor) return;

    const configureStatusBar = async () => {
      try {
        // Use provided backgroundColor or get from CSS variable
        const bgColor =
          backgroundColor ||
          (() => {
            if (typeof window !== "undefined") {
              const computedStyle = getComputedStyle(document.documentElement);
              const bg = computedStyle.getPropertyValue("--background").trim();
              if (bg) return bg;
            }
            // Default colors based on dark mode
            return isDarkMode ? "#100d16" : "#f4f6f9";
          })();

        // Set status bar background color
        await StatusBar.setBackgroundColor({ color: bgColor });

        // Set status bar style (light/dark content)
        // Style.Light = white text/icons (for dark backgrounds)
        // Style.Dark = black text/icons (for light backgrounds)
        // In dark mode: use Style.Light (white text on dark background)
        // In light mode: use Style.Dark (black text on light background)
        const statusBarStyle = style
          ? typeof style === "string"
            ? style === "dark"
              ? Style.Light // Dark content (black text) for light backgrounds
              : Style.Dark // Light content (white text) for dark backgrounds
            : style
          : isDarkMode
            ? Style.Dark // Dark mode: white text
            : Style.Light; // Light mode: black text
        await StatusBar.setStyle({ style: statusBarStyle });

        // Set overlay mode
        await StatusBar.setOverlaysWebView({ overlay });

        // Show status bar if hidden
        await StatusBar.show();
      } catch (error) {
        console.warn("StatusBar configuration failed:", error);
      }
    };

    configureStatusBar();
  }, [backgroundColor, style, overlay, isMobile, isCapacitor, isDarkMode]);

  // Only render on native platforms, no simulation for web/desktop
  return null;
};

export default StatusBarComponent;
