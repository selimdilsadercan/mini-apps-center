"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { House } from "@phosphor-icons/react";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page after 3 seconds
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <House size={32} className="text-gray-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">
          Sayfa Bulunamadı
        </h2>
        <p className="text-gray-500 mb-6">
          Aradığınız sayfa mevcut değil. Ana sayfaya yönlendiriliyorsunuz...
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Ana Sayfaya Git
        </button>
      </div>
    </div>
  );
}
