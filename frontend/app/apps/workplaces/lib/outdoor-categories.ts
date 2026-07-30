import {
  Anchor,
  Car,
  Compass,
  Snowflake,
  Target,
  Tent,
  Waves,
} from "@phosphor-icons/react";

export interface OutdoorCategoryConfig {
  id: string;
  name: string;
  actionLabel: string;
  icon: typeof Compass;
  color: string;
}

export const OUTDOOR_CATEGORIES: OutdoorCategoryConfig[] = [
  { id: "horse-riding", name: "At Binme", actionLabel: "Ata Binmeye Git", icon: Compass, color: "#8B5A2B" },
  { id: "canoeing", name: "Kano Sürme", actionLabel: "Kano Yapmaya Git", icon: Waves, color: "#00aeef" },
  { id: "skiing", name: "Kayak Yapma", actionLabel: "Kayak Yapmaya Git", icon: Snowflake, color: "#3B82F6" },
  { id: "camping", name: "Kamp Yapma", actionLabel: "Kampa Git", icon: Tent, color: "#10B981" },
  { id: "lasertag", name: "Lasertag", actionLabel: "Lasertag Oynamaya Git", icon: Target, color: "#EF4444" },
  { id: "paintball", name: "Paintball", actionLabel: "Paintball Oynamaya Git", icon: Target, color: "#EF4444" },
  { id: "diving", name: "Dalışçılık", actionLabel: "Dalış Yapmaya Git", icon: Anchor, color: "#845EF7" },
  { id: "gokart", name: "Gokart", actionLabel: "Gokart Sürmeye Git", icon: Car, color: "#F59E0B" },
];

export function getOutdoorCategory(categoryId?: string | null) {
  if (!categoryId) return undefined;
  return OUTDOOR_CATEGORIES.find((c) => c.id === categoryId);
}
