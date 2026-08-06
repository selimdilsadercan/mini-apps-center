"use client";

import { Clock, MapPin, SkipForward, Sparkle, Spinner } from "@phosphor-icons/react";
import type { friendship } from "@/lib/client";
import {
  fieldClass,
  friendChipClass,
  innerLabelClass,
  modeChipClass,
  NE_YAPSAK_ACCENT,
  PLAN_OPEN_LOCATION,
  PLAN_OPEN_TIME,
  planCardClass,
  planCardInnerClass,
  primaryBtnClass,
  sectionLabelClass,
  segmentedItemClass,
  segmentedWrapClass,
} from "../lib/theme";
import { ActivityDetailFields } from "./ActivityDetailFields";
import type { MoviePlanDetail } from "../lib/activity-detail";
import type { MarasCinema, MarasEventOption } from "../lib/maras-sources";

export type WhatMode = "open" | "fixed";
export type FieldMode = "open" | "fixed";

const PRESET_TIMES = [
  { id: "now", label: "Şimdi" },
  { id: "30mins", label: "30 dk sonra" },
  { id: "evening", label: "Bugün akşam" },
  { id: "tomorrow", label: "Yarın" },
  { id: "weekend", label: "Hafta sonu" },
  { id: "custom", label: "Özel saat" },
];

export interface PlanCreateFormProps {
  friends: friendship.FriendUser[];
  loading: boolean;
  whatMode: WhatMode;
  setWhatMode: (m: WhatMode) => void;
  whereMode: FieldMode;
  setWhereMode: (m: FieldMode) => void;
  whenMode: FieldMode;
  setWhenMode: (m: FieldMode) => void;
  selectedPresetLabel: string | null;
  selectedPresetIcon: string;
  selectedPresetId: string | null;
  activityDetail: string;
  setActivityDetail: (v: string) => void;
  movieDetail: MoviePlanDetail | null;
  onMovieDetailChange: (detail: MoviePlanDetail | null) => void;
  cinemas: MarasCinema[];
  cinemasLoading: boolean;
  events: MarasEventOption[];
  onEventPick: (event: MarasEventOption) => void;
  location: string;
  selectedTimeId: string;
  setSelectedTimeId: (id: string) => void;
  customTime: string;
  setCustomTime: (v: string) => void;
  selectedFriendIds: string[];
  onToggleFriend: (id: string) => void;
  onSelectAllFriends: () => void;
  onOpenActivityPicker: () => void;
  onOpenLocationPicker: () => void;
  onSubmit: (e: React.FormEvent) => void;
  canSubmit: boolean;
}

