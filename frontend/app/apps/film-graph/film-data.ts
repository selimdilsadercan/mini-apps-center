import { GraphData, GraphLink, GraphNode } from "./types";

export interface Person {
  id: string;
  name: string;
  role: "actor" | "director";
  imgUrl?: string;
}

export interface Film {
  id: string;
  title: string;
  year: number;
  directorId: string;
  actorIds: string[];
  imgUrl?: string;
  overview?: string;
  voteAverage?: number;
}

export interface FilmCatalogItem {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  overview: string;
  voteAverage: number;
  voteCount: number;
  popularity: number;
  posterUrl?: string;
  backdropUrl?: string;
  directorId: string;
  directorName: string;
  actorIds: string[];
  castNames: string[];
  imdbId?: string;
}

export type FilmTab = "discover" | "list" | "graph";

export const STORAGE_KEY = "film-graph-data";
export const ACCENT = "#D97706";

export function parseCatalogRawItem(item: Record<string, unknown>): {
  catalog: FilmCatalogItem;
  film: Film;
  persons: Person[];
} {
  const filmId = String(item.id);
  const directors = (item.directors as Record<string, unknown>[]) || [];
  const cast = (item.cast as Record<string, unknown>[]) || [];
  const directorId =
    directors.length > 0 ? String(directors[0].id) : "";
  const actorIds = cast.slice(0, 5).map((a) => String(a.id));
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : undefined;
  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : undefined;

  const persons: Person[] = [];

  if (directorId && directors[0]) {
    const d = directors[0];
    persons.push({
      id: directorId,
      name: String(d.name),
      role: "director",
      imgUrl: d.profile_path
        ? `https://image.tmdb.org/t/p/w200${d.profile_path}`
        : undefined,
    });
  }

  cast.slice(0, 5).forEach((a) => {
    const aId = String(a.id);
    if (!persons.some((p) => p.id === aId)) {
      persons.push({
        id: aId,
        name: String(a.name),
        role: "actor",
        imgUrl: a.profile_path
          ? `https://image.tmdb.org/t/p/w200${a.profile_path}`
          : undefined,
      });
    }
  });

  const title = String(item.title || item.original_title || "Untitled");
  const year = Number(item.year) || new Date(String(item.release_date)).getFullYear();

  const catalog: FilmCatalogItem = {
    id: filmId,
    title,
    originalTitle: String(item.original_title || title),
    year,
    overview: String(item.overview || ""),
    voteAverage: Number(item.vote_average) || 0,
    voteCount: Number(item.vote_count) || 0,
    popularity: Number(item.popularity) || 0,
    posterUrl,
    backdropUrl,
    directorId,
    directorName: directors[0] ? String(directors[0].name) : "",
    actorIds,
    castNames: cast.slice(0, 5).map((a) => String(a.name)),
  };

  const film: Film = {
    id: filmId,
    title: catalog.originalTitle || catalog.title,
    year: catalog.year,
    directorId,
    actorIds,
    imgUrl: posterUrl,
    overview: catalog.overview,
    voteAverage: catalog.voteAverage,
  };

  return { catalog, film, persons };
}

export function buildGraphData(
  films: Film[],
  persons: Map<string, Person>,
  selectedNode: GraphNode | null,
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const visibleFilmIds = new Set<string>();
  const visiblePersonIds = new Set<string>();

  if (selectedNode) {
    if (selectedNode.type === "film") {
      visibleFilmIds.add(selectedNode.id);
      const selectedFilm = films.find((f) => f.id === selectedNode.id);
      if (selectedFilm) {
        if (selectedFilm.directorId) {
          visiblePersonIds.add(selectedFilm.directorId);
          films
            .filter((f) => f.directorId === selectedFilm.directorId)
            .forEach((f) => visibleFilmIds.add(f.id));
        }
        selectedFilm.actorIds.forEach((aId) => {
          visiblePersonIds.add(aId);
          films.filter((f) => f.actorIds.includes(aId)).forEach((f) => visibleFilmIds.add(f.id));
        });
      }
    } else {
      visiblePersonIds.add(selectedNode.id);
      const relatedFilms = films.filter(
        (f) => f.directorId === selectedNode.id || f.actorIds.includes(selectedNode.id),
      );
      relatedFilms.forEach((f) => {
        visibleFilmIds.add(f.id);
        visiblePersonIds.add(f.directorId);
        f.actorIds.forEach((aId) => visiblePersonIds.add(aId));
      });
      visiblePersonIds.forEach((pId) => {
        films
          .filter((f) => f.directorId === pId || f.actorIds.includes(pId))
          .forEach((f) => visibleFilmIds.add(f.id));
      });
    }
  }

  const isFilmVisible = (filmId: string) => !selectedNode || visibleFilmIds.has(filmId);
  const isPersonVisible = (personId: string) =>
    !selectedNode || visiblePersonIds.has(personId);

  films.forEach((film) => {
    if (!isFilmVisible(film.id)) return;
    nodes.push({
      id: film.id,
      name: film.title,
      type: "film",
      color: ACCENT,
      val: 12,
      imgUrl: film.imgUrl,
    });
    if (film.directorId && isPersonVisible(film.directorId)) {
      links.push({ source: film.id, target: film.directorId, role: "director" });
    }
    film.actorIds.forEach((actorId) => {
      if (isPersonVisible(actorId)) {
        links.push({ source: film.id, target: actorId, role: "actor" });
      }
    });
  });

  persons.forEach((person, id) => {
    if (!isPersonVisible(id)) return;
    nodes.push({
      id: person.id,
      name: person.name,
      type: person.role,
      color: person.role === "director" ? "#22c55e" : "#3b82f6",
      val: person.role === "director" ? 8 : 6,
      imgUrl: person.imgUrl,
    });
  });

  return { nodes, links };
}

export function catalogItemToEntry(item: FilmCatalogItem): {
  film: Film;
  persons: Person[];
} {
  const persons: Person[] = [];

  if (item.directorId) {
    persons.push({
      id: item.directorId,
      name: item.directorName,
      role: "director",
    });
  }

  item.actorIds.forEach((id, i) => {
    if (!persons.some((p) => p.id === id)) {
      persons.push({
        id,
        name: item.castNames[i] || "",
        role: "actor",
      });
    }
  });

  const film: Film = {
    id: item.id,
    title: item.originalTitle || item.title,
    year: item.year,
    directorId: item.directorId,
    actorIds: item.actorIds,
    imgUrl: item.posterUrl,
    overview: item.overview,
    voteAverage: item.voteAverage,
  };

  return { film, persons };
}

export function getConnectedNodes(nodeId: string, graphData: GraphData): GraphNode[] {
  const connectedIds = new Set<string>();
  graphData.links.forEach((link) => {
    const sourceId =
      typeof link.source === "string" ? link.source : (link.source as GraphNode).id;
    const targetId =
      typeof link.target === "string" ? link.target : (link.target as GraphNode).id;
    if (sourceId === nodeId) connectedIds.add(targetId);
    else if (targetId === nodeId) connectedIds.add(sourceId);
  });
  return graphData.nodes.filter((n) => connectedIds.has(n.id));
}
