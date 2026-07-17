"use client";

import { Drawer } from "vaul";
import { FilmCatalogItem, ACCENT } from "../film-data";
import { Star, Graph, Plus, Check } from "@phosphor-icons/react";

interface FilmDetailDrawerProps {
  film: FilmCatalogItem | null;
  loading?: boolean;
  inList: boolean;
  onClose: () => void;
  onAddToList: () => void;
  onOpenGraph: () => void;
}

export default function FilmDetailDrawer({
  film,
  loading = false,
  inList,
  onClose,
  onAddToList,
  onOpenGraph,
}: FilmDetailDrawerProps) {
  return (
    <Drawer.Root open={!!film} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-xl flex-col rounded-t-3xl border-t border-app-border bg-app-surface text-app-text shadow-2xl outline-none">
          <div className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-app-border" />
          {film && (
            <>
              {film.backdropUrl && (
                <div className="relative h-36 w-full overflow-hidden shrink-0">
                  <img
                    src={film.backdropUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-app-surface via-app-surface/20 to-transparent" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                <div className="flex gap-3 -mt-10 relative">
                  <div className="w-24 h-36 rounded-xl overflow-hidden border-4 border-app-surface shadow-lg bg-app-surface-muted shrink-0">
                    {film.posterUrl ? (
                      <img
                        src={film.posterUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        🎬
                      </div>
                    )}
                  </div>
                  <div className="pt-12 min-w-0 flex-1">
                    <Drawer.Title className="text-lg font-black text-app-text leading-tight">
                      {film.title}
                    </Drawer.Title>
                    <p className="text-xs text-app-muted mt-1">
                      {film.year}
                      {film.directorName ? ` · ${film.directorName}` : ""}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-amber-600 dark:text-amber-400">
                      <Star size={14} weight="fill" />
                      <span className="text-xs font-black">
                        {film.voteAverage.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-app-muted font-medium">
                        ({film.voteCount.toLocaleString("tr-TR")})
                      </span>
                    </div>
                    {film.imdbId && (
                      <a
                        href={`https://www.imdb.com/title/${film.imdbId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-[10px] font-black uppercase tracking-wide text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        IMDb'de gör →
                      </a>
                    )}
                  </div>
                </div>

                {film.castNames.length > 0 && (
                  <p className="text-[11px] text-app-muted mt-4">
                    <span className="font-black uppercase tracking-wide text-app-muted">
                      Oyuncular:{" "}
                    </span>
                    {film.castNames.join(", ")}
                  </p>
                )}

                {film.overview && (
                  <p className="text-sm text-app-muted mt-4 leading-relaxed line-clamp-6">
                    {loading && !film.overview ? "Yükleniyor..." : film.overview}
                  </p>
                )}

                {loading && (
                  <p className="text-xs text-app-muted mt-3 animate-pulse">
                    Oyuncu ve yönetmen bilgisi yükleniyor...
                  </p>
                )}

                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={onAddToList}
                    disabled={inList}
                    className="flex-1 h-11 rounded-xl text-white text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-60"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {inList ? (
                      <>
                        <Check size={16} weight="bold" />
                        Listede
                      </>
                    ) : (
                      <>
                        <Plus size={16} weight="bold" />
                        Listeme Ekle
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onOpenGraph}
                    disabled={!inList}
                    className="h-11 px-4 rounded-xl border border-app-border bg-app-surface text-app-text text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-[0.99] disabled:opacity-40"
                  >
                    <Graph size={16} weight="bold" />
                    Graph
                  </button>
                </div>
              </div>
            </>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
