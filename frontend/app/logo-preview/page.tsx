"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Download } from "@phosphor-icons/react";
import { toast } from "react-hot-toast";

export default function LogoPreview() {
  const iconRef = useRef<HTMLDivElement>(null);

  const downloadIcon = async () => {
    if (iconRef.current === null) return;
    
    try {
      // We export at a high resolution for app stores (1024x1024)
      const dataUrl = await toPng(iconRef.current, {
        cacheBust: true,
        width: 1024,
        height: 1024,
        style: {
          transform: 'scale(1)',
          borderRadius: '0', // Full square for the store
          width: '1024px',
          height: '1024px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white'
        }
      });
      
      const link = document.createElement('a');
      link.download = 'everything-app-icon.png';
      link.href = dataUrl;
      link.click();
      toast.success("Logo indirildi!");
    } catch (err) {
      console.error('Download failed', err);
      toast.error("İndirme başarısız oldu.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F2F2F7] flex flex-col items-center justify-center gap-16 p-8">
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-orange-50 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">App Icon Preview</h2>
          <p className="text-slate-500 text-sm font-medium">iOS Style Squircle (1:1)</p>
        </div>

        {/* App Icon Container */}
        <div className="relative flex flex-col items-center gap-8">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
          >
            {/* Reflection/Shadow for the "phone screen" feel */}
            <div className="absolute -inset-4 bg-white/50 blur-2xl rounded-[3rem] -z-10" />
            
            {/* The Actual App Icon Div (This is what we'll export) */}
            <div 
              ref={iconRef}
              className="w-48 h-48 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden border border-white"
            >
              {/* The Logo inside the icon */}
              <div className="w-24 h-24 bg-orange-500 rounded-[1.5rem] rotate-45 flex items-center justify-center relative overflow-hidden shadow-lg shadow-orange-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              </div>
            </div>
            
            {/* Label under icon */}
            <div className="mt-4 text-center">
              <span className="text-sm font-bold text-slate-600">everything</span>
            </div>
          </motion.div>

          {/* Download Button */}
          <button
            onClick={downloadIcon}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800"
          >
            <Download size={18} weight="bold" />
            İndir (PNG)
          </button>
        </div>

        {/* Full Branding Preview */}
        <div className="mt-8 flex flex-col items-center">
          <div className="h-px w-32 bg-slate-200 mb-12" />
          <h1 className="text-7xl font-[900] text-slate-900 tracking-tighter">
            everything
          </h1>
          <div className="h-1.5 w-16 bg-orange-500 mt-6 rounded-full" />
        </div>
      </div>

      {/* Small Icon Grid Preview */}
      <div className="relative z-10 grid grid-cols-4 gap-6 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
             <div className="w-6 h-6 bg-orange-500 rounded-md rotate-45" />
          </div>
        ))}
      </div>
    </div>
  );
}
