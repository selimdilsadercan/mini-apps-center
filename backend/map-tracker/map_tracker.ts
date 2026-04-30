import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("map-tracker", {
  migrations: "./migrations",
});

interface GetDataResponse {
  lists: any[];
  items: any[];
}

// Fetch all data
export const getData = api(
  { expose: true, method: "GET", path: "/map-tracker/data" },
  async (): Promise<GetDataResponse> => {
    const result = await db.queryRow`SELECT map_tracker.get_data() as data`;
    return result?.data || { lists: [], items: [] };
  }
);

// Toggle visited status
export const toggleVisited = api(
  { expose: true, method: "POST", path: "/map-tracker/toggle/:id" },
  async (params: { id: string }): Promise<void> => {
    await db.exec`SELECT map_tracker.toggle_visited(${params.id})`;
  }
);

interface ImportRequest {
  listName: string;
  items: {
    name: string;
    address?: string;
    google_maps_url?: string;
    latitude?: number;
    longitude?: number;
    note?: string;
    metadata?: any;
  }[];
}

// Bulk import items
export const importItems = api(
  { expose: true, method: "POST", path: "/map-tracker/import" },
  async (req: ImportRequest): Promise<void> => {
    await db.exec`SELECT map_tracker.import_items(${req.listName}, ${JSON.stringify(req.items)})`;
  }
);
