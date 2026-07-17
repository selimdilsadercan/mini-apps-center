"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function FilmGraphPage() {
  const { confirm } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<FilmTab>("discover");
  const [catalogCache, setCatalogCache] = useState<Map<string, FilmCatalogItem>>(
    new Map(),
  );
  const [films, setFilms] = useState<Film[]>([]);
  const [persons, setPersons] = useState<Map<string, Person>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [detailFilm, setDetailFilm] = useState<FilmCatalogItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);

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
    async (item: FilmCatalogItem) => {
      if (listIds.has(item.id)) {
        toast.success("Zaten listende");
        return;
      }

      try {
        const full = await ensureFilmDetails(item);
        const { film, persons: ps } = catalogItemToEntry(full);
        setFilms((prev) => [...prev, film]);
        mergePersons(ps);
        toast.success("Listeye eklendi");
      } catch (e) {
        console.error("Failed to add film:", e);
        toast.error("Film eklenemedi");
      }
    },
    [listIds, mergePersons, ensureFilmDetails],
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
      };
      setFilms((prev) => [...prev, newFilm]);
      toast.success("Film eklendi");
    },
    [mergePersons],
  );

  const handleDeleteFilm = useCallback(
    (filmId: string) => {
      setFilms((prev) => prev.filter((f) => f.id !== filmId));
      if (selectedNode?.id === filmId) setSelectedNode(null);
      toast.success("Listeden kaldırıldı");
    },
    [selectedNode],
  );

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
      if (!film) return;

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
        graphLayout={activeTab === "graph"}
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
        onClose={() => setDetailFilm(null)}
        onAddToList={() => {
          if (detailFilm) void addCatalogToList(detailFilm);
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
