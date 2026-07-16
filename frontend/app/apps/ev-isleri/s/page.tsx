"use client";

import { Suspense, useEffect, useState } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Broom, CheckCircle, XCircle, CaretLeft } from "@phosphor-icons/react";
import { acceptBoardInviteAction, getBoardInviteDetailsAction } from "../actions";
import { getAppRootUrl } from "@/lib/apps";
import { setLastBoardId } from "../lastBoard";

function InviteAcceptContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("t");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{
    boardId: string;
    boardName: string;
    creatorUsername: string | null;
    isExpired: boolean;
  } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!inviteId) {
      setErrorMsg("Geçersiz davet linki.");
      setLoading(false);
      return;
    }
    void fetchInviteDetails();
  }, [inviteId]);

  async function fetchInviteDetails() {
    try {
      setLoading(true);
      const result = await getBoardInviteDetailsAction(inviteId!);
      if (result.error || !result.data) {
        setErrorMsg(result.error ?? "Davet bulunamadı");
        return;
      }
      setInviteDetails(result.data);
      if (result.data.isExpired) {
        setErrorMsg("Bu davet linkinin süresi dolmuş veya zaten kullanılmış.");
      }
    } catch {
      setErrorMsg("Davet bilgisi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!user || !inviteId) return;
    try {
      setAccepting(true);
      const result = await acceptBoardInviteAction(user.id, inviteId);
      if (result.error) {
        setErrorMsg(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        if (inviteDetails?.boardId) {
          setLastBoardId(inviteDetails.boardId);
        }
        router.push("/apps/ev-isleri");
      }, 1200);
    } catch {
      setErrorMsg("Davet kabul edilemedi.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col">
      <header className="px-4 pt-4 max-w-md mx-auto w-full">
        <button
          onClick={() => {
            window.location.href = getAppRootUrl();
          }}
          className="w-8 h-8 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-muted"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full text-center">
        {loading ? (
          <p className="text-xs font-bold text-app-muted animate-pulse">Yükleniyor...</p>
        ) : success ? (
          <>
            <CheckCircle size={56} className="text-emerald-500 mb-4" weight="fill" />
            <p className="text-sm font-black text-app-text">Board&apos;a katıldın!</p>
          </>
        ) : errorMsg && !inviteDetails ? (
          <>
            <XCircle size={56} className="text-red-400 mb-4" weight="fill" />
            <p className="text-sm font-bold text-app-muted">{errorMsg}</p>
          </>
        ) : inviteDetails ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
              <Broom size={32} weight="fill" className="text-teal-500" />
            </div>
            <h1 className="text-lg font-black text-app-text mb-1">{inviteDetails.boardName}</h1>
            <p className="text-xs text-app-muted font-medium mb-6">
              @{inviteDetails.creatorUsername ?? "birisi"} seni ev işleri board&apos;una davet etti
            </p>

            {errorMsg ? (
              <p className="text-xs font-bold text-red-500 mb-4">{errorMsg}</p>
            ) : !isLoaded ? (
              <p className="text-xs text-app-muted">Yükleniyor...</p>
            ) : !user ? (
              <SignInButton mode="modal">
                <button className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider">
                  Giriş yap ve katıl
                </button>
              </SignInButton>
            ) : (
              <button
                onClick={() => void handleAccept()}
                disabled={accepting || inviteDetails.isExpired}
                className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 active:scale-95"
              >
                {accepting ? "Katılınıyor..." : "Daveti kabul et"}
              </button>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}

export default function EvIsleriInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-app-bg flex items-center justify-center text-xs font-bold text-app-muted">
          Yükleniyor...
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
