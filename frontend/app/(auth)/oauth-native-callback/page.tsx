"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function LoadingCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF9F7] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{subtitle}</p>
      </div>
    </div>
  );
}

function OAuthNativeCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processLogin = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("URL içerisinde token bulunamadı.");
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(token);
        const userCredential = await signInWithCredential(auth, credential);

        console.log("Native login success:", userCredential.user.email);

        setTimeout(() => {
          router.push("/home");
        }, 1000);
      } catch (err) {
        console.error("Native login error:", err);
        setError("Giriş işlemi başarısız oldu. Lütfen tekrar deneyin.");
      }
    };

    processLogin();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF9F7] p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hata Oluştu</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="w-full border border-gray-200 rounded-xl py-3 px-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <LoadingCard
      title="Oturum Açılıyor"
      subtitle="Kimlik bilgileriniz doğrulanıyor, lütfen bekleyin..."
    />
  );
}

export default function OAuthNativeCallbackPage() {
  return (
    <Suspense
      fallback={
        <LoadingCard title="Yükleniyor" subtitle="Giriş işlemi hazırlanıyor..." />
      }
    >
      <OAuthNativeCallbackContent />
    </Suspense>
  );
}
