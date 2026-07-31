import ACTIVITIES_DATA from "../activities.json";
import { DEFAULT_LOCATION_ACTIVITY } from "./location-picker-config";
import { PLAN_OPEN_WHAT } from "./plan-poll";
import type { ActivityPreset } from "../components/pickers/ActivityPickerDrawer";

const ALL_PRESETS = ACTIVITIES_DATA.flatMap((c) => c.items);

export function inferActivityContext(title: string): ActivityPreset {
  if (title === PLAN_OPEN_WHAT) return DEFAULT_LOCATION_ACTIVITY;
  const match = ALL_PRESETS.find(
    (p) => title === p.label || title.startsWith(`${p.label} ·`) || title.startsWith(p.label)
  );
  if (match) return { id: match.id, label: match.label, icon: match.icon };
  return { id: "", label: title, icon: "✨" };
}
