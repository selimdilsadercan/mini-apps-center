"use client";

import { Drawer } from "vaul";
import { X, Cards } from "@phosphor-icons/react";
import { GAMES_DATA } from "../../iskambil/games-registry";

interface RulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  iskambilId: string;
}

export default function RulesDrawer({ isOpen, onClose, iskambilId }: RulesDrawerProps) {
  const game = GAMES_DATA.find((g: any) => g.id === iskambilId);
  if (!game) return null;

  const quickRules = game.quickRules_tr || [];
  const setup = game.setup_tr || [];
  const objective = game.objective_tr || "";
  const gameplay = game.gameplay_tr || [];
  const scoring = game.scoring_tr || [];
  const ending = game.ending_tr || [];
  const customSections = game.customSections || [];
  const notes = game.notes_tr || [];

  const handleDiscoverMore = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.includes("localhost") || hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        const port = window.location.port ? `:${window.location.port}` : "";
        window.location.href = `${window.location.protocol}//my.localhost${port}/apps/iskambil`;
      } else {
        const domain = hostname.replace("yazboz.", "");
        window.location.href = `${window.location.protocol}//my.${domain}/apps/iskambil`;
      }
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/45 z-[60]" />
        <Drawer.Content className="bg-app-bg border-t border-app-border flex flex-col rounded-t-[20px] h-[85vh] fixed bottom-0 left-0 right-0 max-w-xl mx-auto z-[70] outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-app-border my-3" />
          
          <div className="flex items-center justify-between px-4 pb-3 border-b border-app-border/40">
            <Drawer.Title className="text-sm font-black text-app-text tracking-tight uppercase flex items-center gap-1.5">
              <span>{game.name_tr} Kuralları</span>
            </Drawer.Title>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-app-surface border border-app-border flex items-center justify-center text-app-muted hover:text-app-text active:scale-95 transition-all"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 pb-20">
            {/* Promo Banner */}
            <div
              onClick={handleDiscoverMore}
              className="flex items-center justify-between py-2 px-3 bg-rose-50/40 hover:bg-rose-50 border border-rose-100/40 dark:bg-rose-950/15 dark:hover:bg-rose-950/25 dark:border-rose-900/25 text-app-text rounded-xl transition-all cursor-pointer group shadow-sm active:scale-[0.995]"
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md relative overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{ 
                    backgroundColor: "#e03131",
                    boxShadow: `0 4px 10px -3px rgba(224, 49, 49, 0.4)`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></div>
                  <div className="absolute inset-0 border border-white/10 rounded-lg"></div>
                  <Cards size={16} weight="fill" className="relative z-10 text-white" />
                </div>
                <div>
                  <span className="text-xs font-black text-app-text block leading-none uppercase tracking-tight">İskambil Rehberi</span>
                  <span className="text-[9px] font-bold text-app-muted block mt-1 leading-none">Diğer iskambil oyun kurallarını keşfet!</span>
                </div>
              </div>
              <div className="text-rose-500 transition-colors pl-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="bold" viewBox="0 0 256 256">
                  <path d="M96,40V216a8,8,0,0,0,13.66,5.66l88-88a8,8,0,0,0,0-11.32l-88-88A8,8,0,0,0,96,40Z"></path>
                </svg>
              </div>
            </div>

            {/* Quick Summary */}
            {quickRules.length > 0 && (
              <div className="bg-app-surface border border-app-border rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                  Hızlı Özet
                </h4>
                <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                  {quickRules.map((rule: string, idx: number) => (
                    <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                      <span className="inline text-app-text/80">{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Rules Details */}
            <div className="bg-app-surface border border-app-border rounded-2xl p-5 space-y-8 shadow-sm">
              {/* Setup */}
              {setup.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                    Kurulum
                  </h4>
                  <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                    {setup.map((step: string, idx: number) => (
                      <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                        <span className="inline text-app-text/80">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Objective */}
              {objective && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                    Amaç
                  </h4>
                  <p className="text-app-text/80 text-sm leading-relaxed pl-1 font-medium">
                    {objective}
                  </p>
                </div>
              )}

              {/* Gameplay */}
              {gameplay.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                    Oynanış
                  </h4>
                  <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                    {gameplay.map((step: string, idx: number) => (
                      <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                        <span className="inline text-app-text/80">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Scoring */}
              {scoring.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                    Puanlama
                  </h4>
                  <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                    {scoring.map((rule: string, idx: number) => (
                      <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                        <span className="inline text-app-text/80">{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Custom Sections */}
              {customSections.map((section: any, sIdx: number) => {
                const title = section.title_tr;
                const content = section.content_tr;
                if (!title || !content || content.length === 0) return null;
                return (
                  <div key={sIdx} className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                      {title}
                    </h4>
                    <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                      {content.map((rule: string, idx: number) => (
                        <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                          <span className="inline text-app-text/80">{rule}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}

              {/* Ending */}
              {ending.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                    Oyun Sonu
                  </h4>
                  <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                    {ending.map((rule: string, idx: number) => (
                      <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                        <span className="inline text-app-text/80">{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Notes */}
              {notes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-app-muted tracking-widest border-b border-app-border/40 pb-2">
                    Özel Notlar
                  </h4>
                  <ol className="space-y-2.5 list-decimal pl-5 text-app-text/90">
                    {notes.map((note: string, idx: number) => (
                      <li key={idx} className="marker:text-app-muted marker:font-black pb-0.5 last:pb-0 leading-relaxed text-sm">
                        <span className="inline text-app-text/80">{note}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
