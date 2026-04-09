"use client";

import { useNotifications } from "@/hooks/use-notifications";

export function NotificationHandler() {
  // Sadece hook'u başlatıyoruz, bir şey render etmiyor.
  useNotifications();
  return null;
}
