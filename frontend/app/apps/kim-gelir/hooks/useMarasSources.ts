"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/lib/api";
import {
  MARAS_CITY,
  buildCinemasFromSessions,
  buildEventOptions,
  buildNeYapsakSuggestions,
  filterCafePlaces,
  filterFoodPlaces,
  filterStudyPlaces,
  filterTheaterVenues,
  type MarasCinema,
  type MarasEventOption,
  type NeYapsakSuggestion,
} from "../lib/maras-sources";

const client = createBrowserClient();

export function useMarasSources(userId?: string) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const workplacesQuery = useQuery({
    queryKey: ["kim-gelir", "maras-places", userId],
    queryFn: () => client.workplaces.listPlaces({ userId, city: MARAS_CITY }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const cinemaQuery = useQuery({
    queryKey: ["kim-gelir", "maras-cinema", todayStr],
    queryFn: async () => {
      const [piazzaRes, arsanRes, moviesRes] = await Promise.all([
        client.film_graph.getCineverseSessions({ date: todayStr, theaterSlug: "piazza-kahramanmaras" }),
        client.film_graph.getCineverseSessions({ date: todayStr, theaterSlug: "kahramanmaras-arsan-sinemasi" }),
        client.film_graph.getCineverseMovies(),
      ]);
      return {
        sessions: [...(piazzaRes.sessions || []), ...(arsanRes.sessions || [])],
        movies: moviesRes.movies || [],
      };
    },
    staleTime: 60 * 1000,
  });

  const concertsQuery = useQuery({
    queryKey: ["kim-gelir", "maras-concerts"],
    queryFn: () => client.concert_list.getUpcomingConcerts(),
    staleTime: 5 * 60 * 1000,
  });

  const eventsQuery = useQuery({
    queryKey: ["kim-gelir", "maras-events", userId],
    queryFn: () => client.campus_events.getEvents({ userId }),
    staleTime: 5 * 60 * 1000,
  });

  const standupsQuery = useQuery({
    queryKey: ["kim-gelir", "maras-standups"],
    queryFn: () => client.standups.listUpcomingShows(),
    staleTime: 5 * 60 * 1000,
  });

  const places = workplacesQuery.data?.places || [];
  const cinemas: MarasCinema[] = useMemo(
    () => buildCinemasFromSessions(cinemaQuery.data?.sessions || [], cinemaQuery.data?.movies || []),
    [cinemaQuery.data],
  );

  const events: MarasEventOption[] = useMemo(
    () =>
      buildEventOptions(
        concertsQuery.data?.concerts || [],
        eventsQuery.data?.events || [],
        standupsQuery.data?.shows || [],
      ),
    [concertsQuery.data, eventsQuery.data, standupsQuery.data],
  );

  const suggestions: NeYapsakSuggestion[] = useMemo(
    () =>
      buildNeYapsakSuggestions({
        cinemas,
        studyPlaces: filterStudyPlaces(places),
        events,
      }),
    [cinemas, places, events],
  );

  const loading =
    workplacesQuery.isLoading ||
    cinemaQuery.isLoading ||
    concertsQuery.isLoading ||
    eventsQuery.isLoading;

  return {
    loading,
    places,
    cinemas,
    events,
    suggestions,
    studyPlaces: (query = "") => filterStudyPlaces(places, query),
    cafePlaces: (query = "") => filterCafePlaces(places, query),
    foodPlaces: (query = "") => filterFoodPlaces(places, query),
    theaterVenues: (query = "") => filterTheaterVenues(places, query),
    filterEvents: (query = "") =>
      events.filter((e) => matchesEvent(e, query)),
  };
}

function matchesEvent(event: MarasEventOption, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = `${event.title} ${event.location} ${event.dateLabel}`;
  return haystack.toLowerCase().includes(query.toLowerCase());
}
