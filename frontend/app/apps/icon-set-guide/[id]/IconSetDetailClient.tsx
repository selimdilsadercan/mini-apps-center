"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Heart, 
  ArrowSquareOut,
  GithubLogo,
  Check, 
  Copy, 
  Terminal
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { createBrowserClient } from "@/lib/api";
import { icon_set_guide } from "@/lib/client";

const client = createBrowserClient();

const STANDARD_ICONS = [
  "home", "search", "user", "settings", "bell",
  "plus", "calendar", "trash", "arrow-right", "heart"
];

export default function IconSetDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useUser();

  const [iconSet, setIconSet] = useState<icon_set_guide.IconSet | null>(null);
  const [similarSets, setSimilarSets] = useState<icon_set_guide.IconSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id, user]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const userId = user?.id || "anonymous";
      
      // Fetch details of current pack
      const detail = await client.icon_set_guide.getIconSetDetail(id, userId);
      setIconSet(detail);

      // Fetch all packs to determine similar ones on client-side
      const allPacks = await client.icon_set_guide.getIconSets(userId);
      const currentVibe = detail.vibes?.[0] || "";
      const currentStyle = detail.styles?.[0] || "";
      
      // Filter out current and find matches by style or vibe
      const matched = allPacks.icon_sets
        .filter(item => item.id !== id && (item.styles.includes(currentStyle) || item.vibes.includes(currentVibe)))
        .slice(0, 3);
      
      setSimilarSets(matched);
    } catch (err: any) {
      console.error(err);
      setError("Detaylar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !iconSet) {
      alert("Favorilere eklemek için lütfen giriş yapın.");
      return;
    }
    try {
      const response = await client.icon_set_guide.toggleFavorite({
        userId: user.id,
        iconSetId: iconSet.id
      });
      setIconSet(prev => prev ? { ...prev, is_favorited: response.is_favorited } : null);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleCopyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !iconSet) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Hata Oluştu</h2>
          <p className="text-slate-600 text-sm mb-6">{error || "İkon seti bulunamadı."}</p>
          <Link 
            href="/apps/icon-set-guide" 
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all"
          >
            Rehbere Geri Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/apps/icon-set-guide"
              className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <span className="font-bold text-slate-900">{iconSet.name} Details</span>
          </div>

          <button 
            onClick={handleToggleFavorite}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              iconSet.is_favorited 
                ? "bg-rose-50 text-rose-600 border-rose-100" 
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            <Heart weight={iconSet.is_favorited ? "fill" : "regular"} size={14} className={iconSet.is_favorited ? "text-rose-500" : ""} />
            {iconSet.is_favorited ? "Favorited" : "Favorite"}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                  {iconSet.license} License
                </span>
                {iconSet.vibes.map(vb => (
                  <span key={vb} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md capitalize">
                    {vb} Vibe
                  </span>
                ))}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                {iconSet.name}
              </h1>

              <p className="text-slate-600 leading-relaxed mb-6">
                {iconSet.description}
              </p>

              {iconSet.detailed_description && (
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">About the pack</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {iconSet.detailed_description}
                  </p>
                </div>
              )}
            </div>

            {/* Glyph Showcase */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-2">Glyphs Preview</h2>
              <p className="text-xs text-slate-500 mb-6">Detailed vector renderings of standard icons included in this toolkit.</p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {STANDARD_ICONS.map((icon) => (
                  <div 
                    key={icon}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center hover:border-indigo-200 hover:bg-indigo-50/10 transition-all"
                  >
                    <img 
                      src={`/icons/${iconSet.id}/${icon}.svg`}
                      alt={icon}
                      className="w-8 h-8 text-slate-700 mb-2"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="text-[10px] font-bold text-slate-400 capitalize">{icon}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Implementation Details */}
            {iconSet.npm_command && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                  <Terminal size={20} className="text-indigo-600" /> Getting Started
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Install via Package Manager</label>
                    <div className="bg-slate-950 text-slate-200 p-4 rounded-xl flex items-center justify-between font-mono text-xs border border-slate-900">
                      <span className="truncate">{iconSet.npm_command}</span>
                      <button
                        onClick={() => handleCopyCommand(iconSet.npm_command!)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check size={16} className="text-emerald-400" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Metadata & Quick Info */}
          <div className="space-y-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 text-sm pb-4 border-b border-slate-100">Metadata Spec Sheet</h3>

              {/* Best For */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Ideal Project Use Cases</label>
                <div className="flex flex-wrap gap-1.5">
                  {iconSet.best_for.map(bf => (
                    <span key={bf} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium capitalize">
                      {bf}
                    </span>
                  ))}
                </div>
              </div>

              {/* Frameworks */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Supported Formats & Libraries</label>
                <div className="flex flex-wrap gap-1.5">
                  {iconSet.frameworks.map(fw => (
                    <span key={fw} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-semibold">
                      {fw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <a 
                  href={iconSet.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-850 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm"
                >
                  <ArrowSquareOut size={14} /> Visit Official Website
                </a>
                {iconSet.github_url && (
                  <a 
                    href={iconSet.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all"
                  >
                    <GithubLogo size={14} /> GitHub Repository
                  </a>
                )}
              </div>
            </div>

            {/* Similar Icon Sets */}
            {similarSets.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Similar Libraries</h3>
                <div className="space-y-3">
                  {similarSets.map(set => (
                    <Link 
                      key={set.id}
                      href={`/apps/icon-set-guide/${set.id}`}
                      className="block p-3 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 rounded-xl transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {set.name}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                          {set.license}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{set.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
