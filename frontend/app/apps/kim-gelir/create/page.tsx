"use client";

import { useEffect, useState, Suspense } from "react";
import { useUser } from "@clerk/clerk-react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  CaretLeft,
  MapPin, 
  X, 
  Spinner,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/api";
import { friendship } from "@/lib/client";
import { Drawer } from "vaul";
import dynamic from "next/dynamic";
import { PlanCreateForm, type FieldMode, type WhatMode } from "../components/PlanCreateForm";
import {
  buildDetailedTitle,
  isMoviePreset,
  type MoviePlanDetail,
} from "../lib/activity-detail";
import type { MarasEventOption } from "../lib/maras-sources";
import { PLAN_OPEN_WHAT } from "../lib/plan-poll";
import {
  NE_YAPSAK_ACCENT,
  PLAN_OPEN_LOCATION,
  PLAN_OPEN_TIME,
  accentHighlightClass,
  drawerHandleClass,
  fieldClass,
  iconBtnClass,
  pickerBadgeClass,
  pickerItemClass,
  pickerRowClass,
  primaryBtnClass,
  secondaryBtnClass,
  sectionLabelClass,
} from "../lib/theme";

const StudyPlacesMap = dynamic(() => import("@/components/maps/StudyPlacesMap"), {
  ssr: false,
});

const client = createBrowserClient();

import ACTIVITIES_DATA from "../activities.json";
import { GAMES_DATA } from "../../iskambil/games-registry";
import { useMarasSources } from "../hooks/useMarasSources";
import { matchesQuery } from "../lib/maras-sources";
const ALL_PRESET_ACTIVITIES = ACTIVITIES_DATA.flatMap(cat => cat.items);

const PRESET_TIMES = [
  { id: "now", label: "Şimdi" },
  { id: "30mins", label: "30 dk sonra" },
  { id: "evening", label: "Bugün akşam" },
  { id: "tomorrow", label: "Yarın" },
  { id: "custom", label: "Özel Saat" },
];

type ActivityType = "quick_invite" | "plan_poll" | "time_poll";

function CreatePlanContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const maras = useMarasSources(user?.id);

  // State
  const [friends, setFriends] = useState<friendship.FriendUser[]>([]);
  const workplacesList = maras.places;
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Plan create state
  const [whatMode, setWhatMode] = useState<WhatMode>("open");
  const [whereMode, setWhereMode] = useState<FieldMode>("open");
  const [whenMode, setWhenMode] = useState<FieldMode>("open");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [activityDetail, setActivityDetail] = useState("");
  const [movieDetail, setMovieDetail] = useState<MoviePlanDetail | null>(null);
  const [selectedTimeId, setSelectedTimeId] = useState("now");
  const [customTime, setCustomTime] = useState("");
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetPickerGoal, setPresetPickerGoal] = useState<"activity" | "location">("activity");
  const [presetSearch, setPresetSearch] = useState("");
  const [tempSelectedActivity, setTempSelectedActivity] = useState<{ id: string; label: string; icon: string } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [location, setLocation] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const selectedPreset = selectedPresetId
    ? ALL_PRESET_ACTIVITIES.find((p) => p.id === selectedPresetId)
    : customTitle.trim()
      ? { id: "", label: customTitle.trim(), icon: "✍️" }
      : null;

  const resetPlanForm = () => {
    setWhatMode("open");
    setWhereMode("open");
    setWhenMode("open");
    setCustomTitle("");
    setSelectedPresetId(null);
    setActivityDetail("");
    setMovieDetail(null);
    setSelectedTimeId("now");
    setCustomTime("");
    setLocation("");
    setSelectedFriendIds([]);
  };

  const fetchFriends = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const friendsRes = await client.friendship.getFriends(user.id);
      setFriends(friendsRes.friends);
    } catch (err) {
      console.error("Error fetching friends:", err);
      showToastMsg("Veriler yüklenirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchFriends();
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const preset = searchParams.get("preset");
    const title = searchParams.get("title");
    const loc = searchParams.get("location");
    const time = searchParams.get("time");

    if (!preset && !title && !loc && !time) return;

    setWhatMode(preset ? "detailed" : "open");

    if (preset) {
      const found = ALL_PRESET_ACTIVITIES.find((p) => p.id === preset);
      if (found) {
        setSelectedPresetId(found.id);
        setCustomTitle("");
      } else {
        setSelectedPresetId("");
        setCustomTitle(title || preset);
      }
    }

    if (title) {
      if (ALL_PRESET_ACTIVITIES.some((p) => p.id === preset)) {
        setActivityDetail(title);
      } else if (!preset) {
        setCustomTitle(title);
        setWhatMode("detailed");
      }
    }

    if (loc) {
      setWhereMode("fixed");
      setLocation(loc);
    }

    if (time) {
      setWhenMode("fixed");
      const presetTime = PRESET_TIMES.find((t) => t.label === time);
      if (presetTime) setSelectedTimeId(presetTime.id);
      else {
        setSelectedTimeId("custom");
        setCustomTime(time);
      }
    }
  }, [isLoaded, user, searchParams]);

  const handleMovieDetailChange = (detail: MoviePlanDetail | null) => {
    setMovieDetail(detail);
    if (detail?.movieTitle && detail.sessionTime) {
      setActivityDetail(detail.movieTitle);
      setWhereMode("fixed");
      setLocation(`${detail.cinemaName} (${detail.district})`);
      setWhenMode("fixed");
      setSelectedTimeId("custom");
      setCustomTime(`Bugün ${detail.sessionTime}`);
    } else if (detail?.movieTitle) {
      setActivityDetail(detail.movieTitle);
    } else {
      setActivityDetail("");
    }
  };

  const handleEventPick = (event: MarasEventOption) => {
    setActivityDetail(event.title);
    if (event.location) {
      setWhereMode("fixed");
      setLocation(event.location);
    }
    if (event.dateLabel) {
      setWhenMode("fixed");
      setSelectedTimeId("custom");
      setCustomTime(event.dateLabel);
    }
  };

  const showToastMsg = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if ((whatMode === "category" || whatMode === "detailed") && !selectedPreset && !customTitle.trim()) {
      showToastMsg("Lütfen bir aktivite seç.", "error");
      return;
    }

    if (whereMode === "fixed" && !location.trim()) {
      showToastMsg("Lütfen bir yer seç veya yaz.", "error");
      return;
    }

    if (whenMode === "fixed" && selectedTimeId === "custom" && !customTime.trim()) {
      showToastMsg("Lütfen özel saat gir.", "error");
      return;
    }

    let finalTitle = PLAN_OPEN_WHAT;
    if (whatMode === "category") {
      finalTitle = selectedPreset?.label || customTitle.trim();
    } else if (whatMode === "detailed") {
      const base = selectedPreset?.label || customTitle.trim();
      finalTitle = buildDetailedTitle(base, activityDetail, movieDetail);
    }

    const finalLocation = whereMode === "open" ? PLAN_OPEN_LOCATION : location.trim();
    let finalTimeOption = PLAN_OPEN_TIME;
    let finalCustomTime: string | undefined;
    if (whenMode === "fixed") {
      finalTimeOption = PRESET_TIMES.find((t) => t.id === selectedTimeId)?.label || "Şimdi";
      finalCustomTime = selectedTimeId === "custom" ? customTime.trim() : undefined;
    }

    const hasOpenPoll = whatMode === "open" || whereMode === "open" || whenMode === "open";
    const finalActivityType: ActivityType = hasOpenPoll ? "plan_poll" : "quick_invite";

    try {
      setModalLoading(true);
      await client.kim_gelir.createActivity({
        creatorId: user.id,
        title: finalTitle,
        location: finalLocation,
        timeOption: finalTimeOption,
        customTime: finalCustomTime,
        invitedUserIds: selectedFriendIds,
        activityType: finalActivityType,
        options: [],
      });

      showToastMsg("Plan paylaşıldı!", "success");
      resetPlanForm();
      router.push("/apps/kim-gelir?created=1");
    } catch (err) {
      console.error(err);
      showToastMsg("Plan oluşturulamadı.", "error");
    } finally {
      setModalLoading(false);
    }
  };

  const openActivityPicker = () => {
    setPresetPickerGoal("activity");
    setTempSelectedActivity(null);
    setShowPresetModal(true);
  };

  const openLocationPicker = () => {
    setPresetPickerGoal("location");
    if (selectedPreset) {
      setTempSelectedActivity({
        id: selectedPreset.id,
        label: selectedPreset.label,
        icon: selectedPreset.icon,
      });
    } else {
      setTempSelectedActivity({ id: "general", label: "Buluşma", icon: "📍" });
    }
    setShowPresetModal(true);
  };

  const pickActivityFromList = (item: { id: string; label: string; icon: string }) => {
    if (presetPickerGoal === "activity") {
      if (item.id) {
        setSelectedPresetId(item.id);
        setCustomTitle("");
      } else {
        setSelectedPresetId("");
        setCustomTitle(item.label);
      }
      setShowPresetModal(false);
      setPresetSearch("");
      setTempSelectedActivity(null);
      setMovieDetail(null);
      setActivityDetail("");
      return;
    }
    setTempSelectedActivity(item);
    setLocation("");
  };

  const confirmPresetLocation = () => {
    setShowPresetModal(false);
    setPresetSearch("");
    setTempSelectedActivity(null);
  };

  const needsMovieSession =
    whatMode === "detailed" && isMoviePreset(selectedPresetId) && maras.cinemas.some((c) => c.moviesToday.length > 0);

  const canSubmitPlan =
    (whatMode === "open" ||
      ((whatMode === "category" || whatMode === "detailed") && (!!selectedPreset || !!customTitle.trim()))) &&
    (!needsMovieSession || !!movieDetail?.sessionTime) &&
    (whereMode === "open" || !!location.trim()) &&
    (whenMode === "open" || selectedTimeId !== "custom" || !!customTime.trim());

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId) 
        : [...prev, friendId]
    );
  };

  const selectAllFriends = () => {
    if (selectedFriendIds.length === friends.length) {
      setSelectedFriendIds([]);
    } else {
      setSelectedFriendIds(friends.map(f => f.id));
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex min-h-screen flex-col bg-app-bg">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-app-text pb-24">
      <header className="sticky top-0 z-30 app-chrome-top bg-app-surface/95 backdrop-blur-md border-b border-app-border/60">
        <div className="px-4 pt-3 pb-3 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => router.push("/apps/kim-gelir")}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-app-muted hover:text-app-text transition-all bg-app-surface rounded-lg border border-app-border active:scale-95 cursor-pointer"
            >
              <CaretLeft size={14} weight="bold" style={{ color: NE_YAPSAK_ACCENT }} />
            </button>
            <h1 className="flex-1 min-w-0 text-base font-black tracking-tight text-app-text">
              Plan Oluştur
            </h1>
          </div>
          <p className="text-[10px] text-app-muted font-bold mt-2 px-10">
            Ne, nerede, ne zaman — istediğin kadarını netleştir
          </p>
        </div>
      </header>

      <main className="flex-1 px-4 max-w-xl mx-auto w-full pt-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size={32} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
          </div>
        ) : (
          <PlanCreateForm
            friends={friends}
            loading={modalLoading}
            whatMode={whatMode}
            setWhatMode={setWhatMode}
            whereMode={whereMode}
            setWhereMode={setWhereMode}
            whenMode={whenMode}
            setWhenMode={setWhenMode}
            selectedPresetLabel={selectedPreset?.label ?? null}
            selectedPresetIcon={selectedPreset?.icon ?? "🔍"}
            selectedPresetId={selectedPresetId}
            activityDetail={activityDetail}
            setActivityDetail={setActivityDetail}
            movieDetail={movieDetail}
            onMovieDetailChange={handleMovieDetailChange}
            cinemas={maras.cinemas}
            cinemasLoading={maras.loading}
            events={maras.events}
            onEventPick={handleEventPick}
            location={location}
            selectedTimeId={selectedTimeId}
            setSelectedTimeId={setSelectedTimeId}
            customTime={customTime}
            setCustomTime={setCustomTime}
            selectedFriendIds={selectedFriendIds}
            onToggleFriend={toggleFriendSelection}
            onSelectAllFriends={selectAllFriends}
            onOpenActivityPicker={openActivityPicker}
            onOpenLocationPicker={openLocationPicker}
            onSubmit={handleCreateActivity}
            canSubmit={canSubmitPlan}
          />
        )}
      </main>

      {/* PRESET ACTIVITIES DRAWER */}
      <Drawer.Root open={showPresetModal} onOpenChange={(open) => {
        setShowPresetModal(open);
        if (!open) {
          setPresetSearch("");
          if (presetPickerGoal === "activity") setTempSelectedActivity(null);
        }
      }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
          <Drawer.Content className="bg-app-surface rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[90] max-w-xl mx-auto border-t border-app-border shadow-2xl flex flex-col">
            {presetPickerGoal === "location" && tempSelectedActivity ? (
              <div className="p-5 flex-1 overflow-y-auto flex flex-col">
                <div className={drawerHandleClass} />

                <header className="flex justify-between items-center mb-5 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPresetModal(false);
                        setTempSelectedActivity(null);
                      }}
                      className={iconBtnClass}
                    >
                      <CaretLeft size={20} weight="bold" />
                    </button>
                    <Drawer.Title className="font-black text-base text-app-text">Yer Seç</Drawer.Title>
                  </div>
                  <button
                    onClick={() => {
                      setShowPresetModal(false);
                      setPresetSearch("");
                      setTempSelectedActivity(null);
                    }}
                    className={iconBtnClass}
                  >
                    <X size={18} weight="bold" />
                  </button>
                </header>

                <div className={`flex items-center gap-3 p-3.5 rounded-xl border mb-5 shrink-0 ${fieldClass}`}>
                  <span className="text-xl">{tempSelectedActivity.icon}</span>
                  <div className="min-w-0">
                    <span className={sectionLabelClass}>Aktivite</span>
                    <span className="text-sm font-bold text-app-text block truncate">{tempSelectedActivity.label}</span>
                  </div>
                </div>
                {(() => {
                  let locationLabel = "Buluşma yeri neresi?";
                  let locationPlaceholder = "Örn: Kadıköy, Kampüs, Cafe adı...";
                  const actId = tempSelectedActivity.id;

                  const isStudyActivity = [
                    "study",
                    "exam_study",
                    "project",
                    "library",
                    "coworking",
                    "homework",
                    "presentation",
                    "brainstorm",
                    "reading",
                    "language_practice"
                  ].includes(actId);

                  if (actId === "gym") {
                    locationLabel = "Hangi spor salonunda buluşacaksınız?";
                    locationPlaceholder = "Örn: MacFit Kadıköy, Hillside...";
                  } else if (actId === "coffee" || actId === "tea") {
                    locationLabel = "Hangi kafede buluşacaksınız?";
                    locationPlaceholder = "Örn: Starbucks, Espressolab, Kahve Dünyası...";
                  } else if (["food", "breakfast", "brunch", "lunch", "dinner", "dessert", "pizza", "burger", "sushi"].includes(actId)) {
                    locationLabel = "Hangi restoranda / nerede yemek yiyeceksiniz?";
                    locationPlaceholder = "Örn: Nusr-Et, Kadıköy Midyecisi, evde...";
                  } else if (actId === "movie") {
                    locationLabel = "Hangi sinemada buluşacaksınız?";
                    locationPlaceholder = "Örn: Piazza, Arsan Sineması...";
                  } else if (actId === "theater") {
                    locationLabel = "Hangi salonda / mekanda?";
                    locationPlaceholder = "Örn: Mehmet Akif Ersoy Kültür Merkezi...";
                  } else if (actId === "concert" || actId === "festival") {
                    locationLabel = "Hangi etkinlik / konser?";
                    locationPlaceholder = "Yaklaşan konser veya etkinlik seç...";
                  } else if (actId === "standup") {
                    locationLabel = "Hangi stand-up gösterisi?";
                    locationPlaceholder = "Yaklaşan gösteri seç...";
                  } else if (actId === "card_game") {
                    locationLabel = "Hangi kart oyununu oynayacaksınız?";
                    locationPlaceholder = "Örn: Batak, Pis Yedili, Pişti...";
                  } else if (["football", "basketball", "volleyball", "tennis", "table_tennis"].includes(actId)) {
                    locationLabel = "Hangi sahada / kortta oynayacaksınız?";
                    locationPlaceholder = "Örn: İTÜ Halı Sahası, Bostancı Spor Tesisleri...";
                  } else if (actId === "library") {
                    locationLabel = "Hangi kütüphanede çalışacaksınız?";
                    locationPlaceholder = "Örn: İTÜ Mustafa İnan Kütüphanesi, Salt Galata...";
                  } else if (isStudyActivity) {
                    locationLabel = "Nerede çalışacaksınız?";
                    locationPlaceholder = "Örn: Kafum, Kütüphane, Espressolab...";
                  }

                  const filteredCinemas =
                    actId === "movie"
                      ? maras.cinemas.filter((c) => {
                          const haystack = `${c.name} ${c.district}`;
                          return matchesQuery(haystack, location);
                        })
                      : [];

                  const filteredTheaters =
                    actId === "theater" ? maras.theaterVenues(location) : [];

                  const filteredCafePlaces =
                    actId === "coffee" || actId === "tea" ? maras.cafePlaces(location) : [];

                  const filteredFoodPlaces =
                    ["food", "breakfast", "brunch", "lunch", "dinner", "dessert", "pizza", "burger", "sushi"].includes(actId)
                      ? maras.foodPlaces(location)
                      : [];

                  const filteredEvents =
                    actId === "concert" || actId === "festival" || actId === "standup"
                      ? maras.filterEvents(location).filter((e) => {
                          if (actId === "concert") return e.kind === "concert";
                          if (actId === "standup") return e.kind === "standup";
                          return e.kind === "campus" || e.kind === "concert";
                        })
                      : [];

                  const filteredGames = actId === "card_game"
                    ? (GAMES_DATA as any[]).filter(g => {
                        if (!location.trim()) return true;
                        return matchesQuery(`${g.name_tr} ${g.name_en}`, location);
                      })
                    : [];

                  const filteredWorkplaces = isStudyActivity ? maras.studyPlaces(location) : [];

                  return (
                    <div className="space-y-3 mb-4 flex flex-col min-h-0">
                      <label className={sectionLabelClass}>
                        {locationLabel}
                      </label>
                      <div className="relative shrink-0">
                        <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={locationPlaceholder}
                          className={`${fieldClass} pl-10 pr-10`}
                          autoFocus
                        />
                        {location && (
                          <button
                            type="button"
                            onClick={() => setLocation("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-app-muted hover:text-app-text rounded-lg transition-all active:scale-90"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        )}
                      </div>

                      {actId === "movie" && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1 flex-1">
                          {maras.loading && (
                            <p className="text-[10px] text-app-muted font-bold px-1">Sinema seansları yükleniyor...</p>
                          )}
                          {filteredCinemas.map((cinema) => {
                            const cinemaValue = `${cinema.name} (${cinema.district})`;
                            const isSelected = location === cinemaValue;
                            const topMovie = cinema.moviesToday[0];
                            return (
                              <button
                                key={cinema.slug}
                                type="button"
                                onClick={() => setLocation(cinemaValue)}
                                className={`${pickerRowClass(isSelected)} flex flex-col gap-1 p-3`}
                              >
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <div className="flex items-center gap-2 truncate min-w-0">
                                    <span className="text-sm shrink-0">🎬</span>
                                    <span className="truncate">{cinema.name}</span>
                                  </div>
                                  <span className={pickerBadgeClass(isSelected)}>
                                    {cinema.district}
                                  </span>
                                </div>
                                {topMovie && (
                                  <p className="text-[10px] font-semibold text-app-muted pl-6 truncate">
                                    Bugün: {topMovie.title}
                                    {topMovie.times[0] ? ` · ${topMovie.times.slice(0, 3).join(", ")}` : ""}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {actId === "theater" && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1 flex-1">
                          {filteredTheaters.map((theater) => {
                            const theaterValue = `${theater.name} (${theater.district || "Kahramanmaraş"})`;
                            const isSelected = location === theaterValue;
                            return (
                              <button
                                key={theater.id}
                                type="button"
                                onClick={() => setLocation(theaterValue)}
                                className={`${pickerRowClass(isSelected)} flex items-center justify-between p-3`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-sm shrink-0">🎭</span>
                                  <span className="truncate">{theater.name}</span>
                                </div>
                                <span className={`${pickerBadgeClass(isSelected)} ml-2`}>
                                  {theater.district || "Maraş"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {(actId === "concert" || actId === "festival" || actId === "standup") && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1 flex-1">
                          {filteredEvents.map((event) => {
                            const eventValue = `${event.title} · ${event.location}`;
                            const isSelected = location === eventValue || location === event.location;
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => setLocation(eventValue)}
                                className={`${pickerRowClass(isSelected)} flex items-center justify-between p-3`}
                              >
                                <div className="flex items-center gap-2 truncate min-w-0">
                                  <span className="text-sm shrink-0">
                                    {event.kind === "concert" ? "🎵" : event.kind === "standup" ? "🎙️" : "🎪"}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="truncate block">{event.title}</span>
                                    <span className="text-[10px] font-semibold text-app-muted truncate block">{event.location}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] text-app-muted shrink-0 ml-2">{event.dateLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {(actId === "coffee" || actId === "tea") && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-48 pr-1 flex-1">
                          {filteredCafePlaces.map((place) => {
                            const placeValue = `${place.name} (${place.district || "Kahramanmaraş"})`;
                            const isSelected = location === placeValue;
                            return (
                              <button
                                key={place.id}
                                type="button"
                                onClick={() => setLocation(placeValue)}
                                className={`${pickerRowClass(isSelected)} flex items-center justify-between p-3`}
                              >
                                <span className="truncate">☕ {place.name}</span>
                                <span className="text-[10px] text-app-muted shrink-0 ml-2">{place.district}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {["food", "breakfast", "brunch", "lunch", "dinner", "dessert", "pizza", "burger", "sushi"].includes(actId) && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-48 pr-1 flex-1">
                          {filteredFoodPlaces.map((place) => {
                            const placeValue = `${place.name} (${place.district || "Kahramanmaraş"})`;
                            const isSelected = location === placeValue;
                            return (
                              <button
                                key={place.id}
                                type="button"
                                onClick={() => setLocation(placeValue)}
                                className={`${pickerRowClass(isSelected)} flex items-center justify-between p-3`}
                              >
                                <span className="truncate">🍽️ {place.name}</span>
                                <span className="text-[10px] text-app-muted shrink-0 ml-2">{place.district}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {actId === "card_game" && (
                        <div className="mt-2 space-y-1.5 overflow-y-auto max-h-60 pr-1 flex-1">
                          {filteredGames.map((game) => {
                            const gameValue = game.name_tr;
                            const isSelected = location === gameValue;
                            return (
                              <button
                                key={game.id}
                                type="button"
                                onClick={() => setLocation(gameValue)}
                                className={`${pickerRowClass(isSelected)} flex items-center justify-between p-3`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-sm shrink-0">🃏</span>
                                  <span className="truncate">{game.name_tr}</span>
                                </div>
                                <span className={`${pickerBadgeClass(isSelected)} ml-2`}>
                                  {game.minPlayers}-{game.maxPlayers} Oyuncu
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isStudyActivity && (
                        <div className="flex flex-col gap-2 min-h-0 flex-1">
                          {/* Map view wrapper */}
                          {filteredWorkplaces.some(w => w.latitude && w.longitude) && (
                            <div className="w-full h-40 rounded-xl overflow-hidden border border-app-border shrink-0 z-10">
                              <StudyPlacesMap
                                places={filteredWorkplaces}
                                onSelectPlace={(place) => setLocation(`${place.name} (${place.district || "Kahramanmaraş"})`)}
                                selectedPlaceId={workplacesList.find(w => `${w.name} (${w.district || "Kahramanmaraş"})` === location)?.id}
                              />
                            </div>
                          )}

                          {/* List view of matches */}
                          <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1 flex-1 mt-1">
                            {filteredWorkplaces.map((place) => {
                              const placeValue = `${place.name} (${place.district || "Kahramanmaraş"})`;
                              const isSelected = location === placeValue;
                              return (
                                <button
                                  key={place.id}
                                  type="button"
                                  onClick={() => setLocation(placeValue)}
                                className={`${pickerRowClass(isSelected)} flex items-center justify-between p-3 min-w-0`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-sm shrink-0">🏫</span>
                                    <span className="truncate">{place.name}</span>
                                  </div>
                                  <span className={`${pickerBadgeClass(isSelected)} ml-2`}>
                                    {place.district || "Çalışma Alanı"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-4 shrink-0">
                  <button
                    type="button"
                    onClick={confirmPresetLocation}
                    disabled={!location.trim()}
                    className={primaryBtnClass}
                    style={{ backgroundColor: NE_YAPSAK_ACCENT }}
                  >
                    Yeri Onayla
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 flex-1 overflow-y-auto flex flex-col">
                <div className={drawerHandleClass} />

                <header className="flex justify-between items-center mb-4 shrink-0">
                  <div>
                    <Drawer.Title className="font-black text-base text-app-text">Aktivite Seç</Drawer.Title>
                    <p className="text-[10px] text-app-muted font-medium mt-0.5">Ne yapmak istediğini seç</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPresetModal(false);
                      setPresetSearch("");
                    }}
                    className={iconBtnClass}
                  >
                    <X size={18} weight="bold" />
                  </button>
                </header>

                <div className="relative mb-3 shrink-0">
                  <input
                    type="text"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="Aktivite ara… (örn: Sinema, Kahve)"
                    className={fieldClass}
                  />
                  {presetSearch && (
                    <button
                      onClick={() => setPresetSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text text-[10px] font-bold"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                {presetSearch.trim() && (
                  <button
                    type="button"
                    onClick={() => pickActivityFromList({ id: "", label: presetSearch.trim(), icon: "✍️" })}
                    className={accentHighlightClass}
                  >
                    <div className="flex items-center gap-2">
                      <span>✍️</span>
                      <span>Özel: &quot;{presetSearch}&quot;</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: NE_YAPSAK_ACCENT }}>
                      Seç
                    </span>
                  </button>
                )}

                <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
                  {(() => {
                    const filteredData = ACTIVITIES_DATA.map((cat) => {
                      const items = cat.items.filter((item) =>
                        item.label.toLowerCase().includes(presetSearch.toLowerCase())
                      );
                      return { ...cat, items };
                    }).filter((cat) => cat.items.length > 0);

                    if (filteredData.length === 0) {
                      return (
                        <div className="py-12 text-center">
                          <p className="text-sm font-bold text-app-muted">Aradığın aktivite bulunamadı.</p>
                          {presetSearch.trim() && (
                            <button
                              type="button"
                              onClick={() => pickActivityFromList({ id: "", label: presetSearch.trim(), icon: "✍️" })}
                              className="mt-3 text-xs font-black hover:underline"
                              style={{ color: NE_YAPSAK_ACCENT }}
                            >
                              &quot;{presetSearch}&quot; olarak ekle
                            </button>
                          )}
                        </div>
                      );
                    }

                    return filteredData.map((cat) => {
                      const isSearching = presetSearch.trim() !== "";
                      const isExpanded = expandedCategories[cat.category] || false;
                      const visibleItems = isExpanded || isSearching ? cat.items : cat.items.slice(0, 4);

                      return (
                        <div key={cat.category} className="space-y-2">
                          <h4 className={sectionLabelClass}>{cat.category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {visibleItems.map((item) => {
                              const isSelected = selectedPresetId === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => pickActivityFromList(item)}
                                  className={pickerItemClass(isSelected)}
                                >
                                  <span className="text-lg shrink-0">{item.icon}</span>
                                  <span className="truncate flex-1">{item.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {cat.items.length > 4 && !isSearching && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedCategories((prev) => ({
                                  ...prev,
                                  [cat.category]: !isExpanded,
                                }));
                              }}
                              className="w-full text-center py-2 text-[10px] font-black uppercase tracking-wider text-app-muted hover:text-app-text transition-colors cursor-pointer mt-1 active:scale-95 hover:underline"
                            >
                              {isExpanded ? "Daha Az" : `Daha Fazla (+${cat.items.length - 4})`}
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-none">
          <div className={`p-4 rounded-2xl border text-sm font-bold shadow-lg flex items-center justify-center text-center ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatePlanPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-app-bg">
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={32} className="animate-spin" style={{ color: NE_YAPSAK_ACCENT }} />
        </main>
      </div>
    }>
      <CreatePlanContent />
    </Suspense>
  );
}
