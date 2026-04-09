"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

export function useNotifications() {
  const { user } = useUser();
  const notificationSetupDone = useRef(false);
  const [permission, setPermission] = useState<string>("prompt");
  const [loading, setLoading] = useState(false);

  const saveTokenToBackend = async (fcmToken: string, platform: string) => {
    if (!user) {
      console.log("[Push] Token kaydedilemedi: Kullanıcı (user) yok.");
      return;
    }
    try {
      console.log("[Push] Backend'e kaydediliyor... ClerkID:", user.id, "Platform:", platform);
      const client = createBrowserClient();
      const result = await client.users.saveFcmToken({
        clerkId: user.id,
        token: fcmToken,
        deviceType: platform,
      });
      if (result.success) {
        console.log("[Push] Token başarıyla kaydedildi.");
      } else {
        console.warn("[Push] Token kaydedildi dedi ama success false döndü.");
      }
    } catch (error) {
      console.error("[Push] Token backend'e kaydedilemedi:", error);
    }
  };

  const setupFirebaseMessaging = async () => {
    // Capacitor kontrolü - sadece mobilde çalış
    const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();
    if (!isNative) {
      console.log("[Push] Native platform değil, kurulum atlanıyor.");
      return;
    }

    if (notificationSetupDone.current && user) {
      console.log("[Push] Kurulum zaten bu session'da yapılmıştı.");
      return;
    }

    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const { Capacitor } = await import("@capacitor/core");
      const platform = Capacitor.getPlatform();

      console.log("[Push] Kurulum başlatılıyor. Platform:", platform);

      const currentPerms = await FirebaseMessaging.checkPermissions();
      setPermission(currentPerms.receive);
      console.log("[Push] Mevcut izin:", currentPerms.receive);

      if (currentPerms.receive === "granted") {
        const tokenResult = await FirebaseMessaging.getToken();
        console.log("[Push] Mevcut token alındı:", tokenResult.token ? "VAR" : "YOK");
        if (user && tokenResult.token) {
          await saveTokenToBackend(tokenResult.token, platform);
          notificationSetupDone.current = true;
        }
      }

      // Token yenilendiğinde backend'i güncelle
      await FirebaseMessaging.addListener("tokenReceived", async (event) => {
        console.log("[Push] Yeni token geldi (tokenReceived)");
        if (user) {
          await saveTokenToBackend(event.token, platform);
        }
      });

      // Bildirim dinleyicileri
      await FirebaseMessaging.addListener("notificationReceived", (event) => {
        console.log("[Push] Bildirim alındı:", event.notification.title);
        toast.success(event.notification.body || "", {
          duration: 5000,
          icon: '🔔',
        });
      });

    } catch (error) {
      console.error("[Push] Kurulum sırasında hata:", error);
    }
  };

  useEffect(() => {
    if (user) {
      setupFirebaseMessaging();
    }
  }, [user]);

  const handleRequestPermission = async () => {
    setLoading(true);
    console.log("[Push] Kullanıcıdan manuel izin isteniyor...");
    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const { Capacitor } = await import("@capacitor/core");
      const platform = Capacitor.getPlatform();

      const permResult = await FirebaseMessaging.requestPermissions();
      setPermission(permResult.receive);
      console.log("[Push] İzin sonucu:", permResult.receive);

      if (permResult.receive === "granted") {
        const tokenResult = await FirebaseMessaging.getToken();
        if (user && tokenResult.token) {
          await saveTokenToBackend(tokenResult.token, platform);
          notificationSetupDone.current = true;
        }
      }
    } catch (error) {
      console.error("[Push] İzin istenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  return { permission, handleRequestPermission, loading, refreshSetup: setupFirebaseMessaging };
}
