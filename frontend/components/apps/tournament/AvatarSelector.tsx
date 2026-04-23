"use client";

import { useState, useMemo, useCallback } from "react";
import { Scissors, Smile, Palette, Glasses, Shirt, Dice5 } from "lucide-react";

export const AVATAR_OPTIONS = {
  skin: ["f8d25c", "ffdbb4", "edb98a", "d08b5b", "ae5d29", "614335", "fd9841", "f5d0c5", "d2b48c", "e0ac69", "8d5524", "c68642"],
  top: [
    "bigHair", "bob", "bun", "curly", "curvy", "dreads", "dreads01", "dreads02", "frida", "frizzle", "fro", "froBand",
    "longButNotTooLong", "miaWallace", "shaggy", "shaggyMullet", "shavedSides", "shortCurly", "shortFlat", "shortRound",
    "shortWaved", "sides", "straight01", "straight02", "straightAndStrand", "theCaesar", "theCaesarAndSidePart"
  ],
  mouth: ["concerned", "default", "disbelief", "eating", "grimace", "sad", "screamOpen", "serious", "smile", "tongue", "twinkle", "vomit"],
  eyes: ["closed", "cry", "default", "eyeRoll", "happy", "hearts", "side", "squint", "surprised", "wink", "winkWacky", "xDizzy"],
  accessories: ["none", "eyepatch", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers"],
  clothing: ["blazerAndShirt", "blazerAndSweater", "collarAndSweater", "graphicShirt", "hoodie", "overall", "shirtCrewNeck", "shirtScoopNeck", "shirtVNeck"],
  clothesColor: ["3c4f5c", "65c9ff", "262e33", "5199e4", "25557c", "929598", "a7ffc4", "b1e2ff", "e6e6e6", "ff5c5c", "ff488e", "ffafb9", "ffffb1", "ffffff"]
};

export interface AvatarConfig {
  skinColor: string;
  top: string;
  mouth: string;
  eyes: string;
  accessories: string;
  clothing: string;
  clothesColor: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinColor: "edb98a",
  top: "shortFlat",
  mouth: "smile",
  eyes: "default",
  accessories: "none",
  clothing: "collarAndSweater",
  clothesColor: "65c9ff",
};

export function generateRandomAvatarConfig(): AvatarConfig {
  const pickRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    skinColor: pickRandom(AVATAR_OPTIONS.skin),
    top: pickRandom(AVATAR_OPTIONS.top),
    mouth: pickRandom(AVATAR_OPTIONS.mouth),
    eyes: pickRandom(AVATAR_OPTIONS.eyes),
    accessories: Math.random() > 0.7 ? pickRandom(AVATAR_OPTIONS.accessories.filter(a => a !== "none")) : "none",
    clothing: pickRandom(AVATAR_OPTIONS.clothing),
    clothesColor: pickRandom(AVATAR_OPTIONS.clothesColor),
  };
}

export function getAvatarUrl(config: AvatarConfig): string {
  const params = new URLSearchParams({
    skinColor: config.skinColor,
    top: config.top,
    mouth: config.mouth,
    eyes: config.eyes,
    clothing: config.clothing,
    clothesColor: config.clothesColor,
    backgroundColor: "transparent",
    accessoriesProbability: config.accessories === "none" ? "0" : "100",
  });
  if (config.accessories !== "none") params.append("accessories", config.accessories);
  
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

export function parseAvatarUrl(url: string): AvatarConfig {
  if (!url) return DEFAULT_AVATAR_CONFIG;
  
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // If it's a seed-based URL (old format), we can't fully parse it, 
    // but we can return the default instead of crashing or being empty
    if (!params.has("top") && !params.has("skinColor")) {
      return {
        ...DEFAULT_AVATAR_CONFIG,
        // We could potentially store the seed here if we wanted to support it
      };
    }

    return {
      skinColor: params.get("skinColor") || DEFAULT_AVATAR_CONFIG.skinColor,
      top: params.get("top") || DEFAULT_AVATAR_CONFIG.top,
      mouth: params.get("mouth") || DEFAULT_AVATAR_CONFIG.mouth,
      eyes: params.get("eyes") || DEFAULT_AVATAR_CONFIG.eyes,
      accessories: params.get("accessories") || "none",
      clothing: params.get("clothing") || DEFAULT_AVATAR_CONFIG.clothing,
      clothesColor: params.get("clothesColor") || DEFAULT_AVATAR_CONFIG.clothesColor,
    };
  } catch (e) {
    return DEFAULT_AVATAR_CONFIG;
  }
}

interface AvatarSelectorProps {
  avatarConfig: AvatarConfig;
  onConfigChange: (config: AvatarConfig) => void;
}

