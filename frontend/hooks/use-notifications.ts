"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/api";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";

export function useNotifications() {
  const { user } = useUser();
  const notificationSetupDone = useRef(false);

  useEffect(() => {
    // Capacitor kontrolü - sadece mobilde çalış
    const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();
    if (!isNative) {
      return;
    }

    // Setup yapıldıysa tekrar yapma (User değişebilir o yüzden user kontrolü önemli)
    if (notificationSetupDone.current && !user) return;

    const setupFirebaseMessaging = async () => {
      try {
        const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
        const { Capacitor } = await import("@capacitor/core");
        const platform = Capacitor.getPlatform();

        console.log("[Push] Setup başlatılıyor. Platform:", platform);

        // Önce mevcut izni kontrol et
        const currentPerms = await FirebaseMessaging.checkPermissions();
        console.log("[Push] Mevcut izin durumu:", currentPerms.receive);

        let status = currentPerms.receive;

        // "prompt" ise (henüz sorulmadıysa) izin iste
        if (status === "prompt") {
          console.log("[Push] İzin isteniyor...");
          const permResult = await FirebaseMessaging.requestPermissions();
          status = permResult.receive;
        }

        if (status !== "granted") {
          console.log("[Push] İzin reddedildi:", status);
          notificationSetupDone.current = true;
          return;
        }

        // Token al
        const tokenResult = await FirebaseMessaging.getToken();
        console.log("[Push] Token alındı");

        if (user && tokenResult.token) {
          await saveTokenToBackend(tokenResult.token, platform);
          notificationSetupDone.current = true;
        }

        // Token yenilendiğinde backend'i güncelle
        await FirebaseMessaging.addListener("tokenReceived", async (event) => {
          console.log("[Push] Token yenilendi");
          if (user) {
            await saveTokenToBackend(event.token, platform);
          }
        });

        // Bildirim dinleyicileri
        await FirebaseMessaging.addListener("notificationReceived", (event) => {
          console.log("[Push] Bildirim geldi:", event.notification);
          toast.success(event.notification.body || "", {
            title: event.notification.title,
            icon: '🔔',
            duration: 5000,
          } as any);
        });

        await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
          console.log("[Push] Bildirime tıklandı:", event.actionId);
        });

        console.log("[Push] Kurulum başarıyla tamamlandı.");
      } catch (error) {
        console.error("[Push] Kurulum başarısız:", error);
      }
    };

    if (user) {
      setupFirebaseMessaging();
    }
  }, [user]);

  const saveTokenToBackend = async (fcmToken: string, platform: string) => {
    if (!user) return;
    try {
      const client = createBrowserClient();
      await (client.users as any).saveFcmToken({
        clerkId: user.id,
        token: fcmToken,
        deviceType: platform,
      });
      console.log("[Push] Token backend'e kaydedildi.");
    } catch (error) {
      console.error("[Push] Token backend'e kaydedilemedi:", error);
    }
  };

  const [permission, setPermission] = useState<string>("prompt");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();
      if (!isNative) return;
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const currentPerms = await FirebaseMessaging.checkPermissions();
      setPermission(currentPerms.receive);
    };
    check();
  }, []);

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging");
      const permResult = await FirebaseMessaging.requestPermissions();
      setPermission(permResult.receive);
    } catch (error) {
      console.error("[Push] Error requesting permission:", error);
    } finally {
      setLoading(false);
    }
  };

  return { permission, handleRequestPermission, loading };
}
