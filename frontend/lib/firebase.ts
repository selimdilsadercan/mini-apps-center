import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  deleteUser as firebaseDeleteUser,
  setPersistence,
  browserLocalPersistence,
  signInWithCredential,
  User,
  Auth,
  OAuthProvider
} from "firebase/auth";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { Capacitor } from "@capacitor/core";

// Firebase yapılandırması - .env.local'dan alınıyor
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Platform kontrolü
function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

// Firebase uygulamasını başlat (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  // Only initialize Firebase Web SDK on non-native platforms
  // Native platforms use @capacitor-firebase/authentication directly
  if (!isNativePlatform()) {
    try {
      // Firebase Config kontrolü
      if (!firebaseConfig.apiKey) {
        console.warn("Firebase API Key eksik. .env.local dosyasını kontrol edin.");
      }

      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      auth = getAuth(app);

      setPersistence(auth, browserLocalPersistence)
        .then(() => {})
        .catch((err) => {
          console.warn("[Firebase] Persistence error:", err);
        });

      // Messaging sadece web'de çalışır (native'de FCM plugin kullanılır)
      if ("Notification" in window && "serviceWorker" in navigator) {
        try {
          messaging = getMessaging(app);
        } catch (error) {
          console.warn("[Firebase] Messaging başlatılamadı:", error);
        }
      }
    } catch (error) {
      console.error("[Firebase] Initialization Error:", error);
      try {
        if (getApps().length > 0) {
          app = getApps()[0];
          auth = getAuth(app);
          console.log("[Firebase] Fallback auth initialized");
        }
      } catch (e) {
        console.error("[Firebase] Fallback failed:", e);
      }
    }
  }
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Apple Auth Provider
const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

// ==================== iOS NATIVE AUTH ====================
// iOS'ta @capacitor-firebase/authentication plugin kullanılır

async function signInWithGoogleNativeIOS(retryCount = 0): Promise<User | null> {
  try {
    // Dinamik import - sadece iOS'ta yüklenir
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");

    // Native Google Sign-In - Bu native Firebase SDK kullanıyor
    const result = await FirebaseAuthentication.signInWithGoogle();

    if (result.user) {
      // Native user bilgilerini oluştur
      const nativeUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoUrl,
        providerId: "firebase",
        isNativeUser: true
      };

      // localStorage'a kaydet (sayfa yenilense bile kalıcı olsun)
      localStorage.setItem("ios_native_user", JSON.stringify(nativeUser));

      // Custom event dispatch et - AuthContext bunu dinleyecek ve state'i güncelleyecek
      // Bu, reload yapmadan anında UI güncellenmesini sağlar
      window.dispatchEvent(
        new CustomEvent("ios-native-auth-change", {
          detail: nativeUser
        })
      );

      // Fake User objesi döndür - AuthContext setUser yapacak
      return {
        uid: nativeUser.uid,
        email: nativeUser.email,
        displayName: nativeUser.displayName,
        photoURL: nativeUser.photoURL
      } as User;
    }

    return null;
  } catch (error: any) {
    console.error("[Firebase] iOS native sign-in error:", error);

    // Network hatası alırsa otomatik retry (max 2 deneme)
    if (error?.code === "auth/network-request-failed" && retryCount < 2) {
      console.log("[Firebase] Network error, retrying in 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return signInWithGoogleNativeIOS(retryCount + 1);
    }

    throw error;
  }
}

async function signInWithAppleNativeIOS(): Promise<User | null> {
  try {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");

    const result = await FirebaseAuthentication.signInWithApple();

    if (result.user) {
      const nativeUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoUrl,
        providerId: "apple.com",
        isNativeUser: true
      };

      localStorage.setItem("ios_native_user", JSON.stringify(nativeUser));

      window.dispatchEvent(
        new CustomEvent("ios-native-auth-change", {
          detail: nativeUser
        })
      );

      return {
        uid: nativeUser.uid,
        email: nativeUser.email,
        displayName: nativeUser.displayName,
        photoURL: nativeUser.photoURL
      } as User;
    }

    return null;
  } catch (error: any) {
    console.error("[Firebase] iOS native Apple sign-in error:", error);
    console.error("[Firebase] Apple sign-in error code:", error?.code);
    console.error("[Firebase] Apple sign-in error message:", error?.message);
    throw error;
  }
}

// Google ile giriş yap
export async function signInWithGoogle(isMobile: boolean = false): Promise<User | null> {
  try {
    // iOS'ta native SDK kullan
    if (isIOS()) {
      return await signInWithGoogleNativeIOS();
    }

    // Android ve Web'de mevcut JS SDK kullan
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error) {
    console.error("Google ile giriş hatası:", error);
    return null;
  }
}

// Apple ile giriş yap
export async function signInWithApple(isMobile: boolean = false): Promise<User | null> {
  try {
    if (isIOS()) {
      return await signInWithAppleNativeIOS();
    }

    if (isMobile) {
      await signInWithRedirect(auth, appleProvider);
      return null;
    } else {
      const result = await signInWithPopup(auth, appleProvider);
      return result.user;
    }
  } catch (error) {
    console.error("Apple ile giriş hatası:", error);
    return null;
  }
}

