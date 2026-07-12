import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  myRole: "owner" | "member";
  createdAt: string;
}

export interface BoardMember {
  userId: string;
  clerkId: string;
  username: string | null;
  avatarUrl: string | null;
  role: "owner" | "member";
}

export interface WeekAssignment {
  id: string;
  dayOfWeek: number;
  choreSlug: string;
  choreName: string;
  choreIcon: string | null;
  assigneeId: string;
  assigneeClerkId: string;
  assigneeUsername: string | null;
  assigneeAvatarUrl: string | null;
  completedAt: string | null;
  completedBy: string | null;
}

export interface BoardInviteDetails {
  boardId: string;
  boardName: string;
  creatorUsername: string | null;
  isExpired: boolean;
}

// ==================== HELPERS ====================

function mapBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    name: row.name as string,
    ownerId: row.owner_id as string,
    memberCount: Number(row.member_count ?? 0),
    myRole: (row.my_role as Board["myRole"]) || "member",
    createdAt: row.created_at as string,
  };
}

function mapMember(row: Record<string, unknown>): BoardMember {
  return {
    userId: row.user_id as string,
    clerkId: row.clerk_id as string,
    username: (row.username as string) || null,
    avatarUrl: (row.avatar_url as string) || null,
    role: (row.role as BoardMember["role"]) || "member",
  };
}

function mapAssignment(row: Record<string, unknown>): WeekAssignment {
  return {
    id: row.id as string,
    dayOfWeek: Number(row.day_of_week),
    choreSlug: row.chore_slug as string,
    choreName: row.chore_name as string,
    choreIcon: (row.chore_icon as string) || null,
    assigneeId: row.assignee_id as string,
    assigneeClerkId: row.assignee_clerk_id as string,
    assigneeUsername: (row.assignee_username as string) || null,
    assigneeAvatarUrl: (row.assignee_avatar_url as string) || null,
    completedAt: (row.completed_at as string) || null,
    completedBy: (row.completed_by as string) || null,
  };
}

// ==================== API ENDPOINTS ====================

export const getBoards = api(
  { expose: true, method: "GET", path: "/ev-isleri/boards/:userId" },
  async ({ userId }: { userId: string }): Promise<{ boards: Board[] }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("get_boards", {
      p_clerk_id: userId,
    });

    if (error) {
      console.error("getBoards error:", error);
      throw APIError.internal("Board listesi yüklenemedi");
    }

    return { boards: (data as Record<string, unknown>[] || []).map(mapBoard) };
  }
);

export const createBoard = api(
  { expose: true, method: "POST", path: "/ev-isleri/board" },
  async (req: { userId: string; name: string }): Promise<{ board: Board }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("create_board", {
      p_clerk_id: req.userId,
      p_name: req.name,
    });

    if (error) {
      console.error("createBoard error:", error);
      throw APIError.internal("Board oluşturulamadı");
    }

    const row = data as Record<string, unknown>;
    return {
      board: {
        id: row.id as string,
        name: row.name as string,
        ownerId: row.owner_id as string,
        memberCount: 1,
        myRole: "owner",
        createdAt: row.created_at as string,
      },
    };
  }
);

export const getBoard = api(
  { expose: true, method: "GET", path: "/ev-isleri/board/:boardId/:userId" },
  async ({
    boardId,
    userId,
  }: {
    boardId: string;
    userId: string;
  }): Promise<{ board: { id: string; name: string; ownerId: string; createdAt: string } }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("get_board", {
      p_clerk_id: userId,
      p_board_id: boardId,
    });

    if (error) {
      console.error("getBoard error:", error);
      throw APIError.internal("Board yüklenemedi");
    }

    const row = data as Record<string, unknown>;
    return {
      board: {
        id: row.id as string,
        name: row.name as string,
        ownerId: row.owner_id as string,
        createdAt: row.created_at as string,
      },
    };
  }
);

