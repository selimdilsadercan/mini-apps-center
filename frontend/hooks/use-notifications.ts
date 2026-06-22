"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { Capacitor } from "@capacitor/core";
import { useAuthContext } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/api";
import { isCapacitorNative } from "@/lib/apps";

const client = createBrowserClient();

type PushPermission = "granted" | "denied" | "default";

function mapPermission(receive: string): PushPermission {
  if (receive === "granted") return "granted";
  if (receive === "denied") return "denied";
  return "default";
}

export function useNotifications() {
  const { user, isAuthenticated } = useAuthContext();
  const [permission, setPermission] = useState<PushPermission>("default");
  const [loading, setLoading] = useState(false);
  const setupDone = useRef(false);
  const listenersAttached = useRef(false);

  const isNativePushSupported = isCapacitorNative();

  const saveToken = useCallback(
    async (token: string) => {
      if (!user?.uid) return;
      await client.users.saveFcmToken({
        clerkId: user.uid,
        token,
        deviceType: Capacitor.getPlatform(),
      });
    },
    [user?.uid],
  );

  const attachListeners = useCallback(async () => {
    if (listenersAttached.current) return;

    const { PushNotifications } = await import("@capacitor/push-notifications");

    await PushNotifications.addListener("registration", (token) => {
      void saveToken(token.value);
      setupDone.current = true;
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("[Push] registration error:", err);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      const body = notification.body ?? "";
      if (body) {
        toast(body, { icon: "🔔" });
      }
    });

    listenersAttached.current = true;
  }, [saveToken]);

  const setupNativePush = useCallback(async () => {
    if (!isNativePushSupported || !isAuthenticated || !user?.uid) return;

    const { PushNotifications } = await import("@capacitor/push-notifications");
    await attachListeners();

    const permStatus = await PushNotifications.checkPermissions();
    setPermission(mapPermission(permStatus.receive));

    if (permStatus.receive === "granted" && !setupDone.current) {
      await PushNotifications.register();
    }
  }, [isNativePushSupported, isAuthenticated, user?.uid, attachListeners]);

  useEffect(() => {
    if (!isNativePushSupported) {
      setPermission("denied");
      return;
    }

    void setupNativePush();
  }, [isNativePushSupported, setupNativePush]);

  const handleRequestPermission = useCallback(async () => {
    if (!isNativePushSupported) return;

    setLoading(true);
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      await attachListeners();

      const permStatus = await PushNotifications.requestPermissions();
      setPermission(mapPermission(permStatus.receive));

      if (permStatus.receive === "granted") {
        setupDone.current = false;
        await PushNotifications.register();
      }
    } finally {
      setLoading(false);
    }
  }, [isNativePushSupported, attachListeners]);

  return {
    permission,
    handleRequestPermission,
    loading,
    refreshSetup: setupNativePush,
    isNativePushSupported,
  };
}
