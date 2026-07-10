"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

const isNative = Capacitor.isNativePlatform();
const isCapacitorBuild = process.env.NEXT_PUBLIC_CAPACITOR === "true";

// Google onayı beklenirken native ortamda da TEST (dev) anahtarını kullanıyoruz
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Clerk Publishable Key - Auth will not work");
}

function DeepLinkHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isNative) return;

    const setupDeepLinkListener = async () => {
      const handle = await App.addListener('appUrlOpen', async (event) => {
        console.log('Deep link received:', event.url);

        try {
          const url = new URL(event.url);
          const path = url.pathname; // e.g. /oauth-native-callback or //oauth-native-callback
          const searchParam = url.search; // e.g. ?code=...&state=...
          
          // Android might give com.recipe.app://oauth-native-callback
          // Handle various URL formats standard in Deep Links
          
          if (url.host === 'oauth-native-callback' || path.includes('oauth-native-callback')) {
            console.log('OAuth callback received, navigating to handler...');
            
            // Close the system browser window on native devices
            try {
              const { Browser } = await import("@capacitor/browser");
              await Browser.close();
            } catch (browserErr) {
              console.error("Failed to close system browser:", browserErr);
            }
            
            // Construct the internal route path with query params
            // Ensure we keep the 'code' and 'state' parameters!
            const route = `/oauth-native-callback${searchParam}`;
            console.log('Navigating to:', route);
            
            // Force navigation
            router.push(route);
          }
          
          // Handle share-recipe deep link (from Instagram share)
          if (url.host === 'share-recipe' || path.includes('share-recipe')) {
            console.log('Share recipe deep link received...');
            
            const route = `/share-recipe${searchParam}`;
            console.log('Navigating to:', route);
            
            router.push(route);
          }
          
          // Handle create-recipe deep link (fallback)
          if (url.host === 'create-recipe' || path.includes('create-recipe')) {
            console.log('Create recipe deep link received...');
            
            const route = `/create-recipe${searchParam}`;
            console.log('Navigating to:', route);
            
            router.push(route);
          }
        } catch (err) {
          console.error('Error handling deep link:', err);
        }
      });

      return () => {
        handle.remove();
      };
    };

    setupDeepLinkListener();
  }, [router]);

  return <>{children}</>;
}

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSatellite, setIsSatellite] = useState(false);
  const [domain, setDomain] = useState("");
  const [signInUrl, setSignInUrl] = useState("/sign-in");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;

    const isLocal =
      !isCapacitorBuild && !isNative && (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".localhost")
      );

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "allminiapps.com";

    if (isLocal) {
      const primaryHost = `my.localhost`;
      const isSub = hostname !== primaryHost && hostname !== "localhost" && hostname !== "127.0.0.1";
      setIsSatellite(isSub);
      setDomain(port ? `${primaryHost}:${port}` : primaryHost);
      setSignInUrl(`${protocol}//${primaryHost}:${port || "5000"}/sign-in`);
    } else if (isNative || isCapacitorBuild) {
      // Native app (Capacitor) - Runs on allminiapps.com (iOS) or localhost (Android).
      // Since it runs directly on the root hostname, we set it as primary (non-satellite)
      // to ensure it reads the root domain cookies.
      setIsSatellite(false);
      setDomain(rootDomain);
      setSignInUrl("/sign-in");
    } else {
      const primaryHost = `my.${rootDomain}`;
      const isSub = hostname !== primaryHost && hostname !== rootDomain;
      setIsSatellite(isSub);
      setDomain(primaryHost);
      setSignInUrl(`${protocol}//${primaryHost}/sign-in`);
    }
  }, []);

  // Clerk props'larını any olarak tanımlıyoruz çünkü isSatellite true olduğunda 
  // TypeScript proxyUrl'i zorunlu tutabiliyor, ancak biz domain kullanıyoruz.
  const clerkProps: any = {
    publishableKey: PUBLISHABLE_KEY || "",
    afterSignOutUrl: "/",
    routerPush: (to: string) => router.push(to),
    routerReplace: (to: string) => router.replace(to),
    isSatellite: isSatellite,
    domain: domain || undefined,
    signInUrl: signInUrl,
  };

  return (
    <ClerkProvider {...clerkProps}>
      <DeepLinkHandler>
        {children}
      </DeepLinkHandler>
    </ClerkProvider>
  );
}
