"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { ArrowLeft, Trash, WarningCircle, Sparkle } from "@phosphor-icons/react";
import AppBar, { ActivePage } from "@/components/AppBar";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslations } from "@/contexts/LanguageContext";
import { createBrowserClient } from "@/lib/api";
import { deleteCurrentUser } from "@/lib/firebase";
import { setOnboardingFinishedAction } from "../../home/actions";

const client = createBrowserClient();

export default function AccountSettingsPage() {
  const t = useTranslations("account");
  const router = useRouter();
  const { user } = useUser();
  const { backendUser, signOut } = useAuthContext();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState("");

  const confirmKey = t("deleteModalConfirmKey");

  const handleDeleteAccount = async () => {
    if (confirmText !== confirmKey || !user?.id) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      setDeleteStatus(t("deleteModalStatusDatabase"));
      try {
        await client.users.deleteUser(user.id);
      } catch (err) {
        console.warn("Backend user delete failed:", err);
      }

      setDeleteStatus(t("deleteModalStatusAuth"));
      const firebaseResult = await deleteCurrentUser();
      if (!firebaseResult.success) {
        if (firebaseResult.error?.includes("yeniden giriş") || firebaseResult.error?.includes("sign in again")) {
          setDeleteError(t("deleteModalReauth"));
          setIsDeleting(false);
          return;
        }
        console.warn("Firebase delete failed:", firebaseResult.error);
      }

      setDeleteStatus(t("deleteModalStatusLocal"));
      localStorage.removeItem("ios_native_user");
      localStorage.removeItem(`app_order_${user.id}`);

      setDeleteStatus(t("deleteModalStatusSignOut"));
      await signOut();

      router.replace("/sign-in");
    } catch (error) {
      console.error("Account delete error:", error);
      setDeleteError(t("deleteModalError"));
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900">
      <main className="flex-1 px-4 pb-32 max-w-md mx-auto w-full pt-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 mb-6 no-underline"
        >
          <ArrowLeft size={16} weight="bold" />
          {t("back")}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
          {backendUser?.username && (
            <p className="text-xs text-gray-400 mt-2">@{backendUser.username}</p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="px-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">
            Onboarding
          </h2>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-2xl shrink-0">
                <Sparkle size={20} weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900">{t("onboardingTitle")}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t("onboardingDescription")}</p>
                <button
                  onClick={async () => {
                    if (user?.id) {
                      localStorage.removeItem(`onboarding_completed_${user.id}`);
                      await setOnboardingFinishedAction(user.id, false);
                    } else {
                      localStorage.removeItem("onboarding_completed_guest");
                    }
                    router.push("/onboarding");
                  }}
                  className="mt-4 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  {t("onboardingButton")}
                </button>
              </div>
            </div>
          </div>

          <h2 className="px-1 text-[10px] font-black text-red-500 uppercase tracking-wider">
            {t("dangerTitle")}
          </h2>

          <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-50 text-red-500 rounded-2xl shrink-0">
                <Trash size={20} weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900">{t("deleteTitle")}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t("deleteDescription")}</p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-4 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  {t("deleteButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 border border-gray-100 shadow-xl">
            <div className="flex items-center gap-3 text-red-500">
              <WarningCircle size={28} weight="fill" />
              <h2 className="text-xl font-black text-gray-900">{t("deleteModalTitle")}</h2>
            </div>

            <div className="space-y-3 text-gray-600 text-sm">
              <p>{t("deleteModalMessage")}</p>
              <p className="font-bold text-gray-700">{t("deleteModalWillDelete")}</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>{t("deleteModalItemProfile")}</li>
                <li>{t("deleteModalItemPreferences")}</li>
                <li>{t("deleteModalItemFriends")}</li>
                <li>{t("deleteModalItemAppData")}</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
                {deleteError}
              </div>
            )}

            {isDeleting && deleteStatus && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-[#FF6B35]/30 border-t-[#FF6B35] rounded-full animate-spin" />
                {deleteStatus}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-gray-500">
                {t("deleteModalConfirmPrompt", { confirmText: confirmKey })}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={confirmKey}
                disabled={isDeleting}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 disabled:opacity-50"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText("");
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {t("deleteModalCancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== confirmKey || isDeleting}
                className={`flex-1 px-4 py-3 font-bold rounded-2xl transition-colors cursor-pointer ${
                  confirmText === confirmKey && !isDeleting
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isDeleting ? t("deleteModalDeleting") : t("deleteModalTitle")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <AppBar activePage={ActivePage.PROFILE} /> */}
    </div>
  );
}
