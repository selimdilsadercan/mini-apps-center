"use client";

import { ShareNetwork, QrCode } from "@phosphor-icons/react";
import { useDigitalMenu } from "../context";
import { toast } from "react-hot-toast";

export default function SharePage() {
  const { id } = useDigitalMenu();

  const menuUrl = typeof window !== "undefined"
    ? `${window.location.origin}/apps/digital-menu?biz=${id}`
    : "";

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-stone-200/60 px-8 py-6 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
            <ShareNetwork size={20} className="text-blue-500" />
            QR Kod & Paylaş
          </h2>
          <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-0.5">
            Menünüzü müşterilerinizle paylaşın
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-2">
                <ShareNetwork size={20} className="text-blue-500" />
                Paylaşım Seçenekleri
              </h3>
              <p className="text-[10px] text-stone-400 uppercase font-black tracking-wider mt-1">
                Menü linkinizi kopyalayın veya QR kod oluşturun
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-150 flex flex-col items-center gap-4 text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                  <QrCode size={160} weight="thin" className="text-stone-850" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-850 uppercase tracking-wider">Menü QR Linki</p>
                  <p className="text-[9px] text-stone-400 font-mono break-all max-w-[280px] mt-1 select-all">
                    {menuUrl}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(menuUrl);
                  toast.success("Menü linki panoya kopyalandı!");
                }}
                className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
              >
                Linki Kopyala
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
