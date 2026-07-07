"use client";

import { useState, useEffect, Suspense } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { useSearchParams } from "next/navigation";
import {
  ListChecks,
  CheckCircle,
  XCircle,
  Users,
  CaretLeft,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";

const client = createBrowserClient();

function InviteAcceptContent() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("t");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<{
    creator_username: string;
    is_expired: boolean;
  } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (inviteId) {
      fetchInviteDetails();
    } else {
      setErrorMsg("Geçersiz davet linki.");
      setLoading(false);
    }
  }, [inviteId]);

  const fetchInviteDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await client.eksik_var.getInviteDetails(inviteId!);
      setInviteDetails(res);
      if (res.is_expired) {
        setErrorMsg("Bu davet linkinin süresi dolmuş veya zaten kullanılmış.");
      }
    } catch (err: any) {
      console.error("fetchInviteDetails error:", err);
      setErrorMsg("Davet detayları yüklenemedi. Link geçersiz olabilir.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user || !inviteId) return;
    try {
      setAccepting(true);
      setErrorMsg(null);
      const res = await client.eksik_var.acceptShareInvite({
        inviteId: inviteId,
        userId: user.id,
      });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          // Go to app home
          window.location.href = "/";
        }, 1500);
      } else {
        setErrorMsg("Davet kabul edilemedi.");
      }
    } catch (err: any) {
      console.error("handleAcceptInvite error:", err);
      setErrorMsg(err.message || "Davet kabul edilirken bir hata oluştu.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F7] text-gray-900 selection:bg-emerald-100">
      <main className="flex-1 px-4 py-12 max-w-md mx-auto w-full flex flex-col justify-center">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <ListChecks size={32} weight="fill" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">
            Eksik <span className="text-emerald-500">Var!</span>
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
            Alışveriş Ortaklığı
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-xl shadow-gray-100 flex flex-col items-center text-center">
          {loading ? (
            <div className="py-8 w-full">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                Davet Detayları Yükleniyor...
              </div>
            </div>
          ) : errorMsg ? (
            <div className="py-4">
              <XCircle size={44} weight="fill" className="text-red-500 mx-auto mb-3" />
              <h2 className="text-sm font-black text-gray-800 mb-2 uppercase">İşlem Başarısız</h2>
              <p className="text-xs text-gray-500 leading-relaxed px-4">{errorMsg}</p>
              <button
                onClick={() => window.location.href = "/"}
                className="mt-6 text-xs font-bold text-gray-400 hover:text-gray-900 transition-all flex items-center gap-1 mx-auto"
              >
                <CaretLeft size={14} weight="bold" />
                Ana Sayfaya Dön
              </button>
            </div>
          ) : success ? (
            <div className="py-4">
              <CheckCircle size={44} weight="fill" className="text-emerald-500 mx-auto mb-3" />
              <h2 className="text-sm font-black text-gray-800 mb-1 uppercase">Ortaklık Kuruldu!</h2>
              <p className="text-xs text-emerald-600 font-bold">Listeye yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <div className="w-full">
              <Users size={40} className="text-emerald-500 mx-auto mb-3" />
              <h2 className="text-base font-black text-gray-800 mb-2 leading-tight">
                @{inviteDetails?.creator_username} listesini seninle paylaşıyor!
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Bu daveti kabul ederek ortak alışveriş listesine katılabilir, beraber ürün ekleyip güncelleyebilirsiniz.
              </p>

              {!isUserLoaded ? (
                <div className="animate-pulse h-10 bg-gray-150 rounded-xl" />
              ) : !user ? (
                <div>
                  <p className="text-[11px] text-gray-400 font-bold mb-3 uppercase">
                    Kabul etmek için giriş yapmalısın:
                  </p>
                  <SignInButton mode="modal">
                    <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98]">
                      Giriş Yap ve Katıl
                    </button>
                  </SignInButton>
                </div>
              ) : (
                <button
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {accepting ? "Katılınıyor..." : "Daveti Kabul Et ve Katıl"}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#FAF9F7] items-center justify-center">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Davet Detayları Yükleniyor...
          </div>
        </div>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
