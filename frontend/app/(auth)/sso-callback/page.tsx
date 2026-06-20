"use client";

import { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// This page is deployed to Vercel and acts as a bridge for OAuth.
// - For NATIVE apps (source=native): Forwards params to the app via Deep Link
// - For WEB users: Processes the callback normally with Clerk

export default function SSOCallbackPage() {
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const [deepLinkUrl, setDeepLinkUrl] = useState<string>("");
  const [returnUrl, setReturnUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryReturn = params.get("return_url");
      if (queryReturn) return queryReturn;
      
      return localStorage.getItem('auth_return_url') || "/home";
    }
    return "/home";
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_return_url');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source");
    
    if (source === "native") {
      setIsNative(true);
      
      // Forward all parameters received from Clerk/Google back to the app
      const searchParamsString = params.toString();
      
      if (searchParamsString) {
        const appScheme = "com.everything.app";
        const targetUrl = `${appScheme}://oauth-native-callback?${searchParamsString}`;
        setDeepLinkUrl(targetUrl);
        
        console.log("Redirecting to app via deep link:", targetUrl);
        // Try automatic redirect
        window.location.href = targetUrl;
      }
    } else {
      // Web user - let Clerk handle it
      setIsNative(false);
    }
  }, []);

  // Still determining...
  if (isNative === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
        <div className="text-center">
          <div className="mb-6">
             <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">İşleniyor...</h1>
        </div>
      </div>
    );
  }

  // Native app - show redirecting UI with a manual fallback button
  if (isNative) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
        <div className="text-center max-w-sm w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="mb-6">
             <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Uygulamaya Dönülüyor</h1>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Giriş başarılı oldu. Otomatik olarak yönlendirilmezseniz lütfen aşağıdaki butona tıklayın.
          </p>
          {deepLinkUrl && (
            <a 
              href={deepLinkUrl}
              className="inline-flex items-center justify-center w-full bg-[#FF6B35] text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:bg-[#e05a26] active:scale-95 transition-all text-center cursor-pointer"
            >
              Uygulamayı Aç
            </a>
          )}
        </div>
      </div>
    );
  }

  // Web user - let Clerk handle the callback and create session
  if (isNative === false) {
    console.log("SSO Callback - Rendering Clerk with afterSignInUrl:", returnUrl);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7]">
         <AuthenticateWithRedirectCallback 
           afterSignInUrl={returnUrl}
           afterSignUpUrl={returnUrl}
           signInUrl="/sign-in"
           signUpUrl="/sign-in"
         />
      </div>
    );
  }

  return null;
}