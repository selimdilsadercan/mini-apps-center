"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Auth will not work");
}

const isNative = Capacitor.isNativePlatform();

const ROOT_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "everything.com";

/** Clerk satellite: subdomain host (e.g. iskambil.localhost) vs primary (localhost). */
function getClerkDomainConfig(): {
  isSatellite: boolean;
  domain?: string;
  signInUrl?: string;
} {
  if (typeof window === "undefined" || isNative) {
    return { isSatellite: false };
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const originWithPort = port ? `${hostname}:${port}` : hostname;

  if (hostname.endsWith(".localhost")) {
    const primary = port ? `localhost:${port}` : "localhost";
    if (hostname !== "localhost") {
      const primaryOrigin = `${window.location.protocol}//${primary}`;
      return {
        isSatellite: true,
        domain: originWithPort,
        signInUrl: `${primaryOrigin}/sign-in`,
      };
    }
    return { isSatellite: false };
  }

  if (hostname === ROOT_DOMAIN) {
    return { isSatellite: false };
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const primaryOrigin = `${window.location.protocol}//${ROOT_DOMAIN}`;
    return {
      isSatellite: true,
      domain: hostname,
      signInUrl: `${primaryOrigin}/sign-in`,
    };
  }

  return { isSatellite: false };
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
  const [clerkDomain, setClerkDomain] = useState(getClerkDomainConfig);

  useEffect(() => {
    setClerkDomain(getClerkDomainConfig());
  }, []);

  const satelliteProps = clerkDomain.isSatellite
    ? {
        isSatellite: true as const,
        domain: clerkDomain.domain!,
        signInUrl: clerkDomain.signInUrl!,
      }
    : {};

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY || ""}
      afterSignOutUrl="/"
      {...satelliteProps}
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
    >
      <DeepLinkHandler>
        {children}
      </DeepLinkHandler>
    </ClerkProvider>
  );
}