export const deleteBoard = api(
  { expose: true, method: "DELETE", path: "/ev-isleri/board/:boardId/:userId" },
  async ({
    boardId,
    userId,
  }: {
    boardId: string;
    userId: string;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("delete_board", {
      p_clerk_id: userId,
      p_board_id: boardId,
    });

    if (error) {
      console.error("deleteBoard error:", error);
      throw APIError.internal("Board silinemedi");
    }

    return { success: data as boolean };
  }
);

export const getBoardMembers = api(
  { expose: true, method: "GET", path: "/ev-isleri/board/:boardId/members/:userId" },
  async ({
    boardId,
    userId,
  }: {
    boardId: string;
    userId: string;
  }): Promise<{ members: BoardMember[] }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("get_board_members", {
      p_clerk_id: userId,
      p_board_id: boardId,
    });

    if (error) {
      console.error("getBoardMembers error:", error);
      throw APIError.internal("Üyeler yüklenemedi");
    }

    return { members: (data as Record<string, unknown>[] || []).map(mapMember) };
  }
);

export const createBoardInvite = api(
  { expose: true, method: "POST", path: "/ev-isleri/board/:boardId/invite" },
  async ({
    userId,
    boardId,
  }: {
    userId: string;
    boardId: string;
  }): Promise<{ inviteId: string }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("create_board_invite", {
      p_clerk_id: userId,
      p_board_id: boardId,
    });

    if (error) {
      console.error("createBoardInvite error:", error);
      throw APIError.internal("Davet oluşturulamadı");
    }

    return { inviteId: data as string };
  }
);

export const getBoardInviteDetails = api(
  { expose: true, method: "GET", path: "/ev-isleri/invite/:inviteId" },
  async ({ inviteId }: { inviteId: string }): Promise<BoardInviteDetails> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("get_board_invite_details", {
      p_invite_id: inviteId,
    });

    if (error) {
      console.error("getBoardInviteDetails error:", error);
      throw APIError.internal("Davet bilgisi yüklenemedi");
    }

    const row = (data as Record<string, unknown>[])?.[0];
    if (!row) {
      throw APIError.notFound("Davet bulunamadı");
    }

    return {
      boardId: row.board_id as string,
      boardName: row.board_name as string,
      creatorUsername: (row.creator_username as string) || null,
      isExpired: Boolean(row.is_expired),
    };
  }
);

