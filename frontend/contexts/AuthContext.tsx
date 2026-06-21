"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthChange, signInWithGoogle, signInWithApple, handleRedirectResult, logOut } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

interface AuthContextType {
  user: User | null;
  backendUser: any | null;
  loading: boolean;
  signIn: (provider?: "google" | "apple") => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let authResolved = false;

    // Fast check for iOS native user
    const quickCheckNativeUser = async () => {
      const nativeUserJson = localStorage.getItem("ios_native_user");
      if (nativeUserJson) {
        try {
          const nativeUser = JSON.parse(nativeUserJson);
          setUser({
            uid: nativeUser.uid,
            email: nativeUser.email,
            displayName: nativeUser.displayName,
            photoURL: nativeUser.photoURL
          } as any);

          // Get backend user in the background
          client.users.getUserByClerkId(nativeUser.uid)
            .then(res => {
              if (res.user) {
                setBackendUser(res.user);
              }
            })
            .catch(err => console.error("Quick backend load failed:", err));

          setLoading(false);
        } catch (e) {
          console.error("Native user parse error:", e);
        }
      }
    };
    quickCheckNativeUser();

    // Timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (!authResolved) {
        console.warn("Auth check timed out, resolving loading state");
        setLoading(false);
      }
    }, 4000);

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      authResolved = true;
      clearTimeout(timeoutId);

      let effectiveUser = firebaseUser;
      if (!firebaseUser && typeof window !== "undefined") {
        const nativeUserJson = localStorage.getItem("ios_native_user");
        if (nativeUserJson) {
          try {
            const nativeUser = JSON.parse(nativeUserJson);
            effectiveUser = {
              uid: nativeUser.uid,
              email: nativeUser.email,
              displayName: nativeUser.displayName,
              photoURL: nativeUser.photoURL
            } as any;
          } catch (e) {
            console.error("Failed to parse native user:", e);
          }
        }
      }

      setUser(effectiveUser);

      if (effectiveUser) {
        try {
          const res = await (client.users.getOrCreateUser as any)({
            clerkId: effectiveUser.uid,
            firebaseId: effectiveUser.uid,
            username: effectiveUser.displayName ? effectiveUser.displayName.toLowerCase().replace(/\s+/g, "") : undefined,
            fullName: effectiveUser.displayName || undefined,
            avatarUrl: effectiveUser.photoURL || undefined
          });
          if (res.user) {
            setBackendUser(res.user);
          }
        } catch (err) {
          console.error("Database user sync failed:", err);
        }
      } else {
        setBackendUser(null);
      }

      setLoading(false);
    });

    // Capacitor Deep Link listener
    const setupDeepLinks = async () => {
      if (typeof window !== "undefined" && (window as any).Capacitor) {
        try {
          const { App } = await import("@capacitor/app");

          // 1. App already open when deep link is clicked
          App.addListener("appUrlOpen", (data) => {
            handleUrl(data.url);
          });

          // 2. App opened by deep link (Cold Start)
          const launchUrl = await App.getLaunchUrl();
          if (launchUrl) {
            handleUrl(launchUrl.url);
          }
        } catch (e) {
          console.warn("[DeepLink] Failed to register App listener:", e);
        }
      }
    };

    const handleUrl = (urlStr: string) => {
      console.log("[DeepLink] Handling URL:", urlStr);
      try {
        const baseUrl = "https://allminiapps.com";
        let normalized = urlStr;
        
        if (urlStr.startsWith("com.everything.apps://")) {
          const pathPart = urlStr.replace("com.everything.apps://", "");
          normalized = `${baseUrl}/${pathPart.startsWith("/") ? pathPart.substring(1) : pathPart}`;
        }
        
        const url = new URL(normalized, baseUrl);
        const pathname = url.pathname;
        const search = url.search;

        console.log("[DeepLink] Parsed:", { pathname, search });

        // OAuth callback (Android browser flow only - iOS uses native sign-in)
        if (pathname.includes("oauth-native-callback") || urlStr.includes("oauth-native-callback")) {
          const token = url.searchParams.get("token");
          if (token) {
            let platform = "web";
            if (typeof window !== "undefined" && (window as any).Capacitor) {
              platform = (window as any).Capacitor.getPlatform?.() || "web";
            }

            if (platform === "ios") {
              console.warn("[DeepLink] Ignoring browser OAuth callback on iOS");
              setLoading(false);
            } else {
              router.push(`/oauth-native-callback?token=${token}`);
            }
          }
          return;
        }

        // Support deep link routing for other pages
        const supportedPrefixes = [
          "/apps/",
          "/profile",
        ];

        const isSupported = supportedPrefixes.some(
          (prefix) => pathname === prefix || pathname.startsWith(prefix)
        );

        if (isSupported && pathname !== "/") {
          router.push(`${pathname}${search}`);
        }
      } catch (e) {
        console.error("[DeepLink] URL parse error:", e, urlStr);
      }
    };

    setupDeepLinks();

    const handleNativeAuthChange = async (event: Event) => {
      authResolved = true;
      clearTimeout(timeoutId);

      const customEvent = event as CustomEvent;
      const nativeUser = customEvent.detail;

      if (nativeUser) {
        setUser({
          uid: nativeUser.uid,
          email: nativeUser.email,
          displayName: nativeUser.displayName,
          photoURL: nativeUser.photoURL
        } as any);

        try {
          const res = await (client.users.getOrCreateUser as any)({
            clerkId: nativeUser.uid,
            firebaseId: nativeUser.uid,
            username: nativeUser.displayName ? nativeUser.displayName.toLowerCase().replace(/\s+/g, "") : undefined,
            fullName: nativeUser.displayName || undefined,
            avatarUrl: nativeUser.photoURL || undefined
          });
          if (res.user) {
            setBackendUser(res.user);
          }
        } catch (e) {
          console.error("Native auth change backend sync error:", e);
        }

        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    window.addEventListener("ios-native-auth-change", handleNativeAuthChange);

    const checkRedirect = async () => {
      const redirectUser = await handleRedirectResult();
      if (redirectUser) {
        setUser(redirectUser);
      }
    };
    checkRedirect();

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      window.removeEventListener("ios-native-auth-change", handleNativeAuthChange);
    };
  }, []);

  const signIn = async (provider: "google" | "apple" = "google") => {
    setLoading(true);
    try {
      let platform = "web";
      let isNativeApp = false;

      if (typeof window !== "undefined" && (window as any).Capacitor) {
        const Cap = (window as any).Capacitor;
        isNativeApp = typeof Cap.isNativePlatform === "function" ? Cap.isNativePlatform() : Cap.platform !== "web";
        platform = Cap.getPlatform?.() || "web";
      }

      // iOS Native SDK handling (Everydle ile aynı akış)
      if (platform === "ios") {
        const user = provider === "apple" ? await signInWithApple(false) : await signInWithGoogle(false);
        if (user) {
          setUser(user);
          const res = await (client.users.getOrCreateUser as any)({
            clerkId: user.uid,
            firebaseId: user.uid,
            username: user.displayName ? user.displayName.toLowerCase().replace(/\s+/g, "") : undefined,
            fullName: user.displayName || undefined,
            avatarUrl: user.photoURL || undefined
          });
          if (res.user) {
            setBackendUser(res.user);
          }
        }
        return;
      }

      // Android Native handling
      if (platform === "android" && isNativeApp && provider === "google") {
        const clientId = "798226372844-rkgbhbs91ou6mau78r5c8l73lqudqq18.apps.googleusercontent.com";
        const redirectUri = encodeURIComponent("https://allminiapps.com/sso-callback");
        const scope = encodeURIComponent("email profile openid");
        const responseType = "id_token";
        const nonce = Math.random().toString(36).substring(2);
        const state = encodeURIComponent("source=native");

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&nonce=${nonce}&state=${state}&prompt=select_account`;

        window.open(googleAuthUrl, "_system");
        return;
      }

      if (provider === "apple") {
        await signInWithApple(false);
      } else {
        await signInWithGoogle(false);
      }
    } catch (error) {
      console.error("Sign-in failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      localStorage.removeItem("ios_native_user");
      await logOut();
      setUser(null);
      setBackendUser(null);
      router.push("/");
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    backendUser,
    loading,
    signIn,
    signOut: signOutUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

// Clerk backward compatibility shims
export function useAuth() {
  const { user, loading, signOut } = useAuthContext();
  return React.useMemo(() => ({
    isSignedIn: !!user,
    isLoaded: !loading,
    userId: user ? user.uid : null,
    signOut,
  }), [user, loading, signOut]);
}

export function useUser() {
  const { user, backendUser, loading } = useAuthContext();

  return React.useMemo(() => {
    if (!user) {
      return {
        isSignedIn: false,
        isLoaded: !loading,
        user: null,
      };
    }

    return {
      isSignedIn: true,
      isLoaded: !loading,
      user: {
        id: user.uid,
        fullName: backendUser?.full_name || user.displayName || "",
        firstName: (backendUser?.full_name || user.displayName || "").split(" ")[0] || "",
        lastName: (backendUser?.full_name || user.displayName || "").split(" ").slice(1).join(" ") || "",
        imageUrl: backendUser?.avatar_url || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        username: backendUser?.username || null,
        primaryEmailAddress: {
          emailAddress: user.email || ""
        }
      }
    };
  }, [user, backendUser, loading]);
}

export function useClerk() {
  const { signOut } = useAuthContext();
  return {
    signOut,
    openSignIn: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("open-auth-modal"));
      }
    },
    handleRedirectCallback: async (params?: any) => {
      return {};
    }
  };
}

export function useSignIn() {
  const { signIn } = useAuthContext();

  return {
    isLoaded: true,
    signIn: {
      create: async ({ strategy }: any) => {
        const provider = strategy === "oauth_apple" ? "apple" : "google";
        const user = await signIn(provider);
        return {
          firstFactorVerification: {
            externalVerificationRedirectURL: null as any
          },
          user
        };
      },
      authenticateWithRedirect: async ({ strategy }: any) => {
        const provider = strategy === "oauth_apple" ? "apple" : "google";
        await signIn(provider);
      }
    } as any
  };
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading || !user) return null;
  return <>{children}</>;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading || user) return null;
  return <>{children}</>;
}

export function SignInButton({ children, mode }: { children?: React.ReactNode; mode?: "modal" | "redirect" }) {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-auth-modal"));
    }
  };

  if (!children) {
    return (
      <button onClick={handleClick} className="rounded-full bg-indigo-600 px-5 py-2 text-white font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95">
        Sign In
      </button>
    );
  }

  return React.cloneElement(children as React.ReactElement<any>, {
    onClick: (e: React.MouseEvent) => {
      if ((children as any).props.onClick) {
        (children as any).props.onClick(e);
      }
      handleClick();
    }
  });
}

export function SignOutButton({ children }: { children?: React.ReactNode }) {
  const { signOut } = useAuthContext();
  const handleClick = () => signOut();

  if (!children) {
    return (
      <button onClick={handleClick} className="rounded-full bg-red-600 px-5 py-2 text-white font-semibold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95">
        Sign Out
      </button>
    );
  }

  return React.cloneElement(children as React.ReactElement<any>, {
    onClick: (e: React.MouseEvent) => {
      if ((children as any).props.onClick) {
        (children as any).props.onClick(e);
      }
      handleClick();
    }
  });
}

export function UserButton({ appearance, afterSignOutUrl }: any) {
  const { user, backendUser, signOut } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerElement && !containerElement.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [containerElement]);

  if (!user) return null;

  const avatarUrl = backendUser?.avatar_url || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;
  const displayName = backendUser?.full_name || user.displayName || backendUser?.username || "User";

  return (
    <div className="relative inline-block text-left" ref={setContainerElement}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`focus:outline-none flex items-center justify-center rounded-full overflow-hidden transition-all hover:opacity-90 active:scale-95 ${appearance?.elements?.userButtonAvatarBox || "w-9 h-9 border border-gray-200"}`}
      >
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl border border-gray-100 ring-1 ring-black/5 z-[160] focus:outline-none transition-all">
          <div className="px-3 py-2 border-b border-gray-50 mb-1">
            <p className="text-xs text-gray-400 font-medium">Signed in as</p>
            <p className="text-sm font-bold text-gray-800 truncate max-w-full">{displayName}</p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function AuthenticateWithRedirectCallback(props: any) {
  return null;
}
