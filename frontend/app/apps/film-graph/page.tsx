"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { GraphData, GraphNode, GraphLink } from "./types";
import FilmList from "./components/FilmList";
import AddFilmModal from "./components/AddFilmModal";
import NodeDetailPanel from "./components/NodeDetailPanel";

// Force graph'ı client-side only yükle (SSR desteği yok)
const FilmGraph = dynamic(() => import("./components/FilmGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
    </div>
  ),
});

interface Film {
  id: string;
  title: string;
  year: number;
  directorId: string;
  actorIds: string[];
  imgUrl?: string;
}

interface Person {
  id: string;
  name: string;
  role: "actor" | "director";
  imgUrl?: string;
}

interface FilmData {
  id: string;
  title: string;
  year: number;
  director: Person;
  actors: Person[];
}

// LocalStorage key
const STORAGE_KEY = "film-graph-data";

export default function Home() {
  const [films, setFilms] = useState<Film[]>([]);
  const [persons, setPersons] = useState<Map<string, Person>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });

  // Veri yükle
  useEffect(() => {
    async function loadData() {
      // Önce localStorage kontrol et<
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const { films: savedFilms, persons: savedPersons } =
            JSON.parse(savedData);
          if (savedFilms.length > 0) {
            setFilms(savedFilms);
            setPersons(new Map(Object.entries(savedPersons)));
            return;
          }
        } catch (e) {
          console.error("Failed to load saved data:", e);
        }
      }

      // LocalStorage boşsa veya hata varsa public/film-graph/films.json'ı yükle
      try {
        const response = await fetch("/film-graph/films.json");
        if (response.ok) {
          const data = await response.json();
          const newFilms: Film[] = [];
          const newPersons = new Map<string, Person>();

          // Tüm filmleri yükle ve resim URL'lerini oluştur
          data.forEach((item: any) => {
            const filmId = String(item.id);
            const directorId =
              item.directors && item.directors.length > 0
                ? String(item.directors[0].id)
                : "";
            const actorIds = (item.cast || [])
              .slice(0, 5)
              .map((a: any) => String(a.id));

            const filmImg = item.poster_path
              ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
              : undefined;

            // Film ekle
            newFilms.push({
              id: filmId,
              title: item.original_title || item.title,
              year: item.year,
              directorId,
              actorIds,
              imgUrl: filmImg,
            });

            // Yönetmen ekle
            if (directorId && item.directors[0]) {
              const dImg = item.directors[0].profile_path
                ? `https://image.tmdb.org/t/p/w200${item.directors[0].profile_path}`
                : undefined;
              newPersons.set(directorId, {
                id: directorId,
                name: item.directors[0].name,
                role: "director",
                imgUrl: dImg,
              });
            }

            // Oyuncuları ekle
            (item.cast || []).slice(0, 5).forEach((a: any) => {
              const aId = String(a.id);
              if (!newPersons.has(aId)) {
                const aImg = a.profile_path
                  ? `https://image.tmdb.org/t/p/w200${a.profile_path}`
                  : undefined;
                newPersons.set(aId, {
                  id: aId,
                  name: a.name,
                  role: "actor",
                  imgUrl: aImg,
                });
              }
            });
          });

          setFilms(newFilms);
          setPersons(newPersons);
        }
      } catch (e) {
        console.error("Failed to fetch films.json:", e);
      }
    }

    loadData();
  }, []);

  // Veri değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (films.length > 0 || persons.size > 0) {
      const dataToSave = {
        films,
        persons: Object.fromEntries(persons),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, [films, persons]);

  // Graph verisini güncelle
  useEffect(() => {
    let nodes: GraphNode[] = [];
    let links: GraphLink[] = [];

    const visibleFilmIds = new Set<string>();
    const visiblePersonIds = new Set<string>();

    if (selectedNode) {
      if (selectedNode.type === "film") {
        // 1. Düzey: Seçili film
        visibleFilmIds.add(selectedNode.id);

        // 2. Düzey: Bu filmdeki herkes ve onların diğer filmleri
        const selectedFilm = films.find((f) => f.id === selectedNode.id);
        if (selectedFilm) {
          // Yönetmen ve filmleri
          if (selectedFilm.directorId) {
            visiblePersonIds.add(selectedFilm.directorId);
            films
              .filter((f) => f.directorId === selectedFilm.directorId)
              .forEach((f) => visibleFilmIds.add(f.id));
          }
          // Oyuncular ve filmleri
          selectedFilm.actorIds.forEach((aId) => {
            visiblePersonIds.add(aId);
            films
              .filter((f) => f.actorIds.includes(aId))
              .forEach((f) => visibleFilmIds.add(f.id));
          });
        }
      } else {
        // Person seçiliyse (Aktör/Yönetmen)
        // 1. Düzey: Seçili kişi
        visiblePersonIds.add(selectedNode.id);

        // 2. Düzey: Bu kişinin tüm filmleri ve o filmlerdeki diğer herkes
        const relatedFilms = films.filter(
          (f) =>
            f.directorId === selectedNode.id ||
            f.actorIds.includes(selectedNode.id),
        );

        relatedFilms.forEach((f) => {
          visibleFilmIds.add(f.id);
          visiblePersonIds.add(f.directorId);
          f.actorIds.forEach((aId) => visiblePersonIds.add(aId));
        });

        // Bonus: Bu kişilerin (co-stars) diğer filmleri
        // Eğer person seçiliyse sadece filmlerini ve o filmlerdeki kişileri göstermek yeterli olabilir.
        // Ama "oyuncuların oynadığı diğer filmler" dediğin için bir seviye daha gidelim:
        visiblePersonIds.forEach((pId) => {
          films
            .filter((f) => f.directorId === pId || f.actorIds.includes(pId))
            .forEach((f) => visibleFilmIds.add(f.id));
        });
      }
    }

    // Görünürlük kontrolü
    const isFilmVisible = (filmId: string) =>
      !selectedNode || visibleFilmIds.has(filmId);
    const isPersonVisible = (personId: string) =>
      !selectedNode || visiblePersonIds.has(personId);

    // Filmleri ekle
    films.forEach((film) => {
      if (isFilmVisible(film.id)) {
        nodes.push({
          id: film.id,
          name: film.title,
          type: "film",
          color: "#ef4444",
          val: 12,
          imgUrl: film.imgUrl,
        });

        // Bağlantıları ekle (Eğer her iki taraf da görünürse)
        if (film.directorId && isPersonVisible(film.directorId)) {
          links.push({
            source: film.id,
            target: film.directorId,
            role: "director",
          });
        }

        film.actorIds.forEach((actorId) => {
          if (isPersonVisible(actorId)) {
            links.push({
              source: film.id,
              target: actorId,
              role: "actor",
            });
          }
        });
      }
    });

    // Kişileri ekle
    persons.forEach((person, id) => {
      if (isPersonVisible(id)) {
        nodes.push({
          id: person.id,
          name: person.name,
          type: person.role,
          color: person.role === "director" ? "#22c55e" : "#3b82f6",
          val: person.role === "director" ? 8 : 6,
          imgUrl: person.imgUrl,
        });
      }
    });

    setGraphData({ nodes, links });
  }, [films, persons, selectedNode]);

  // Film ekleme
  const handleAddFilm = useCallback(
    (filmData: FilmData) => {
      const newPersons = new Map(persons);

      // Yönetmeni ekle/güncelle
      newPersons.set(filmData.director.id, filmData.director);

      // Oyuncuları ekle/güncelle
      filmData.actors.forEach((actor) => {
        newPersons.set(actor.id, actor);
      });

      setPersons(newPersons);

      const newFilm: Film = {
        id: filmData.id,
        title: filmData.title,
        year: filmData.year,
        directorId: filmData.director.id,
        actorIds: filmData.actors.map((a) => a.id),
      };

      setFilms((prev) => [...prev, newFilm]);
    },
    [persons],
  );

  // Film silme
  const handleDeleteFilm = useCallback(
    (filmId: string) => {
      setFilms((prev) => prev.filter((f) => f.id !== filmId));
      if (selectedNode?.id === filmId) {
        setSelectedNode(null);
      }
    },
    [selectedNode],
  );

  // Node seçme
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  // Bağlı node'ları bul
  const getConnectedNodes = useCallback(
    (nodeId: string): GraphNode[] => {
      const connectedIds = new Set<string>();

      graphData.links.forEach((link) => {
        const sourceId =
          typeof link.source === "string"
            ? link.source
            : (link.source as GraphNode).id;
        const targetId =
          typeof link.target === "string"
            ? link.target
            : (link.target as GraphNode).id;

        if (sourceId === nodeId) {
          connectedIds.add(targetId);
        } else if (targetId === nodeId) {
          connectedIds.add(sourceId);
        }
      });

      return graphData.nodes.filter((n) => connectedIds.has(n.id));
    },
    [graphData],
  );

  // Verileri sıfırla ve Letterboxd'dan yükle
  const handleResetData = useCallback(() => {
    if (
      confirm(
        "Are you sure you want to delete all data and reload the film list?",
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  }, []);

  // Film listesi için veri hazırla
  const filmListData = films.map((f) => ({
    id: f.id,
    title: f.title,
    year: f.year,
  }));

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* Sol Kenar Çubuğu - Film Listesi */}
      <div className="w-80 flex-shrink-0">
        <FilmList
          films={filmListData}
          onAddClick={() => setIsModalOpen(true)}
          onResetClick={handleResetData}
          onFilmClick={(filmId) => {
            const node = graphData.nodes.find((n) => n.id === filmId);
            if (node) setSelectedNode(node);
          }}
          onDeleteFilm={handleDeleteFilm}
          selectedNodeId={selectedNode?.id}
        />
      </div>

      {/* Ana Alan - Graph */}
      <div className="flex-1 relative">
        {/* Header */}
        <div className="absolute top-8 left-8 z-10 pointer-events-none">
          <h1 className="text-3xl font-bold text-white mb-2 leading-none">
            Film Graph
          </h1>
          <p className="text-sm text-zinc-500 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 inline-block">
            <span className="text-white font-medium">
              {graphData.nodes.length}
            </span>{" "}
            nodes •{" "}
            <span className="text-white font-medium">
              {graphData.links.length}
            </span>{" "}
            links
          </p>
        </div>

        {/* Graph Container */}
        <div className="w-full h-full">
          <FilmGraph data={graphData} onNodeClick={handleNodeClick} />
        </div>

        {/* Node Detail Panel */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            connectedNodes={getConnectedNodes(selectedNode.id)}
          />
        )}
      </div>

      {/* Film Ekleme Modal */}
      <AddFilmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddFilm}
      />
    </div>
  );
}