export const acceptBoardInvite = api(
  { expose: true, method: "POST", path: "/ev-isleri/invite/accept" },
  async ({
    inviteId,
    userId,
  }: {
    inviteId: string;
    userId: string;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("accept_board_invite", {
      p_invite_id: inviteId,
      p_clerk_id: userId,
    });

    if (error) {
      console.error("acceptBoardInvite error:", error);
      throw APIError.internal("Davet kabul edilemedi");
    }

    return { success: data as boolean };
  }
);

export const addBoardMember = api(
  { expose: true, method: "POST", path: "/ev-isleri/board/:boardId/member" },
  async (req: {
    userId: string;
    boardId: string;
    friendUserId: string;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("add_board_member", {
      p_clerk_id: req.userId,
      p_board_id: req.boardId,
      p_friend_clerk_id: req.friendUserId,
    });

    if (error) {
      console.error("addBoardMember error:", error);
      throw APIError.internal("Üye eklenemedi");
    }

    return { success: data as boolean };
  }
);

export const removeBoardMember = api(
  { expose: true, method: "POST", path: "/ev-isleri/board/:boardId/member/remove" },
  async (req: {
    userId: string;
    boardId: string;
    targetUserId: string;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("remove_board_member", {
      p_clerk_id: req.userId,
      p_board_id: req.boardId,
      p_target_clerk_id: req.targetUserId,
    });

    if (error) {
      console.error("removeBoardMember error:", error);
      throw APIError.internal("Üye kaldırılamadı");
    }

    return { success: data as boolean };
  }
);

export const getWeekPlan = api(
  { expose: true, method: "GET", path: "/ev-isleri/board/:boardId/week/:userId" },
  async ({
    boardId,
    userId,
    weekStart,
  }: {
    boardId: string;
    userId: string;
    weekStart: string;
  }): Promise<{ assignments: WeekAssignment[] }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("get_week_plan", {
      p_clerk_id: userId,
      p_board_id: boardId,
      p_week_start: weekStart,
    });

    if (error) {
      console.error("getWeekPlan error:", error);
      throw APIError.internal("Haftalık plan yüklenemedi");
    }

    return { assignments: (data as Record<string, unknown>[] || []).map(mapAssignment) };
  }
);

export interface IntegratedTodayChores {
  boardId: string;
  boardName: string;
  weekStart: string;
  assignments: WeekAssignment[];
}

/**
 * Bugünün görevlerini (ilk board için) getirir
 */
export const getTodayIntegratedChores = api(
  { expose: true, method: "GET", path: "/ev-isleri/today/:userId" },
  async ({ userId }: { userId: string }): Promise<{ chores: IntegratedTodayChores | null }> => {
    const { boards } = await getBoards({ userId });
    if (!boards || boards.length === 0) {
      return { chores: null };
    }

    const board = boards[0];
    const weekStart = getMondayWeekStart();
    const { assignments } = await getWeekPlan({
      boardId: board.id,
      userId,
      weekStart,
    });

    return {
      chores: {
        boardId: board.id,
        boardName: board.name,
        weekStart,
        assignments: assignments || [],
      },
    };
  }
);

function getMondayWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export const setAssignment = api(
  { expose: true, method: "PUT", path: "/ev-isleri/board/:boardId/assignment" },
  async (req: {
    userId: string;
    boardId: string;
    weekStart: string;
    dayOfWeek: number;
    choreSlug: string;
    choreName: string;
    choreIcon?: string | null;
    assigneeUserId: string;
  }): Promise<{ assignment: WeekAssignment }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("set_assignment", {
      p_clerk_id: req.userId,
      p_board_id: req.boardId,
      p_week_start: req.weekStart,
      p_day_of_week: req.dayOfWeek,
      p_chore_slug: req.choreSlug,
      p_chore_name: req.choreName,
      p_chore_icon: req.choreIcon ?? null,
      p_assignee_clerk_id: req.assigneeUserId,
    });

    if (error) {
      console.error("setAssignment error:", error);
      throw APIError.internal("Görev atanamadı");
    }

    const row = data as Record<string, unknown>;
    return {
      assignment: {
        id: row.id as string,
        dayOfWeek: Number(row.day_of_week),
        choreSlug: row.chore_slug as string,
        choreName: row.chore_name as string,
        choreIcon: (row.chore_icon as string) || null,
        assigneeId: row.assignee_id as string,
        assigneeClerkId: req.assigneeUserId,
        assigneeUsername: null,
        assigneeAvatarUrl: null,
        completedAt: (row.completed_at as string) || null,
        completedBy: (row.completed_by as string) || null,
      },
    };
  }
);

export const removeAssignment = api(
  { expose: true, method: "DELETE", path: "/ev-isleri/assignment/:assignmentId/:userId" },
  async ({
    assignmentId,
    userId,
  }: {
    assignmentId: string;
    userId: string;
  }): Promise<{ success: boolean }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("remove_assignment", {
      p_clerk_id: userId,
      p_assignment_id: assignmentId,
    });

    if (error) {
      console.error("removeAssignment error:", error);
      throw APIError.internal("Görev kaldırılamadı");
    }

    return { success: data as boolean };
  }
);

export const toggleAssignmentComplete = api(
  { expose: true, method: "POST", path: "/ev-isleri/assignment/:assignmentId/toggle/:userId" },
  async ({
    assignmentId,
    userId,
  }: {
    assignmentId: string;
    userId: string;
  }): Promise<{ completed: boolean }> => {
    const { data, error } = await supabase.schema("ev_isleri").rpc("toggle_assignment_complete", {
      p_clerk_id: userId,
      p_assignment_id: assignmentId,
    });

    if (error) {
      console.error("toggleAssignmentComplete error:", error);
      throw APIError.internal("Görev durumu güncellenemedi");
    }

    const row = data as Record<string, unknown>;
    return { completed: row.completed_at != null };
  }
);