export default function AvatarSelector({ avatarConfig, onConfigChange }: AvatarSelectorProps) {
  const [activeTab, setActiveTab] = useState<"top" | "face" | "accessories" | "clothing">("top");

  const avatarUrl = useMemo(() => getAvatarUrl(avatarConfig), [avatarConfig]);

  const handleConfigChange = (key: keyof AvatarConfig, value: string) => {
    onConfigChange({ ...avatarConfig, [key]: value });
  };

  const tabs = [
    { id: "top", label: "SAÇ", icon: Scissors },
    { id: "face", label: "YÜZ", icon: Smile },
    { id: "clothing", label: "KIYAFET", icon: Shirt },
    { id: "accessories", label: "GÖZLÜK", icon: Glasses },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Preview Section */}
      <div className="relative group">
        <div className="w-32 h-32 mx-auto bg-slate-900/50 rounded-full p-1 border-4 border-blue-500/30 shadow-2xl shadow-blue-500/10">
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-contain rounded-full" />
        </div>
        <button
          onClick={() => onConfigChange(generateRandomAvatarConfig())}
          className="absolute -bottom-2 right-1/2 translate-x-12 p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg active:scale-90 transition-all border border-blue-400/50"
        >
          <Dice5 size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center py-2.5 rounded-xl transition-all ${
                activeTab === tab.id ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} className="mb-1" />
              <span className="text-[9px] font-black tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Options Grid */}
      <div className="bg-white/5 rounded-3xl border border-white/10 p-4 max-h-[240px] overflow-y-auto custom-scrollbar">
        {activeTab === "top" && (
          <div className="grid grid-cols-4 gap-3">
            {AVATAR_OPTIONS.top.map((style) => (
              <button
                key={style}
                onClick={() => handleConfigChange("top", style)}
                className={`aspect-square rounded-xl border-2 overflow-hidden bg-slate-800 transition-all ${
                  avatarConfig.top === style ? "border-blue-500 bg-slate-700" : "border-transparent"
                }`}
              >
                <img src={`https://api.dicebear.com/9.x/avataaars/svg?top=${style}&seed=preview`} className="w-full h-full object-contain scale-110 translate-y-2" />
              </button>
            ))}
          </div>
        )}

        {activeTab === "face" && (
          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-slate-500 mb-3 font-black uppercase tracking-widest">Ağız Yapısı</p>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.mouth.map((m) => (
                  <button
                    key={m}
                    onClick={() => handleConfigChange("mouth", m)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden bg-slate-800 transition-all ${
                      avatarConfig.mouth === m ? "border-blue-500 bg-slate-700" : "border-transparent"
                    }`}
                  >
                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?mouth=${m}&top=shortFlat&seed=preview`} className="w-full h-full object-contain scale-[2.5] translate-y-2" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-3 font-black uppercase tracking-widest">Gözler</p>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.eyes.map((e) => (
                  <button
                    key={e}
                    onClick={() => handleConfigChange("eyes", e)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden bg-slate-800 transition-all ${
                      avatarConfig.eyes === e ? "border-blue-500 bg-slate-700" : "border-transparent"
                    }`}
                  >
                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?eyes=${e}&top=shortFlat&seed=preview`} className="w-full h-full object-contain scale-[2.5]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "clothing" && (
          <div className="space-y-6">
             <div>
              <p className="text-[10px] text-slate-500 mb-3 font-black uppercase tracking-widest">Ten Rengi</p>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.skin.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleConfigChange("skinColor", c)}
                    className={`aspect-square rounded-lg border-2 transition-all ${
                      avatarConfig.skinColor === c ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: `#${c}` }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-3 font-black uppercase tracking-widest">Kıyafet</p>
              <div className="grid grid-cols-3 gap-3">
                {AVATAR_OPTIONS.clothing.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleConfigChange("clothing", c)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden bg-slate-800 transition-all ${
                      avatarConfig.clothing === c ? "border-blue-500 bg-slate-700" : "border-transparent"
                    }`}
                  >
                    <img src={`https://api.dicebear.com/9.x/avataaars/svg?clothing=${c}&top=shortFlat&seed=preview`} className="w-full h-full object-contain scale-[1.5] translate-y-3" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "accessories" && (
          <div className="grid grid-cols-4 gap-3">
             <button
                onClick={() => handleConfigChange("accessories", "none")}
                className={`aspect-square rounded-xl border-2 flex items-center justify-center bg-slate-800 text-[10px] font-black uppercase ${
                  avatarConfig.accessories === "none" ? "border-blue-500 bg-slate-700" : "border-transparent text-slate-500"
                }`}
              >
                YOK
              </button>
            {AVATAR_OPTIONS.accessories.filter(a => a !== "none").map((a) => (
              <button
                key={a}
                onClick={() => handleConfigChange("accessories", a)}
                className={`aspect-square rounded-xl border-2 overflow-hidden bg-slate-800 transition-all ${
                  avatarConfig.accessories === a ? "border-blue-500 bg-slate-700" : "border-transparent"
                }`}
              >
                <img src={`https://api.dicebear.com/9.x/avataaars/svg?accessories=${a}&accessoriesProbability=100&top=shortFlat&seed=preview`} className="w-full h-full object-contain scale-[2]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
