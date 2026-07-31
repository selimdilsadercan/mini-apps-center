"use client";

import type { MarasCinema, MarasEventOption } from "../lib/maras-sources";
import {
  getEventKindsForPreset,
  isMoviePreset,
  type MoviePlanDetail,
} from "../lib/activity-detail";
import {
  embeddedRowClass,
  fieldClass,
  innerLabelClass,
  modeChipClass,
  NE_YAPSAK_ACCENT,
} from "../lib/theme";

export interface ActivityDetailFieldsProps {
  presetId: string | null;
  activityDetail: string;
  setActivityDetail: (v: string) => void;
  movieDetail: MoviePlanDetail | null;
  onMovieDetailChange: (detail: MoviePlanDetail | null) => void;
  cinemas: MarasCinema[];
  cinemasLoading: boolean;
  events: MarasEventOption[];
  onEventPick: (event: MarasEventOption) => void;
}

export function ActivityDetailFields({
  presetId,
  activityDetail,
  setActivityDetail,
  movieDetail,
  onMovieDetailChange,
  cinemas,
  cinemasLoading,
  events,
  onEventPick,
}: ActivityDetailFieldsProps) {
  if (isMoviePreset(presetId)) {
    return (
      <MovieDetailPicker
        cinemas={cinemas}
        loading={cinemasLoading}
        selection={movieDetail}
        onChange={onMovieDetailChange}
        fallbackText={activityDetail}
        onFallbackText={setActivityDetail}
      />
    );
  }

  const eventKinds = getEventKindsForPreset(presetId);
  if (eventKinds) {
    const filtered = events.filter((e) => eventKinds.includes(e.kind));
    return (
      <EventDetailPicker
        events={filtered}
        selectedTitle={activityDetail}
        onPick={onEventPick}
        onTextChange={setActivityDetail}
      />
    );
  }

  return (
    <input
      type="text"
      value={activityDetail}
      onChange={(e) => setActivityDetail(e.target.value)}
      placeholder="Detay… örn: Örümcek-Adam"
      className={`${fieldClass} bg-app-surface-muted/60 border-0 ring-1 ring-app-border focus:ring-[#FF5252]/30`}
    />
  );
}

function MovieDetailPicker({
  cinemas,
  loading,
  selection,
  onChange,
  fallbackText,
  onFallbackText,
}: {
  cinemas: MarasCinema[];
  loading: boolean;
  selection: MoviePlanDetail | null;
  onChange: (detail: MoviePlanDetail | null) => void;
  fallbackText: string;
  onFallbackText: (v: string) => void;
}) {
  const activeCinemas = cinemas.filter((c) => c.moviesToday.length > 0);
  const selectedCinemaSlug =
    selection?.cinemaSlug ?? (activeCinemas.length === 1 ? activeCinemas[0].slug : null);
  const selectedCinema = selectedCinemaSlug
    ? cinemas.find((c) => c.slug === selectedCinemaSlug) ?? null
    : null;

  const movies = selectedCinema?.moviesToday ?? [];
  const selectedMovie = selection?.movieTitle
    ? movies.find((m) => m.title === selection.movieTitle) ?? null
    : null;
  const times = selectedMovie ? [...selectedMovie.times].sort() : [];

  const pickCinema = (cinema: MarasCinema) => {
    onChange({
      cinemaSlug: cinema.slug,
      cinemaName: cinema.name,
      district: cinema.district,
      movieTitle: "",
      sessionTime: "",
    });
  };

  const pickMovie = (title: string) => {
    if (!selectedCinema) return;
    onChange({
      cinemaSlug: selectedCinema.slug,
      cinemaName: selectedCinema.name,
      district: selectedCinema.district,
      movieTitle: title,
      sessionTime: "",
    });
  };

  const pickSession = (time: string) => {
    if (!selectedCinema || !selection?.movieTitle) return;
    onChange({
      cinemaSlug: selectedCinema.slug,
      cinemaName: selectedCinema.name,
      district: selectedCinema.district,
      movieTitle: selection.movieTitle,
      sessionTime: time,
    });
  };

  if (loading) {
    return <p className="text-[10px] text-app-muted font-bold">Seanslar yükleniyor…</p>;
  }

  if (activeCinemas.length === 0) {
    return (
      <input
        type="text"
        value={fallbackText}
        onChange={(e) => onFallbackText(e.target.value)}
        placeholder="Bugün seans yok — film adı yaz…"
        className={`${fieldClass} bg-app-surface-muted/60 border-0 ring-1 ring-app-border`}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <span className={innerLabelClass}>Sinema</span>
        <div className="flex flex-wrap gap-1.5">
          {activeCinemas.map((cinema) => (
            <button
              key={cinema.slug}
              type="button"
              onClick={() => pickCinema(cinema)}
              className={modeChipClass(selection?.cinemaSlug === cinema.slug)}
            >
              {cinema.name.replace("Paribu Cineverse ", "").replace(" Sineması", "")}
            </button>
          ))}
        </div>
      </div>

      {selectedCinema && movies.length > 0 && (
        <div className="space-y-2">
          <span className={innerLabelClass}>Film</span>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {movies.map((movie) => {
              const isSelected = selection?.movieTitle === movie.title;
              return (
                <button
                  key={movie.title}
                  type="button"
                  onClick={() => pickMovie(movie.title)}
                  className={`${embeddedRowClass(isSelected)} flex items-center gap-2.5 w-full`}
                >
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt="" className="w-7 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <span className="text-sm shrink-0">🎬</span>
                  )}
                  <span className="truncate text-left flex-1">{movie.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedMovie && times.length > 0 && (
        <div className="space-y-2">
          <span className={innerLabelClass}>Seans</span>
          <div className="flex flex-wrap gap-1.5">
            {times.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => pickSession(time)}
                className={modeChipClass(selection?.sessionTime === time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {selection?.movieTitle && selection.sessionTime && (
        <p className="text-[10px] font-bold" style={{ color: NE_YAPSAK_ACCENT }}>
          ✓ {selection.movieTitle} · {selection.sessionTime}
        </p>
      )}
    </div>
  );
}

function EventDetailPicker({
  events,
  selectedTitle,
  onPick,
  onTextChange,
}: {
  events: MarasEventOption[];
  selectedTitle: string;
  onPick: (event: MarasEventOption) => void;
  onTextChange: (v: string) => void;
}) {
  if (events.length === 0) {
    return (
      <input
        type="text"
        value={selectedTitle}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Etkinlik adı…"
        className={`${fieldClass} bg-app-surface-muted/60 border-0 ring-1 ring-app-border`}
      />
    );
  }

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {events.slice(0, 12).map((event) => {
        const isSelected = selectedTitle === event.title;
        return (
          <button
            key={event.id}
            type="button"
            onClick={() => onPick(event)}
            className={`${embeddedRowClass(isSelected)} flex flex-col gap-0.5 w-full`}
          >
            <span className="truncate">{event.title}</span>
            <span className="text-[10px] text-app-muted font-semibold truncate">
              {event.dateLabel} · {event.location}
            </span>
          </button>
        );
      })}
    </div>
  );
}
