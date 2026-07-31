export const PRESET_TIMES = [
  { id: "now", label: "Şimdi" },
  { id: "30mins", label: "30 dk sonra" },
  { id: "evening", label: "Bugün akşam" },
  { id: "tomorrow", label: "Yarın" },
  { id: "custom", label: "Özel saat" },
] as const;

export type PresetTimeId = (typeof PRESET_TIMES)[number]["id"];

export function formatWhenSuggestion(timeId: string, customTime: string): string {
  if (timeId === "custom") return customTime.trim();
  return PRESET_TIMES.find((t) => t.id === timeId)?.label || customTime.trim();
}
