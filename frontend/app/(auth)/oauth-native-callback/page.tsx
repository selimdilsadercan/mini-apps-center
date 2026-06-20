"use client";

import { useAuth, useClerk } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function OAuthNativeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useAuth();
  const { handleRedirectCallback } = useClerk();

  // Zaten giriş yapmışsa direkt Ana Sayfaya
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  // Arka planda sessizce doğrulama işlemini yap
  useEffect(() => {
    const processParams = async () => {
      if (isSignedIn) return;
      
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      
      if (!code) {
        console.log("No code param found in URL yet");
        return;
      }

      try {
        console.log("Exchanging code for session...");
        await handleRedirectCallback({
           redirectUrl: "https://my.allminiapps.com/sso-callback?source=native"
        });
        console.log("Silent verification success");
        
        // Başarılı olduktan sonra home'a yönlendir
        setTimeout(() => {
          router.push("/home");
        }, 1000);
      } catch (err) {
        console.error("Silent verification error:", err);
      }
    };

    if (isLoaded) {
        processParams();
    }
  }, [handleRedirectCallback, isSignedIn, isLoaded, searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-8">
            <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Google Girişi Başarılı!</h1>
            <p className="text-gray-600">
              Giriş Yapılıyor...
            </p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthNativeCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <OAuthNativeCallbackContent />
    </Suspense>
  );
}