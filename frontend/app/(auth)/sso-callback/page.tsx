"use client";

import { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// This page is deployed to Vercel and acts as a bridge for OAuth.
// - For NATIVE apps (source=native): Forwards params to the app via Deep Link
// - For WEB users: Processes the callback normally with Clerk

export default function SSOCallbackPage() {
  const [isNative, setIsNative] = useState<boolean | null>(null);
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
      // ...
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

  // Native app - show redirecting UI
  if (isNative) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F7] p-6">
        <div className="text-center">
          <div className="mb-6">
             <div className="w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Uygulamaya Dönülüyor</h1>
          <p className="text-gray-600">Lütfen bekleyin...</p>
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
           signUpUrl="/sign-up"
         />
      </div>
    );
  }

  return null;
}