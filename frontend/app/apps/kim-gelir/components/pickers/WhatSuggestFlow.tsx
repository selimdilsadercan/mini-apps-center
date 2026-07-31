"use client";

import { useState } from "react";
import { CaretLeft, X } from "@phosphor-icons/react";
import { Drawer } from "vaul";
import { ActivityDetailFields } from "../ActivityDetailFields";
import {
  buildDetailedTitle,
  getEventKindsForPreset,
  isMoviePreset,
  type MoviePlanDetail,
} from "../../lib/activity-detail";
import type { MarasEventOption } from "../../lib/maras-sources";
import type { useMarasSources } from "../../hooks/useMarasSources";
import {
  drawerHandleClass,
  fieldClass,
  iconBtnClass,
  NE_YAPSAK_ACCENT,
  planCardInnerClass,
  primaryBtnClass,
  sectionLabelClass,
} from "../../lib/theme";
import { ActivityPickerDrawer, type ActivityPreset } from "./ActivityPickerDrawer";

type MarasSources = ReturnType<typeof useMarasSources>;

function needsDetailStep(preset: ActivityPreset, maras: MarasSources): boolean {
  if (!preset.id) return false;
  if (isMoviePreset(preset.id) && maras.cinemas.some((c) => c.moviesToday.length > 0)) return true;
  return !!getEventKindsForPreset(preset.id);
}

export interface WhatSuggestFlowProps {
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  maras: MarasSources;
  onConfirm: (displayValue: string) => void;
}

export function WhatSuggestFlow({
  pickerOpen,
  onPickerOpenChange,
  maras,
  onConfirm,
}: WhatSuggestFlowProps) {
  const [preset, setPreset] = useState<ActivityPreset | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activityDetail, setActivityDetail] = useState("");
  const [movieDetail, setMovieDetail] = useState<MoviePlanDetail | null>(null);

  const resetDetail = () => {
    setPreset(null);
    setActivityDetail("");
    setMovieDetail(null);
    setDetailOpen(false);
  };

  const handlePresetPick = (item: ActivityPreset) => {
    onPickerOpenChange(false);
    if (needsDetailStep(item, maras)) {
      setPreset(item);
      setActivityDetail("");
      setMovieDetail(null);
      setDetailOpen(true);
      return;
    }
    onConfirm(`${item.icon} ${item.label}`);
  };

  const handleConfirmDetail = () => {
    if (!preset) return;
    const label = buildDetailedTitle(preset.label, activityDetail, movieDetail);
    onConfirm(`${preset.icon} ${label}`);
    resetDetail();
  };

  const movieNeedsSession =
    preset &&
    isMoviePreset(preset.id) &&
    maras.cinemas.some((c) => c.moviesToday.length > 0) &&
    !movieDetail?.sessionTime;

  return (
    <>
      <ActivityPickerDrawer
        open={pickerOpen}
        onOpenChange={onPickerOpenChange}
        onSelect={handlePresetPick}
        title="Aktivite Öner"
        subtitle="Listeden seç veya ara"
      />

      <Drawer.Root
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) resetDetail();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]" />
          <Drawer.Content className="bg-app-surface rounded-t-[2rem] fixed bottom-0 left-0 right-0 max-h-[85vh] outline-none z-[90] max-w-xl mx-auto border-t border-app-border shadow-2xl">
            <div className="p-5 overflow-y-auto">
              <div className={drawerHandleClass} />
              {preset && (
                <>
                  <header className="flex items-center gap-2 mb-4">
                    <button type="button" onClick={() => setDetailOpen(false)} className={iconBtnClass}>
                      <CaretLeft size={20} weight="bold" />
                    </button>
                    <Drawer.Title className="font-black text-base text-app-text">Detay ekle</Drawer.Title>
                    <button type="button" onClick={() => setDetailOpen(false)} className={`${iconBtnClass} ml-auto`}>
                      <X size={18} weight="bold" />
                    </button>
                  </header>
                  <div className={`${fieldClass} flex items-center gap-2.5 mb-4`}>
                    <span className="text-lg">{preset.icon}</span>
                    <span className="text-sm font-black">{preset.label}</span>
                  </div>
                  <div className={planCardInnerClass}>
                    <span className={sectionLabelClass}>Detay</span>
                    <ActivityDetailFields
                      presetId={preset.id || null}
                      activityDetail={activityDetail}
                      setActivityDetail={setActivityDetail}
                      movieDetail={movieDetail}
                      onMovieDetailChange={setMovieDetail}
                      cinemas={maras.cinemas}
                      cinemasLoading={maras.loading}
                      events={maras.events}
                      onEventPick={(event: MarasEventOption) => setActivityDetail(event.title)}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!!movieNeedsSession}
                    onClick={handleConfirmDetail}
                    className={`${primaryBtnClass} mt-4`}
                    style={{ backgroundColor: NE_YAPSAK_ACCENT }}
                  >
                    Öneriyi Ekle
                  </button>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
