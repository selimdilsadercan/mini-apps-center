import { createBrowserClient } from "@/lib/api";
import { gaming_hub } from "@/lib/client";
import { getErrorMessage, isUnauthenticatedError } from "@/lib/api-error-handler";

interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

export async function getLibraryAction(
  clerkId: string
): Promise<ActionResponse<gaming_hub.LibraryItem[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.gaming_hub.getUserLibrary({ userId: clerkId });
    return { data: response.items ?? [], error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function upsertLibraryItemAction(
  params: gaming_hub.UpsertLibraryRequest
): Promise<ActionResponse<string>> {
  try {
    const client = createBrowserClient();
    const response = await client.gaming_hub.upsertLibraryItem(params);
    return { data: response.itemId, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteLibraryItemAction(
  clerkId: string,
  itemId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.gaming_hub.deleteLibraryItem(itemId, clerkId);
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function discoverGamesAction(
  mode: "coop" | "popular",
  limit = 20
): Promise<ActionResponse<gaming_hub.CatalogGame[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.gaming_hub.discoverGames({ mode, limit });
    return { data: response.games ?? [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function searchGamesAction(
  title: string,
  limit = 8
): Promise<ActionResponse<gaming_hub.CatalogGame[]>> {
  try {
    if (!title.trim()) return { data: [], error: null };
    const client = createBrowserClient();
    const response = await client.gaming_hub.searchCatalogGames({ title, limit });
    return { data: response.games ?? [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getDailyTaskAction(
  clerkId: string
): Promise<ActionResponse<gaming_hub.DailyTask | null>> {
  try {
    const client = createBrowserClient();
    const response = await client.gaming_hub.getDailyTask({ userId: clerkId });
    return { data: response.task, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function setDailyTaskAction(params: {
  userId: string;
  gameName: string;
  igdbId?: string;
  coverUrl?: string;
  goalMinutes?: number;
}): Promise<ActionResponse<string>> {
  try {
    const client = createBrowserClient();
    const response = await client.gaming_hub.setDailyTask(params);
    return { data: response.taskId, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function completeDailyTaskAction(
  clerkId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.gaming_hub.completeDailyTask({ userId: clerkId });
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
