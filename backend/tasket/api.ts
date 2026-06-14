import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

export interface TasketList {
  id: string;
  clerkId: string;
  name: string;
  content: any;
  color: string | null;
  icon: string | null;
  createdAt: string;
}

export interface TasketItem {
  id: string;
  clerkId: string;
  listId: string | null;
  title: string | null;
  content: string | null;
  isCompleted: boolean;
  itemType: "note" | "task";
  color: string | null;
  reminderAt: string | null;
  assignee: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DbTaskList {
  id: string;
  clerk_id: string;
  name: string;
  content: any;
  color: string | null;
  icon: string | null;
  created_at: string;
}

interface DbTaskItem {
  id: string;
  clerk_id: string;
  list_id: string | null;
  title: string | null;
  content: string | null;
  is_completed: boolean;
  item_type: "note" | "task";
  color: string | null;
  reminder_at: string | null;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

function mapList(row: DbTaskList): TasketList {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    name: row.name,
    content: row.content,
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
  };
}

function mapItem(row: DbTaskItem): TasketItem {
  return {
    id: row.id,
    clerkId: row.clerk_id,
    listId: row.list_id,
    title: row.title,
    content: row.content,
    isCompleted: row.is_completed,
    itemType: row.item_type,
    color: row.color,
    reminderAt: row.reminder_at,
    assignee: row.assignee,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface GetDataRequest {
  userId: string;
}

interface GetDataResponse {
  lists: TasketList[];
  items: TasketItem[];
}

export const getData = api(
  { expose: true, method: "GET", path: "/tasket/data/:userId" },
  async ({ userId }: GetDataRequest): Promise<GetDataResponse> => {
    const { data, error } = await supabase.schema("tasket").rpc("get_data", {
      clerk_id_param: userId,
    });

    if (error) {
      throw APIError.internal(`Failed to load tasket data: ${error.message}`);
    }

    const res = data as { lists: DbTaskList[]; items: DbTaskItem[] };
    return {
      lists: (res.lists ?? []).map(mapList),
      items: (res.items ?? []).map(mapItem),
    };
  },
);

interface UpsertListRequest {
  id?: string;
  userId: string;
  name: string;
  content?: any;
  color?: string;
  icon?: string;
}

interface UpsertListResponse {
  list: TasketList;
}

function extractTasks(content: any): any[] {
  const tasks: any[] = [];
  
  function traverse(node: any) {
    if (!node) return;
    
    if (node.type === 'taskItem') {
      // Find the paragraph inside taskItem to get the text
      const paragraph = node.content?.find((c: any) => c.type === 'paragraph');
      const title = paragraph?.content?.map((c: any) => c.text).join('') || '';
      
      tasks.push({
        id: node.attrs?.id,
        title,
        isCompleted: node.attrs?.checked || false,
        assignee: node.attrs?.assignee || null,
        dueDate: node.attrs?.dueDate || null,
      });
    }
    
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  if (content) {
    traverse(content);
  }
  
  return tasks;
}

export const upsertList = api(
  { expose: true, method: "POST", path: "/tasket/lists" },
  async (params: UpsertListRequest): Promise<UpsertListResponse> => {
    const { data, error } = await supabase.schema("tasket").rpc("upsert_list", {
      id_param: params.id ?? null,
      clerk_id_param: params.userId,
      name_param: params.name,
      content_param: params.content ?? null,
      color_param: params.color ?? null,
      icon_param: params.icon ?? null,
    });

    if (error) {
      throw APIError.internal(`Failed to save list: ${error.message}`);
    }

    const list = (data as DbTaskList[] | null)?.[0];
    if (!list) {
      throw APIError.internal("Failed to save list");
    }

    // Sync tasks to tasket.items table
    if (params.content) {
      const extractedTasks = extractTasks(params.content);
      const listId = list.id;
      
      // 1. Get current items for this list to know what to delete
      const { data: existingItems } = await supabase
        .schema("tasket")
        .from("items")
        .select("id")
        .eq("list_id", listId);
      
      const existingIds = (existingItems || []).map(item => item.id);
      const extractedIds = extractedTasks.map(task => task.id).filter(Boolean);
      
      // 2. Delete items that are no longer in the content
      const idsToDelete = existingIds.filter(id => !extractedIds.includes(id));
      if (idsToDelete.length > 0) {
        await supabase
          .schema("tasket")
          .from("items")
          .delete()
          .in("id", idsToDelete);
      }
      
      // 3. Upsert extracted tasks
      if (extractedTasks.length > 0) {
        const itemsToUpsert = extractedTasks.map(task => ({
          id: task.id || undefined,
          clerk_id: params.userId,
          list_id: listId,
          title: task.title,
          is_completed: task.isCompleted,
          item_type: "task",
          assignee: task.assignee,
          due_date: task.dueDate,
          updated_at: new Date().toISOString(),
        }));
        
        await supabase
          .schema("tasket")
          .from("items")
          .upsert(itemsToUpsert);
      }
    }

    return { list: mapList(list) };
  },
);

interface UpsertItemRequest {
  id?: string;
  userId: string;
  listId?: string;
  title?: string;
  content?: string;
  isCompleted?: boolean;
  itemType?: "note" | "task";
  color?: string;
  reminderAt?: string;
}

interface UpsertItemResponse {
  item: TasketItem;
}

export const upsertItem = api(
  { expose: true, method: "POST", path: "/tasket/items" },
  async (params: UpsertItemRequest): Promise<UpsertItemResponse> => {
    const { data, error } = await supabase.schema("tasket").rpc("upsert_item", {
      id_param: params.id ?? null,
      clerk_id_param: params.userId,
      list_id_param: params.listId ?? null,
      title_param: params.title ?? null,
      content_param: params.content ?? null,
      is_completed_param: params.isCompleted ?? false,
      item_type_param: params.itemType ?? "task",
      color_param: params.color ?? null,
      reminder_at_param: params.reminderAt ?? null,
    });

    if (error) {
      throw APIError.internal(`Failed to save item: ${error.message}`);
    }

    const item = (data as DbTaskItem[] | null)?.[0];
    if (!item) {
      throw APIError.internal("Failed to save item");
    }

    return { item: mapItem(item) };
  },
);

interface DeleteListRequest {
  id: string;
  userId: string;
}

interface DeleteListResponse {
  success: boolean;
}

export const deleteList = api(
  { expose: true, method: "DELETE", path: "/tasket/lists/:id/:userId" },
  async ({ id, userId }: DeleteListRequest): Promise<DeleteListResponse> => {
    const { data, error } = await supabase.schema("tasket").rpc("delete_list", {
      id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      throw APIError.internal(`Failed to delete list: ${error.message}`);
    }

    return { success: !!data };
  },
);

interface DeleteItemRequest {
  id: string;
  userId: string;
}

interface DeleteItemResponse {
  success: boolean;
}

export const deleteItem = api(
  { expose: true, method: "DELETE", path: "/tasket/items/:id/:userId" },
  async ({ id, userId }: DeleteItemRequest): Promise<DeleteItemResponse> => {
    const { data, error } = await supabase.schema("tasket").rpc("delete_item", {
      id_param: id,
      clerk_id_param: userId,
    });

    if (error) {
      throw APIError.internal(`Failed to delete item: ${error.message}`);
    }

    return { success: !!data };
  },
);
