"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { Shield, Warning } from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const isCapacitor = process.env.NEXT_PUBLIC_CAPACITOR === "true";
  const client = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) return;
      try {
        const res = await client.users.checkAdmin(user.id);
        setIsAdmin(res.isAdmin);
      } catch (error) {
        console.error("Admin check failed:", error);
        setIsAdmin(false);
      }
    }

    if (isLoaded) {
      if (!user) {
        // Not logged in, redirect to home or show error
        setIsAdmin(false);
      } else {
        checkAdmin();
      }
    }
  }, [isLoaded, user]);

  // Mobile Build Exclusion
  if (isCapacitor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7] p-6 text-center">
        <div className="max-w-sm">
          <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Warning size={32} weight="fill" className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Erişim Engellendi
          </h1>
          <p className="text-gray-500 font-medium">
            Admin paneli mobil uygulama üzerinden erişime kapalıdır. Lütfen web tarayıcısını kullanın.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7]">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F7] p-6 text-center">
        <div className="max-w-sm">
          <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield size={32} weight="fill" className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Yetkisiz Erişim
          </h1>
          <p className="text-gray-500 font-medium">
            Bu sayfayı görüntülemek için admin yetkisine sahip olmanız gerekmektedir.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="mt-8 w-full bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] selection:bg-indigo-100">
      {/* Background Decorative Gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-purple-100/20 blur-[120px] rounded-full"></div>
      </div>
      {children}
    </div>
  );
}
