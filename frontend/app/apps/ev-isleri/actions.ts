import { createBrowserClient } from "@/lib/api";
import { ev_isleri } from "@/lib/client";
import { getErrorMessage, isUnauthenticatedError } from "@/lib/api-error-handler";
import type { Board, BoardMember, WeekAssignment } from "./types";

interface ActionResponse<T> {
  data: T | null;
  error: string | null;
}

export async function getBoardsAction(clerkId: string): Promise<ActionResponse<Board[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.getBoards(clerkId);
    return { data: response.boards ?? [], error: null };
  } catch (error) {
    if (isUnauthenticatedError(error)) {
      return { data: null, error: "UNAUTHENTICATED" };
    }
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createBoardAction(
  clerkId: string,
  name: string
): Promise<ActionResponse<Board>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.createBoard({ userId: clerkId, name });
    return { data: response.board, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function deleteBoardAction(
  clerkId: string,
  boardId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.deleteBoard(boardId, clerkId);
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getBoardMembersAction(
  clerkId: string,
  boardId: string
): Promise<ActionResponse<BoardMember[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.getBoardMembers(boardId, clerkId);
    return { data: response.members ?? [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getWeekPlanAction(
  clerkId: string,
  boardId: string,
  weekStart: string
): Promise<ActionResponse<WeekAssignment[]>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.getWeekPlan(boardId, clerkId, { weekStart });
    return { data: response.assignments ?? [], error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function setAssignmentAction(params: {
  clerkId: string;
  boardId: string;
  weekStart: string;
  dayOfWeek: number;
  choreSlug: string;
  choreName: string;
  choreIcon?: string | null;
  assigneeUserId: string;
}): Promise<ActionResponse<WeekAssignment>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.setAssignment(params.boardId, {
      userId: params.clerkId,
      weekStart: params.weekStart,
      dayOfWeek: params.dayOfWeek,
      choreSlug: params.choreSlug,
      choreName: params.choreName,
      choreIcon: params.choreIcon ?? null,
      assigneeUserId: params.assigneeUserId,
    });
    return { data: response.assignment, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function removeAssignmentAction(
  clerkId: string,
  assignmentId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.removeAssignment(assignmentId, clerkId);
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function toggleAssignmentCompleteAction(
  clerkId: string,
  assignmentId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.toggleAssignmentComplete(assignmentId, clerkId);
    return { data: response.completed, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function createBoardInviteAction(
  clerkId: string,
  boardId: string
): Promise<ActionResponse<string>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.createBoardInvite(boardId, { userId: clerkId });
    return { data: response.inviteId, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function removeBoardMemberAction(
  clerkId: string,
  boardId: string,
  targetUserId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.removeBoardMember(boardId, {
      userId: clerkId,
      targetUserId,
    });
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function acceptBoardInviteAction(
  clerkId: string,
  inviteId: string
): Promise<ActionResponse<boolean>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.acceptBoardInvite({ inviteId, userId: clerkId });
    return { data: response.success, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function getBoardInviteDetailsAction(
  inviteId: string
): Promise<ActionResponse<ev_isleri.BoardInviteDetails>> {
  try {
    const client = createBrowserClient();
    const response = await client.ev_isleri.getBoardInviteDetails(inviteId);
    return { data: response, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}
