import type { FocusEvent, KeyboardEvent, MouseEvent } from "react";

export function selectInputOnFocus(event: FocusEvent<HTMLInputElement>) {
  event.currentTarget.select();
}

export function selectInputOnClick(event: MouseEvent<HTMLInputElement>) {
  event.currentTarget.select();
}

export function handleVerticalSetInputTab(
  event: KeyboardEvent<HTMLInputElement>,
  {
    exIdx,
    setIdx,
    field,
    totalSets,
  }: {
    exIdx: number;
    setIdx: number;
    field: "weightKg" | "reps";
    totalSets: number;
  }
) {
  if (event.key !== "Tab") return;

  const delta = event.shiftKey ? -1 : 1;
  const nextSetIdx = setIdx + delta;
  if (nextSetIdx < 0 || nextSetIdx >= totalSets) return;

  const root = event.currentTarget.closest("[data-set-table]");
  if (!root) return;

  const next = root.querySelector<HTMLInputElement>(
    `[data-ex-idx="${exIdx}"][data-set-idx="${nextSetIdx}"][data-set-field="${field}"]`
  );
  if (!next) return;

  event.preventDefault();
  next.focus();
}
