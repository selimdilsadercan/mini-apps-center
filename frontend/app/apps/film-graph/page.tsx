"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import Client, { Local } from "@/lib/client";
import { toast, Toaster } from "react-hot-toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import AddFilmModal from "./components/AddFilmModal";
import DiscoverTab from "./components/DiscoverTab";
import FilmDetailDrawer from "./components/FilmDetailDrawer";
import FilmGraphShell from "./components/FilmGraphShell";
import GraphTab from "./components/GraphTab";
import MyListTab from "./components/MyListTab";
import { fetchFilmDetails } from "./film-api";
import {
  ACCENT,
  buildGraphData,
  catalogItemToEntry,
  Film,
  FilmCatalogItem,
  FilmTab,
  getConnectedNodes,
  Person,
  STORAGE_KEY,
} from "./film-data";
import { GraphNode } from "./types";

interface FilmDataInput {
  id: string;
  title: string;
  year: number;
  director: Person;
  actors: Person[];
}

const client = new Client(Local);

export default function FilmGraphPage() {
  const { confirm } = useConfirmDialog();
  const { user, isLoaded: isUserLoaded } = useUser();
  const userId = user?.id;

  const [films, setFilms] = useState<Film[]>([]);
  const [persons, setPersons] = useState<Map<string, Person>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilmTab>("list");

  const [detailFilm, setDetailFilm] = useState<FilmCatalogItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [catalogCache, setCatalogCache] = useState<Map<string, FilmCatalogItem>>(
    new Map(),
  );

  const listIds = useMemo(() => new Set(films.map((f) => f.id)), [films]);

  const cacheFilm = useCallback((item: FilmCatalogItem) => {
    setCatalogCache((prev) => {
      const next = new Map(prev);
      next.set(item.id, item);
      return next;
    });
  }, []);

  const ensureFilmDetails = useCallback(
    async (film: FilmCatalogItem): Promise<FilmCatalogItem> => {
      const cached = catalogCache.get(film.id);
      if (cached?.directorId) return cached;
      if (film.directorId) {
        cacheFilm(film);
        return film;
      }

      const full = await fetchFilmDetails(film.id);
      cacheFilm(full);
      return full;
    },
    [catalogCache, cacheFilm],
  );

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const { films: savedFilms, persons: savedPersons } = JSON.parse(savedData);
        if (Array.isArray(savedFilms)) {
          setFilms(savedFilms);
          setPersons(new Map(Object.entries(savedPersons || {})));
        }
      }
    } catch {
      /* ignore corrupt storage */
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with Database when User is loaded
  useEffect(() => {
    if (!isUserLoaded || !userId) return;

    client.film_graph.getUserFilms(userId).then((res) => {
      if (res.films && res.films.length > 0) {
        const mappedFilms: Film[] = res.films.map((f) => ({
          id: f.movie_id,
          title: f.title,
          year: f.year,
          status: f.status as "want" | "watched",
          imgUrl: f.poster_url || "",
          directorId: "",
          actorIds: [],
        }));

        setFilms((prev) => {
          const merged = [...prev];
          mappedFilms.forEach((rf) => {
            const index = merged.findIndex((lf) => lf.id === rf.id);
            if (index > -1) {
              merged[index] = { ...merged[index], status: rf.status, imgUrl: rf.imgUrl || merged[index].imgUrl };
            } else {
              merged.push(rf);
            }
          });
          return merged;
        });
      }
    }).catch((err) => {
      console.error("Failed to load user films from DB:", err);
    });
  }, [userId, isUserLoaded]);

  useEffect(() => {
    if (films.length === 0 && persons.size === 0) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ films, persons: Object.fromEntries(persons) }),
    );
  }, [films, persons]);

  const graphData = useMemo(
    () => buildGraphData(films, persons, selectedNode),
    [films, persons, selectedNode],
  );

  const connectedNodes = useMemo(
    () =>
      selectedNode ? getConnectedNodes(selectedNode.id, graphData) : [],
    [selectedNode, graphData],
  );

  const mergePersons = useCallback((incoming: Person[]) => {
    setPersons((prev) => {
      const next = new Map(prev);
      incoming.forEach((p) => next.set(p.id, p));
      return next;
    });
  }, []);

  const addCatalogToList = useCallback(
    async (item: FilmCatalogItem, status: "want" | "watched" = "want") => {
      if (listIds.has(item.id)) {
        toast.success("Zaten listende");
        return;
      }

      try {
        const full = await ensureFilmDetails(item);
        const { film, persons: ps } = catalogItemToEntry(full);
        setFilms((prev) => [...prev, { ...film, status }]);
        mergePersons(ps);

        // DB sync
        if (userId) {
          void client.film_graph.syncUserFilm({
            userId,
            movie: {
              movie_id: String(item.id),
              title: item.title,
              year: item.year,
              status: status,
              poster_url: item.posterUrl || "",
              vote_average: item.voteAverage || 0,
            }
          });
        }

        toast.success(status === "watched" ? "İzledim olarak eklendi" : "Listeye eklendi");
      } catch (e) {
        console.error("Failed to add film:", e);
        toast.error("Film eklenemedi");
      }
    },
    [listIds, mergePersons, ensureFilmDetails, userId],
  );

  const handleAddFilm = useCallback(
    (filmData: FilmDataInput) => {
      mergePersons([filmData.director, ...filmData.actors]);
      const newFilm: Film = {
        id: filmData.id,
        title: filmData.title,
        year: filmData.year,
        directorId: filmData.director.id,
        actorIds: filmData.actors.map((a) => a.id),
        status: "want",
      };
      setFilms((prev) => [...prev, newFilm]);

      // DB Sync
      if (userId) {
        void client.film_graph.syncUserFilm({
          userId,
          movie: {
            movie_id: newFilm.id,
            title: newFilm.title,
            year: newFilm.year,
            status: "want",
            poster_url: "",
            vote_average: 0,
          }
        });
      }

      toast.success("Film eklendi");
    },
    [mergePersons, userId],
  );

  const handleDeleteFilm = useCallback(
    (filmId: string) => {
      setFilms((prev) => prev.filter((f) => f.id !== filmId));
      if (selectedNode?.id === filmId) setSelectedNode(null);

      // DB Sync
      if (userId) {
        void client.film_graph.deleteUserFilm(userId, filmId);
      }

      toast.success("Listeden kaldırıldı");
    },
    [selectedNode, userId],
  );

  const handleToggleFilmStatus = useCallback((filmId: string) => {
    setFilms((prev) => {
      const updated = prev.map((f) => {
        if (f.id === filmId) {
          const nextStatus = f.status === "watched" ? "want" : "watched";
          
          // DB Sync
          if (userId) {
            void client.film_graph.syncUserFilm({
              userId,
              movie: {
                movie_id: filmId,
                title: f.title,
                year: f.year,
                status: nextStatus,
                poster_url: f.imgUrl || "",
                vote_average: 0,
              }
            });
          }
          return { ...f, status: nextStatus as "want" | "watched" };
        }
        return f;
      });
      return updated;
    });
    toast.success("Film durumu güncellendi");
  }, [userId]);

  const handleTogglePriority = useCallback((filmId: string) => {
    setFilms((prev) => {
      const updated = prev.map((f) => {
        if (f.id === filmId) {
          const nextStatus = f.status === "later" ? "soon" : "later";

          // DB Sync
          if (userId) {
            void client.film_graph.syncUserFilm({
              userId,
              movie: {
                movie_id: filmId,
                title: f.title,
                year: f.year,
                status: nextStatus,
                poster_url: f.imgUrl || "",
                vote_average: 0,
              }
            });
          }
          return { ...f, status: nextStatus as any };
        }
        return f;
      });
      return updated;
    });
    toast.success("Film önceliği güncellendi");
  }, [userId]);

  const handleResetData = useCallback(async () => {
    const ok = await confirm({
      title: "Verileri sıfırla",
      description: "Tüm listen silinecek.",
      confirmText: "Sıfırla",
      cancelText: "İptal",
    });
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, [confirm]);

  const handleDiscoverSelect = useCallback(
    async (film: FilmCatalogItem) => {
      setDetailLoading(true);
      setDetailFilm(film);
      try {
        const full = await ensureFilmDetails(film);
        setDetailFilm(full);
      } catch (e) {
        console.error("Failed to load film details:", e);
        toast.error("Film detayı yüklenemedi");
      } finally {
        setDetailLoading(false);
      }
    },
    [ensureFilmDetails],
  );

  const openFilmDetail = useCallback(
    async (filmId: string) => {
      const fromCache = catalogCache.get(filmId);
      if (fromCache) {
        void handleDiscoverSelect(fromCache);
        return;
      }

      const film = films.find((f) => f.id === filmId);
      if (!film) {
        try {
          setDetailLoading(true);
          const full = await fetchFilmDetails(filmId);
          setDetailFilm(full);
        } catch (e) {
          console.error(e);
        } finally {
          setDetailLoading(false);
        }
        return;
      }

      void handleDiscoverSelect({
        id: film.id,
        title: film.title,
        originalTitle: film.title,
        year: film.year,
        overview: film.overview || "",
        voteAverage: film.voteAverage || 0,
        voteCount: 0,
        popularity: 0,
        posterUrl: film.imgUrl,
        directorId: film.directorId,
        directorName: persons.get(film.directorId)?.name || "",
        actorIds: film.actorIds,
        castNames: film.actorIds.map((id) => persons.get(id)?.name || ""),
      });
    },
    [catalogCache, films, persons, handleDiscoverSelect],
  );

  useEffect(() => {
    if (loading) return;
    const query = new URLSearchParams(window.location.search);
    const movieId = query.get("movie") || query.get("id");
    if (movieId) {
      // Clear URL parameter so it doesn't reopen on every render
      window.history.replaceState({}, document.title, window.location.pathname);
      void openFilmDetail(movieId);
    }
  }, [loading, openFilmDetail]);

  const openGraphForFilm = useCallback(
    (filmId: string) => {
      setDetailFilm(null);
      setActiveTab("graph");
      const node = graphData.nodes.find((n) => n.id === filmId && n.type === "film");
      if (node) setSelectedNode(node);
      else {
        setSelectedNode({
          id: filmId,
          name: films.find((f) => f.id === filmId)?.title || "",
          type: "film",
          color: ACCENT,
        });
      }
    },
    [graphData.nodes, films],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-100 dark:border-red-950 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <FilmGraphShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onAddClick={() => setIsModalOpen(true)}
        graphLayout={activeTab === "graph"}
        onBack={
          detailFilm
            ? () => setDetailFilm(null)
            : selectedNode
            ? () => setSelectedNode(null)
            : undefined
        }
      >
        {activeTab === "discover" && (
          <DiscoverTab listIds={listIds} onSelect={(film) => void handleDiscoverSelect(film)} />
        )}

        {activeTab === "list" && (
          <MyListTab
            films={films}
            onAddClick={() => setIsModalOpen(true)}
            onResetClick={() => void handleResetData()}
            onFilmClick={(filmId) => void openFilmDetail(filmId)}
            onDeleteFilm={handleDeleteFilm}
            onToggleFilmStatus={handleToggleFilmStatus}
            onTogglePriority={handleTogglePriority}
          />
        )}

        {activeTab === "graph" && (
          <GraphTab
            graphData={graphData}
            selectedNode={selectedNode}
            connectedNodes={connectedNodes}
            onNodeClick={setSelectedNode}
            onClosePanel={() => setSelectedNode(null)}
            filmCount={films.length}
          />
        )}
      </FilmGraphShell>

      <FilmDetailDrawer
        film={detailFilm}
        loading={detailLoading}
        inList={detailFilm ? listIds.has(detailFilm.id) : false}
        filmStatus={detailFilm ? films.find((f) => f.id === detailFilm.id)?.status || "want" : null}
        onClose={() => setDetailFilm(null)}
        onAddToList={(status) => {
          if (detailFilm) void addCatalogToList(detailFilm, status);
        }}
        onToggleStatus={() => {
          if (detailFilm) handleToggleFilmStatus(detailFilm.id);
        }}
        onRemoveFromList={() => {
          if (detailFilm) {
            handleDeleteFilm(detailFilm.id);
            setDetailFilm(null);
          }
        }}
        onOpenGraph={() => {
          if (detailFilm) openGraphForFilm(detailFilm.id);
        }}
      />

      <AddFilmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddFilm}
      />
    </>
  );
}
