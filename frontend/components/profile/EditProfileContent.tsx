"use client";

import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, Check, User, IdentificationCard } from "@phosphor-icons/react";
import { useTranslations } from "@/contexts/LanguageContext";
import { createBrowserClient } from "@/lib/api";
import { useProfileUser, invalidateProfileUser } from "@/lib/cache/profileCache";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { hubPath } from "@/lib/hub-routes";

const client = createBrowserClient();
const actionBtn =
  "w-8 h-8 rounded-lg flex items-center justify-center border border-app-border bg-app-surface text-app-muted hover:text-app-text hover:bg-app-surface-muted transition-all active:scale-95 cursor-pointer";

interface EditProfileContentProps {
  embedded?: boolean;
}

export function EditProfileContent({ embedded = false }: EditProfileContentProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("profile");
  const { dbUser, isInitialLoading } = useProfileUser();

  const [usernameInput, setUsernameInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const profilePath = hubPath("profile");

  useEffect(() => {
    if (dbUser) {
      setUsernameInput(dbUser.username || "");
      setFullNameInput(dbUser.full_name || "");
    } else if (user) {
      setUsernameInput(user.username || "");
      setFullNameInput(user.fullName || "");
    }
  }, [dbUser, user]);

  if (!isLoaded || isInitialLoading) {
    return (
      <div className={`flex flex-col ${embedded ? "flex-1" : "min-h-screen"} bg-app-bg pb-8`}>
        <header className={`sticky top-0 z-30 ${embedded ? "md:hidden" : ""} app-chrome-top`}>
          <div className="max-w-lg md:max-w-2xl mx-auto w-full px-4 py-3">
            <div className="h-4 w-32 bg-app-surface-muted rounded animate-pulse" />
          </div>
        </header>
        <main className="px-4 md:px-8 pt-4 pb-safe-area-inset-bottom max-w-lg md:max-w-2xl mx-auto w-full">
          <div className="h-32 bg-app-surface-muted rounded-3xl animate-pulse" />
        </main>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanFullName = fullNameInput.trim();

    if (!cleanUsername) {
      toast.error("Kullanıcı adı boş olamaz!");
      return;
    }

    if (cleanUsername.length > 26) {
      toast.error("Kullanıcı adı en fazla 26 karakter olmalıdır!");
      return;
    }

    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      toast.error("Kullanıcı adı yalnızca küçük harf, sayı ve alt çizgi/nokta/tire içerebilir!");
      return;
    }

    if (!cleanFullName) {
      toast.error("Ad Soyad alanı boş olamaz!");
      return;
    }

    try {
      setIsSaving(true);
      const res = await client.users.updateUserProfile({
        clerkId: user.id,
        username: cleanUsername,
        fullName: cleanFullName,
      });

      if (!res.success) {
        toast.error(res.error || "Profil güncellenemedi.");
        return;
      }

      toast.success("Profil başarıyla güncellendi!");
      invalidateProfileUser(queryClient, user.id);

      setTimeout(() => {
        router.push(profilePath);
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error("Kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex flex-col ${embedded ? "flex-1" : "min-h-screen"} bg-app-bg text-app-text pb-8`}>
      <header className={`sticky top-0 z-30 app-chrome-top ${embedded ? "md:hidden" : ""}`}>
        <div className="max-w-lg md:max-w-2xl mx-auto w-full px-4 py-3 flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => router.push(profilePath)}
            className={actionBtn}
            aria-label="Geri"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div>
            <h1 className="text-base font-black text-app-text tracking-tight truncate leading-none">
              {t("editProfile") || "Profili Düzenle"}
            </h1>
          </div>
        </div>
      </header>

      {embedded && (
        <div className="hidden md:block px-4 md:px-8 pt-6 pb-2 max-w-2xl mx-auto w-full">
          <h1 className="text-xl font-black text-app-text tracking-tight">
            {t("editProfile") || "Profili Düzenle"}
          </h1>
        </div>
      )}

      <main className="px-4 md:px-8 pt-4 pb-safe-area-inset-bottom max-w-lg md:max-w-2xl mx-auto w-full">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="rounded-3xl border border-app-border bg-app-surface shadow-sm p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-wider flex items-center gap-1.5 px-1">
                <IdentificationCard size={14} weight="fill" className="text-indigo-500" />
                <span>Ad Soyad</span>
              </label>
              <input
                type="text"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-2xl bg-app-surface-muted border border-app-border text-app-text font-semibold outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Gerçek Adınız"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-app-muted uppercase tracking-wider flex items-center gap-1.5 px-1">
                <User size={14} weight="fill" className="text-purple-500" />
                <span>Kullanıcı Adı</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm font-black text-app-muted">@</span>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-sm rounded-2xl bg-app-surface-muted border border-app-border text-app-text font-semibold outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="kullanici_adi"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-3xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check size={16} weight="bold" />
            <span>{isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
