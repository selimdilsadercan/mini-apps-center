import { Local } from "@/lib/client";
import type { TUSPlacement } from "../data/placements_data";

const API_BASE = Local;

export interface SavedChoiceItem {
  id: string;
  userId: string;
  placementId: string;
  sortOrder: number;
  note: string;
  createdAt: string;
  placement?: TUSPlacement;
}

async function apiCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const tusApi = {
  getSavedChoices: (userId: string) =>
    apiCall<{ items: SavedChoiceItem[] }>("GET", `/tus/saved?userId=${encodeURIComponent(userId)}`),

  addSavedChoice: (userId: string, placementId: string, note?: string) =>
    apiCall<{ success: boolean }>("POST", "/tus/saved/add", { userId, placementId, note }),

  removeSavedChoice: (userId: string, placementId: string) =>
    apiCall<{ success: boolean }>("POST", "/tus/saved/remove", { userId, placementId }),

  reorderSavedChoices: (userId: string, placementIds: string[]) =>
    apiCall<{ success: boolean }>("POST", "/tus/saved/reorder", { userId, placementIds }),
};