// Redirect sonucunu al (Tüm sonucu döner)
export async function getFullRedirectResult(): Promise<any> {
  try {
    // iOS'ta redirect kullanılmıyor
    if (isIOS()) return null;
    return await getRedirectResult(auth);
  } catch (error) {
    console.error("Redirect hatası:", error);
    return null;
  }
}

// Geriye dönük uyumluluk için eski fonksiyonu koruyalım veya güncelleyelim
export async function handleRedirectResult(): Promise<User | null> {
  const result = await getFullRedirectResult();
  return result?.user || null;
}

// Çıkış yap
export async function logOut(): Promise<void> {
  try {
    // iOS'ta native sign-out yap
    if (isIOS()) {
      try {
        const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
        await FirebaseAuthentication.signOut();
        // iOS'ta native auth kullandığımız için JS SDK signOut'a gerek yok
        // JS SDK'da geçerli bir session olmadığı için signOut çağrısı asılı kalabilir
        return;
      } catch (e) {
        console.error("[Firebase] iOS native sign-out error:", e);
        // Hata olsa bile devam edip JS SDK'yı da deneyelim
      }
    }

    // Android ve Web için JS SDK signOut
    await signOut(auth);
  } catch (error) {
    console.error("[Firebase] Çıkış hatası:", error);
    throw error; // Hatayı yukarı fırlat
  }
}

// Auth state değişikliklerini dinle
export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  // iOS'ta native auth state listener da ekle
  if (isIOS()) {
    // Native auth state listener (async)
    (async () => {
      try {
        const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");

        // Native listener
        FirebaseAuthentication.addListener("authStateChange", async (change) => {
          if (change.user) {
            // Dispatch custom event instead of reloading. AuthContext will handle it.
            const nativeUser = {
              uid: change.user.uid,
              email: change.user.email,
              displayName: change.user.displayName,
              photoURL: change.user.photoUrl,
              providerId: change.user.providerId || "firebase",
              isNativeUser: true
            };
            localStorage.setItem("ios_native_user", JSON.stringify(nativeUser));
            window.dispatchEvent(new CustomEvent("ios-native-auth-change", { detail: nativeUser }));
          } else {
            localStorage.removeItem("ios_native_user");
            window.dispatchEvent(new CustomEvent("ios-native-auth-change", { detail: null }));
          }
        });

        // Mevcut native user'ı kontrol et ve event fırlat (ilk açılış için)
        const currentUser = await FirebaseAuthentication.getCurrentUser();
        if (currentUser.user) {
          const nativeUser = {
            uid: currentUser.user.uid,
            email: currentUser.user.email,
            displayName: currentUser.user.displayName,
            photoURL: currentUser.user.photoUrl,
            providerId: currentUser.user.providerId || "firebase",
            isNativeUser: true
          };
          localStorage.setItem("ios_native_user", JSON.stringify(nativeUser));
          window.dispatchEvent(new CustomEvent("ios-native-auth-change", { detail: nativeUser }));
        } else {
          // No native user found, let AuthContext know so it can potentially stop loading
          window.dispatchEvent(new CustomEvent("ios-native-auth-change", { detail: null }));
        }
      } catch (e) {
        console.warn("[Firebase] iOS native auth listener setup failed:", e);
      }
    })();
  }

  // Auth undefined kontrolü
  if (!auth) {
    console.warn("[Firebase] Auth not initialized, calling callback with null user");
    setTimeout(() => callback(null), 0);
    return () => {};
  }

  // JS SDK auth state listener (iOS dahil tüm platformlar için)
  return onAuthStateChanged(auth, callback);
}

// Mevcut kullanıcıyı Firebase'den sil
export async function deleteCurrentUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: "No user logged in" };
    }

    await firebaseDeleteUser(currentUser);
    return { success: true };
  } catch (error: any) {
    console.error("Firebase hesap silme hatası:", error);

    if (error.code === "auth/requires-recent-login") {
      return {
        success: false,
        error: "Hesabınızı silmek için yeniden giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar giriş yapın."
      };
    }

    return {
      success: false,
      error: error.message || "Hesap silinirken bir hata oluştu"
    };
  }
}

// ==================== PUSH NOTIFICATIONS ====================

// Bildirim izni iste
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

// FCM Token al
export async function getFCMToken(): Promise<string | null> {
  if (!messaging) {
    console.warn("Messaging not initialized");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error("VAPID key bulunamadı");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    return token;
  } catch (error) {
    console.error("FCM Token alınamadı:", error);
    return null;
  }
}

// Foreground'da bildirim dinle
export function onForegroundMessage(callback: (payload: any) => void): () => void {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

// Platform helper'ları export et
export { isIOS, isNativePlatform };

// Auth instance'ını export et
export { auth, messaging };
export type { User };
