import type { kim_gelir } from "@/lib/client";
import { PLAN_OPEN_LOCATION, PLAN_OPEN_TIME } from "./theme";

export const PLAN_OPEN_WHAT = "Ne yapalım?";

export type PlanAxis = "what" | "where" | "when";

const AXIS_PREFIX: Record<PlanAxis, string> = {
  what: "kg:what:",
  where: "kg:where:",
  when: "kg:when:",
};

export function encodePollOption(axis: PlanAxis, value: string): string {
  return `${AXIS_PREFIX[axis]}${value.trim()}`;
}

export function parsePollOption(opt: string): { axis: PlanAxis; value: string } | null {
  for (const axis of Object.keys(AXIS_PREFIX) as PlanAxis[]) {
    const prefix = AXIS_PREFIX[axis];
    if (opt.startsWith(prefix)) {
      return { axis, value: opt.slice(prefix.length) };
    }
  }
  if (opt.trim()) return { axis: "what", value: opt };
  return null;
}

export function whatIsOpen(activity: kim_gelir.Activity): boolean {
  return activity.title === PLAN_OPEN_WHAT;
}

export function whereIsOpen(activity: kim_gelir.Activity): boolean {
  return activity.location === PLAN_OPEN_LOCATION;
}

export function whenIsOpen(activity: kim_gelir.Activity): boolean {
  return activity.timeOption === PLAN_OPEN_TIME;
}

export function formatWhenFixed(activity: kim_gelir.Activity): string {
  if (whenIsOpen(activity)) return PLAN_OPEN_TIME;
  return activity.customTime
    ? `${activity.timeOption} · ${activity.customTime}`
    : activity.timeOption;
}

export interface AxisPollItem {
  encoded: string;
  value: string;
  voters: kim_gelir.ActivityInvite[];
}

export function getAxisPollItems(
  activity: kim_gelir.Activity,
  axis: PlanAxis
): AxisPollItem[] {
  const seen = new Set<string>();
  const items: AxisPollItem[] = [];

  for (const opt of activity.options) {
    const parsed = parsePollOption(opt);
    if (!parsed || parsed.axis !== axis) continue;
    const encoded = encodePollOption(axis, parsed.value);
    if (seen.has(encoded)) continue;
    seen.add(encoded);
    items.push({
      encoded,
      value: parsed.value,
      voters: activity.responses.filter((r) => r.selectedOptions?.includes(encoded)),
    });
  }

  return items;
}

export const AXIS_META: Record<
  PlanAxis,
  { label: string; placeholder: string; openHint: string }
> = {
  what: {
    label: "Ne yapalım?",
    placeholder: "Örn: Sinema, kahve…",
    openHint: "Aktivite öner, diğerleri görsün",
  },
  where: {
    label: "Nerede?",
    placeholder: "Örn: Paribu Cineverse, Kafe…",
    openHint: "Mekan öner",
  },
  when: {
    label: "Ne zaman?",
    placeholder: "Örn: Bugün 19:30, Cumartesi…",
    openHint: "Zaman öner",
  },
};
