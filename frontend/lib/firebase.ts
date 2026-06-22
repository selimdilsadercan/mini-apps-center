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

if (typeof window !== "undefined" && !isIOS()) {
  try {
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
} else if (typeof window !== "undefined" && isIOS()) {
  console.log("[Firebase] iOS native auth mode — skipping JS SDK init");
}

// Google Auth Provider (lazy — avoid loading gapi on iOS)
let googleProvider: GoogleAuthProvider | null = null;
function getGoogleProvider() {
  if (!googleProvider) {
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  }
  return googleProvider;
}

// Apple Auth Provider
let appleProvider: OAuthProvider | null = null;
function getAppleProvider() {
  if (!appleProvider) {
    appleProvider = new OAuthProvider("apple.com");
    appleProvider.addScope("email");
    appleProvider.addScope("name");
  }
  return appleProvider;
}

// ==================== iOS NATIVE AUTH ====================
// iOS'ta @capacitor-firebase/authentication plugin kullanılır

async function signInWithGoogleNativeIOS(retryCount = 0): Promise<User | null> {
  try {
    console.log("[Firebase] Starting native Google sign-in...");
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");

    const result = await FirebaseAuthentication.signInWithGoogle();
    console.log("[Firebase] Native Google sign-in result:", result.user?.email || "no user");

    if (result.user) {
      const nativeUser = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoUrl,
        providerId: "firebase",
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
    console.error("[Firebase] iOS native sign-in error:", error);

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
    if (isIOS()) {
      return await signInWithGoogleNativeIOS();
    }

    if (isMobile) {
      await signInWithRedirect(auth, getGoogleProvider());
      return null;
    } else {
      const result = await signInWithPopup(auth, getGoogleProvider());
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
      await signInWithRedirect(auth, getAppleProvider());
      return null;
    } else {
      const result = await signInWithPopup(auth, getAppleProvider());
      return result.user;
    }
  } catch (error) {
    console.error("Apple ile giriş hatası:", error);
    return null;
  }
}

export async function getFullRedirectResult(): Promise<any> {
  try {
    if (isIOS()) return null;
    return await getRedirectResult(auth);
  } catch (error) {
    console.error("Redirect hatası:", error);
    return null;
  }
}

export async function handleRedirectResult(): Promise<User | null> {
  const result = await getFullRedirectResult();
  return result?.user || null;
}

export async function logOut(): Promise<void> {
  try {
    if (isIOS()) {
      try {
        const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
        await FirebaseAuthentication.signOut();
        return;
      } catch (e) {
        console.error("[Firebase] iOS native sign-out error:", e);
      }
    }

    await signOut(auth);
  } catch (error) {
    console.error("[Firebase] Çıkış hatası:", error);
    throw error;
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (isIOS()) {
    (async () => {
      try {
        const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");

        FirebaseAuthentication.addListener("authStateChange", async (change) => {
          if (change.user) {
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
          window.dispatchEvent(new CustomEvent("ios-native-auth-change", { detail: null }));
        }
      } catch (e) {
        console.warn("[Firebase] iOS native auth listener setup failed:", e);
      }
    })();
  }

  if (!auth) {
    console.warn("[Firebase] Auth not initialized, calling callback with null user");
    setTimeout(() => callback(null), 0);
    return () => {};
  }

  // iOS'ta native auth kullanıyoruz; JS SDK listener gapi/web OAuth tetikleyebilir
  if (isIOS()) {
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function deleteCurrentUser(): Promise<{ success: boolean; error?: string }> {
  try {
    if (isIOS()) {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      await FirebaseAuthentication.deleteUser();
      localStorage.removeItem("ios_native_user");
      return { success: true };
    }

    const currentUser = auth?.currentUser;
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

export { isIOS, isNativePlatform };
export { auth };
export type { User };