export function PlanCreateForm({
  friends,
  loading,
  whatMode,
  setWhatMode,
  whereMode,
  setWhereMode,
  whenMode,
  setWhenMode,
  selectedPresetLabel,
  selectedPresetIcon,
  selectedPresetId,
  activityDetail,
  setActivityDetail,
  movieDetail,
  onMovieDetailChange,
  cinemas,
  cinemasLoading,
  events,
  onEventPick,
  location,
  selectedTimeId,
  setSelectedTimeId,
  customTime,
  setCustomTime,
  selectedFriendIds,
  onToggleFriend,
  onSelectAllFriends,
  onOpenActivityPicker,
  onOpenLocationPicker,
  onSubmit,
  canSubmit,
}: PlanCreateFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Ne yapalım — tek kart */}
      <section className={planCardClass}>
        <label className={sectionLabelClass}>Ne yapalım?</label>

        <div className={segmentedWrapClass}>
          <button type="button" onClick={() => setWhatMode("open")} className={segmentedItemClass(whatMode === "open")}>
            <SkipForward size={12} weight="bold" />
            Sonra karar
          </button>
          <button type="button" onClick={() => setWhatMode("fixed")} className={segmentedItemClass(whatMode === "fixed")}>
            <Sparkle size={12} weight="fill" />
            Aktivite seç
          </button>
        </div>

        {whatMode === "open" ? (
          <p className="text-[10px] text-app-muted font-medium leading-relaxed">
            Arkadaşların plana seçenek ekleyip birlikte karar verebilir.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={onOpenActivityPicker}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-app-surface-muted/70 text-left transition-all cursor-pointer active:scale-[0.99] ring-1 ring-app-border hover:ring-[#FF5252]/20"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg shrink-0">{selectedPresetLabel ? selectedPresetIcon : "🔍"}</span>
                <span className="text-xs font-black text-app-text truncate">
                  {selectedPresetLabel || "Aktivite seç…"}
                </span>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider shrink-0" style={{ color: NE_YAPSAK_ACCENT }}>
                {selectedPresetLabel ? "Değiştir" : "Seç"}
              </span>
            </button>

            {selectedPresetLabel && (
              <div className={planCardInnerClass}>
                <span className={innerLabelClass}>Detay (isteğe bağlı)</span>
                <ActivityDetailFields
                  presetId={selectedPresetId}
                  activityDetail={activityDetail}
                  setActivityDetail={setActivityDetail}
                  movieDetail={movieDetail}
                  onMovieDetailChange={onMovieDetailChange}
                  cinemas={cinemas}
                  cinemasLoading={cinemasLoading}
                  events={events}
                  onEventPick={onEventPick}
                />
              </div>
            )}
          </>
        )}
      </section>

      <section className={planCardClass}>
        <label className={sectionLabelClass}>Nerede?</label>
        <div className={segmentedWrapClass}>
          <button type="button" onClick={() => setWhereMode("open")} className={segmentedItemClass(whereMode === "open")}>
            <SkipForward size={12} weight="bold" />
            Sonra karar
          </button>
          <button type="button" onClick={() => setWhereMode("fixed")} className={segmentedItemClass(whereMode === "fixed")}>
            <MapPin size={12} weight="fill" />
            Yer seç
          </button>
        </div>

        {whereMode === "open" ? (
          <p className="text-[10px] text-app-muted font-medium">{PLAN_OPEN_LOCATION}</p>
        ) : (
          <button
            type="button"
            onClick={onOpenLocationPicker}
            className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-app-surface-muted/70 text-left ring-1 ring-app-border hover:ring-[#FF5252]/20 transition-all cursor-pointer"
          >
            <MapPin size={15} style={{ color: NE_YAPSAK_ACCENT }} className="shrink-0" />
            <span className="text-xs font-bold text-app-text truncate flex-1">
              {location.trim() || "Mekan / sinema / adres seç…"}
            </span>
          </button>
        )}
      </section>

      <section className={planCardClass}>
        <label className={sectionLabelClass}>Ne zaman?</label>
        <div className={segmentedWrapClass}>
          <button type="button" onClick={() => setWhenMode("open")} className={segmentedItemClass(whenMode === "open")}>
            <SkipForward size={12} weight="bold" />
            Sonra karar
          </button>
          <button type="button" onClick={() => setWhenMode("fixed")} className={segmentedItemClass(whenMode === "fixed")}>
            <Clock size={12} weight="fill" />
            Zaman seç
          </button>
        </div>

        {whenMode === "open" ? (
          <p className="text-[10px] text-app-muted font-medium">{PLAN_OPEN_TIME}</p>
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TIMES.map((time) => (
                <button
                  key={time.id}
                  type="button"
                  onClick={() => setSelectedTimeId(time.id)}
                  className={modeChipClass(selectedTimeId === time.id)}
                >
                  {time.label}
                </button>
              ))}
            </div>
            {selectedTimeId === "custom" && (
              <input
                type="text"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="Örn: Cumartesi 19:30"
                className={`${fieldClass} bg-app-surface-muted/60 border-0 ring-1 ring-app-border`}
              />
            )}
          </div>
        )}
      </section>

      <section className={planCardClass}>
        <div className="flex items-center justify-between">
          <div>
            <label className={sectionLabelClass}>Kimlerle?</label>
            <p className="text-[10px] text-app-muted font-medium mt-0.5">İsteğe bağlı — sonra da davet edebilirsin</p>
          </div>
          {friends.length > 0 && (
            <button
              type="button"
              onClick={onSelectAllFriends}
              className="text-[9px] font-black uppercase tracking-wider hover:underline"
              style={{ color: NE_YAPSAK_ACCENT }}
            >
              {selectedFriendIds.length === friends.length ? "Temizle" : "Hepsini seç"}
            </button>
          )}
        </div>

        {friends.length === 0 ? (
          <p className="text-[10px] text-app-muted font-medium">
            Arkadaş listen boş — yine de planı oluşturup sonra paylaşabilirsin.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {friends.map((friend) => {
              const isSelected = selectedFriendIds.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => onToggleFriend(friend.id)}
                  className={friendChipClass(isSelected)}
                  style={isSelected ? { backgroundColor: `${NE_YAPSAK_ACCENT}12` } : undefined}
                >
                  <div className="w-7 h-7 rounded-lg bg-app-surface-muted border border-app-border overflow-hidden flex items-center justify-center shrink-0 text-sm">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <span className="truncate flex-1">{friend.username || "Anonim"}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className={primaryBtnClass}
        style={{ backgroundColor: NE_YAPSAK_ACCENT }}
      >
        {loading ? <Spinner size={18} className="animate-spin" /> : "Planı Paylaş"}
      </button>
    </form>
  );
}
