import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { createSupabaseClient } from "../lib/supabase";

const supabaseUrl = secret("SupabaseUrl");
const supabaseAnonKey = secret("SupabaseAnonKey");

const supabase = createSupabaseClient(supabaseUrl(), supabaseAnonKey());

// ==================== TYPES ====================

export interface Rule {
  id: string;
  name: string;
  penalty: number;
}

export interface Member {
  userId: string;
  username: string | null;
  avatar: string | null;
  points: number;
  moneyOwed: number;
  role: string;
  joinedAt: string;
}

export interface Vote {
  userId: string;
  username: string | null;
  approve: boolean;
}

export interface Infraction {
  id: string;
  reportedUserId: string;
  reportedUsername: string | null;
  reportedAvatar: string | null;
  reporterUserId: string | null;
  reporterUsername: string | null;
  ruleName: string;
  penaltyAmount: number;
  isSelfReport: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  votes: Vote[];
}

export interface Lobby {
  id: string;
  joinCode: string;
  creatorId: string;
  name: string;
  penaltyType: 'points' | 'jar';
  currency: string;
  pointStart: number;
  penaltyAmount: number;
  rules: Rule[];
  createdAt: string;
  members: Member[];
  infractions: Infraction[];
}

// ==================== REQUEST / RESPONSE INTERFACES ====================

export interface CreateLobbyRequest {
  creatorId: string;
  name: string;
  penaltyType: 'points' | 'jar';
  currency?: string;
  pointStart?: number;
  penaltyAmount?: number;
  rules: Rule[];
}

export interface CreateLobbyResponse {
  lobbyId: string;
  joinCode: string;
}

export interface JoinLobbyRequest {
  userId: string;
  joinCode: string;
}

export interface JoinLobbyResponse {
  lobbyId: string;
  success: boolean;
}

export interface GetLobbyRequest {
  lobbyId: string;
}

export interface GetLobbyResponse {
  lobby: Lobby;
}

export interface ReportInfractionRequest {
  lobbyId: string;
  reportedUserId: string;
  reporterUserId?: string;
  ruleName: string;
  penaltyAmount: number;
  isSelfReport: boolean;
}

export interface ReportInfractionResponse {
  infractionId: string;
  success: boolean;
}

export interface VoteInfractionRequest {
  infractionId: string;
  userId: string;
  approve: boolean;
}

export interface VoteInfractionResponse {
  status: 'pending' | 'approved' | 'rejected';
  success: boolean;
}

export interface LeaveLobbyRequest {
  lobbyId: string;
  userId: string;
}

export interface LeaveLobbyResponse {
  success: boolean;
}

export interface GetUserLobbiesRequest {
  userId: string;
}

export interface LobbyMemberBrief {
  userId: string;
  username: string | null;
  avatar: string | null;
}

export interface GetUserLobbiesResponse {
  lobbies: {
    id: string;
    joinCode: string;
    name: string;
    penaltyType: 'points' | 'jar';
    role: string;
    joinedAt: string;
    totalPoints: number;
    members: LobbyMemberBrief[];
  }[];
}

// ==================== HELPERS ====================

function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==================== API ENDPOINTS ====================

/**
 * Creates a new lobby
 * POST /penalty-jar/lobby/create
 */
export const createLobby = api(
  { expose: true, method: "POST", path: "/penalty-jar/lobby/create" },
  async (req: CreateLobbyRequest): Promise<CreateLobbyResponse> => {
    const joinCode = generateJoinCode();
    
    const { data, error } = await supabase.schema("penalty_jar").rpc("create_lobby", {
      p_creator_id: req.creatorId,
      p_name: req.name,
      p_penalty_type: req.penaltyType,
      p_currency: req.currency || "TL",
      p_point_start: req.pointStart !== undefined ? req.pointStart : 100,
      p_penalty_amount: req.penaltyAmount !== undefined ? req.penaltyAmount : 10,
      p_rules: JSON.stringify(req.rules),
      p_join_code: joinCode,
    });

    if (error) {
      console.error("createLobby error:", error);
      throw APIError.internal(`Failed to create lobby: ${error.message}`);
    }

    return { lobbyId: data, joinCode };
  }
);

/**
 * Joins a lobby using a join code
 * POST /penalty-jar/lobby/join
 */
export const joinLobby = api(
  { expose: true, method: "POST", path: "/penalty-jar/lobby/join" },
  async (req: JoinLobbyRequest): Promise<JoinLobbyResponse> => {
    const { data, error } = await supabase.schema("penalty_jar").rpc("join_lobby", {
      p_user_id: req.userId,
      p_join_code: req.joinCode.toUpperCase(),
    });

    if (error) {
      console.error("joinLobby error:", error);
      throw APIError.notFound(`Failed to join lobby: ${error.message}`);
    }

    return { lobbyId: data, success: true };
  }
);

/**
 * Fetches all details of a lobby (members, scoreboard, infractions, and rules)
 * GET /penalty-jar/lobby/:lobbyId
 */
