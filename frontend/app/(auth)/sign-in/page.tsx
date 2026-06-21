"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const localeData = {
  tr: {
    welcome: "Hoş Geldiniz",
    subtitle: "Hesabınıza giriş yapın",
    continueWithGoogle: "Google ile devam et",
    continueWithApple: "Apple ile devam et",
    termsStart: "Devam ederek,",
    termsOfService: "Kullanım Şartları",
    termsMiddle: "ve",
    privacyPolicy: "Gizlilik Politikası",
    termsEnd: "koşullarını kabul etmiş olursunuz.",
  },
  en: {
    welcome: "Welcome",
    subtitle: "Sign in to your account",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    termsStart: "By continuing, you agree to our",
    termsOfService: "Terms of Service",
    termsMiddle: "and",
    privacyPolicy: "Privacy Policy",
    termsEnd: ".",
  },
};

export default function SignInPage() {
  const router = useRouter();
  const { isAuthenticated, loading, signIn } = useAuthContext();
  const { locale } = useLanguage();
  const [pendingProvider, setPendingProvider] = useState<"google" | "apple" | null>(null);

  const t = localeData[locale as "tr" | "en"] || localeData.tr;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, loading, router]);

  if ((loading && !pendingProvider) || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setPendingProvider("google");
    try {
      await signIn("google");
    } finally {
      setPendingProvider(null);
    }
  };

  const handleAppleLogin = async () => {
    setPendingProvider("apple");
    try {
      await signIn("apple");
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF9F7] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.welcome}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading || pendingProvider !== null}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pendingProvider === "google" ? (
              <div className="w-5 h-5 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium text-gray-700">{t.continueWithGoogle}</span>
              </>
            )}
          </button>

          <button
            onClick={handleAppleLogin}
            disabled={loading || pendingProvider !== null}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pendingProvider === "apple" ? (
              <div className="w-5 h-5 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-900" viewBox="0 0 384 512" fill="currentColor">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4.1 190.1 4.1 270.7c0 45.4 17.1 113 54 165.5 19.3 27.2 41.2 55 70.8 55s40.2-22.1 76-22.1c35.2 0 45.1 22.1 75.1 22.1s52-25.1 70.3-52.1c25.4-36.5 35.8-71.8 36-73.4-.6-.4-69.6-26.4-69.8-106.1zm-82.5-171.7c17.1-20.7 28.5-49.4 25.3-78-24.8 1.1-54.7 16.5-72.5 37.5-16.1 18.9-30.2 48.8-26.4 76.5 27.7 2.1 56.5-15.3 73.6-36z" />
                </svg>
                <span className="font-medium text-gray-700">{t.continueWithApple}</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
          {t.termsStart}{" "}
          <Link href="/terms" className="text-[#FF6B35] hover:text-[#e55a2b] font-medium">
            {t.termsOfService}
          </Link>{" "}
          {t.termsMiddle}{" "}
          <Link href="/privacy" className="text-[#FF6B35] hover:text-[#e55a2b] font-medium">
            {t.privacyPolicy}
          </Link>{" "}
          {t.termsEnd}
        </p>
      </div>
    </div>
  );
}