export const getLobby = api(
  { expose: true, method: "GET", path: "/penalty-jar/lobby/:lobbyId" },
  async ({ lobbyId }: GetLobbyRequest): Promise<GetLobbyResponse> => {
    const { data, error } = await supabase.schema("penalty_jar").rpc("get_lobby_details", {
      p_lobby_id: lobbyId,
    });

    if (error || !data || data.length === 0) {
      console.error("getLobby error:", error);
      throw APIError.notFound(`Lobby not found or error: ${error?.message}`);
    }

    const row = data[0];
    const lobby: Lobby = {
      id: row.id,
      joinCode: row.join_code,
      creatorId: row.creator_id,
      name: row.name,
      penaltyType: row.penalty_type,
      currency: row.currency,
      pointStart: row.point_start,
      penaltyAmount: row.penalty_amount,
      rules: row.rules || [],
      createdAt: row.created_at,
      members: row.members || [],
      infractions: row.infractions || [],
    };

    return { lobby };
  }
);

/**
 * Reports a new rule infraction (either caught or self-reported)
 * POST /penalty-jar/infraction/report
 */
export const reportInfraction = api(
  { expose: true, method: "POST", path: "/penalty-jar/infraction/report" },
  async (req: ReportInfractionRequest): Promise<ReportInfractionResponse> => {
    const { data, error } = await supabase.schema("penalty_jar").rpc("report_infraction", {
      p_lobby_id: req.lobbyId,
      p_reported_user_id: req.reportedUserId,
      p_reporter_user_id: req.isSelfReport ? null : (req.reporterUserId || null),
      p_rule_name: req.ruleName,
      p_penalty_amount: req.penaltyAmount,
      p_is_self_report: req.isSelfReport,
    });

    if (error) {
      console.error("reportInfraction error:", error);
      throw APIError.internal(`Failed to report infraction: ${error.message}`);
    }

    return { infractionId: data, success: true };
  }
);

/**
 * Votes on a pending infraction (friends voting to verify a caught incident)
 * POST /penalty-jar/infraction/vote
 */
export const voteInfraction = api(
  { expose: true, method: "POST", path: "/penalty-jar/infraction/vote" },
  async (req: VoteInfractionRequest): Promise<VoteInfractionResponse> => {
    const { data, error } = await supabase.schema("penalty_jar").rpc("vote_infraction", {
      p_infraction_id: req.infractionId,
      p_user_id: req.userId,
      p_approve: req.approve,
    });

    if (error) {
      console.error("voteInfraction error:", error);
      throw APIError.internal(`Failed to vote on infraction: ${error.message}`);
    }

    return { status: data as 'pending' | 'approved' | 'rejected', success: true };
  }
);

/**
 * Leaves a lobby
 * POST /penalty-jar/lobby/leave
 */
export const leaveLobby = api(
  { expose: true, method: "POST", path: "/penalty-jar/lobby/leave" },
  async (req: LeaveLobbyRequest): Promise<LeaveLobbyResponse> => {
    const { error } = await supabase
      .schema("penalty_jar")
      .from("lobby_members")
      .delete()
      .eq("lobby_id", req.lobbyId)
      .eq("user_id", req.userId);

    if (error) {
      console.error("leaveLobby error:", error);
      throw APIError.internal(`Failed to leave lobby: ${error.message}`);
    }

    return { success: true };
  }
);

/**
 * Gets all lobbies that a user is currently a member of
 * GET /penalty-jar/user-lobbies/:userId
 */
export const getUserLobbies = api(
  { expose: true, method: "GET", path: "/penalty-jar/user-lobbies/:userId" },
  async ({ userId }: GetUserLobbiesRequest): Promise<GetUserLobbiesResponse> => {
    const { data, error } = await supabase
      .schema("penalty_jar")
      .from("lobby_members")
      .select(`
        role,
        joined_at,
        lobbies (
          id,
          join_code,
          name,
          penalty_type
        )
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("getUserLobbies error:", error);
      throw APIError.internal(`Failed to fetch user lobbies: ${error.message}`);
    }

    const lobbies = [];
    for (const row of (data || [])) {
      const lobbyInfo = Array.isArray(row.lobbies) ? row.lobbies[0] : (row.lobbies as any);
      if (!lobbyInfo) continue;

      const { data: sumData } = await supabase
        .schema("penalty_jar")
        .from("lobby_members")
        .select("money_owed")
        .eq("lobby_id", lobbyInfo.id);
        
      const totalPoints = (sumData || []).reduce((sum: number, member: any) => sum + Number(member.money_owed), 0);
      
      // Fetch member IDs
      const { data: membersData } = await supabase
        .schema("penalty_jar")
        .from("lobby_members")
        .select("user_id")
        .eq("lobby_id", lobbyInfo.id);

      const membersList: LobbyMemberBrief[] = [];
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: usersData } = await supabase
          .from("users")
          .select("clerk_id, username, avatar_url")
          .in("clerk_id", userIds);
          
        if (usersData) {
          for (const u of usersData) {
            membersList.push({
              userId: u.clerk_id,
              username: u.username,
              avatar: u.avatar_url,
            });
          }
        }
      }
      
      lobbies.push({
        id: lobbyInfo.id,
        joinCode: lobbyInfo.join_code,
        name: lobbyInfo.name,
        penaltyType: lobbyInfo.penalty_type,
        role: row.role,
        joinedAt: row.joined_at,
        totalPoints: totalPoints,
        members: membersList
      });
    }

    return { lobbies };
  }
);
