"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Toaster, toast } from "react-hot-toast";
import CreateBoardDrawer from "../../components/CreateBoardDrawer";
import EvIsleriShell from "../../components/EvIsleriShell";
import RoutineList, { MembersBar } from "../../components/WeeklyBoard";
import BoardSwitcherDrawer from "../../components/BoardSwitcherDrawer";
import {
  createBoardAction,
  createBoardInviteAction,
  getBoardMembersAction,
  getWeekPlanAction,
  removeAssignmentAction,
  removeBoardMemberAction,
  setAssignmentAction,
  toggleAssignmentCompleteAction,
} from "../../actions";
import type { Board, BoardMember, ChoreTemplate, WeekAssignment } from "../../types";
import { getMondayWeekStart } from "../../types";
import { createBrowserClient } from "@/lib/api";
import { setLastBoardId } from "../../lastBoard";

export default function BoardDetailClient({
  boardId,
  boards,
  onBoardsChange,
  onBoardChange,
}: {
  boardId: string;
  boards: Board[];
  onBoardsChange: (boards: Board[]) => void;
  onBoardChange: (boardId: string) => void;
}) {
  const { user, isLoaded } = useUser();

  const [boardName, setBoardName] = useState("");
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [assignments, setAssignments] = useState<WeekAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<"owner" | "member">("member");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const weekStart = getMondayWeekStart();

  const loadBoard = useCallback(async () => {
    if (!user || !boardId) return;
    try {
      setLoading(true);
      const client = createBrowserClient();
      const [boardRes, membersRes, planRes] = await Promise.all([
        client.ev_isleri.getBoard(boardId, user.id),
        getBoardMembersAction(user.id, boardId),
        getWeekPlanAction(user.id, boardId, weekStart),
      ]);

      setBoardName(boardRes.board.name);

      if (membersRes.error) {
        toast.error(membersRes.error);
      } else {
        setMembers(membersRes.data ?? []);
        const me = membersRes.data?.find((m) => m.clerkId === user.id);
        if (me) setMyRole(me.role);
      }

      if (planRes.error) {
        toast.error(planRes.error);
      } else {
        setAssignments(planRes.data ?? []);
      }
    } catch {
      toast.error("Board yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [user, boardId, weekStart]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void loadBoard();
  }, [isLoaded, user, loadBoard]);

  useEffect(() => {
    if (boardId) setLastBoardId(boardId);
  }, [boardId]);

  async function handleAssign(
    recurrenceType: "daily" | "weekly" | "monthly",
    scheduleDay: number,
    chore: ChoreTemplate,
    assigneeClerkId: string
  ) {
    if (!user) return;
    const result = await setAssignmentAction({
      clerkId: user.id,
      boardId,
      weekStart,
      recurrenceType,
      dayOfWeek: scheduleDay,
      choreSlug: chore.slug,
      choreName: chore.name,
      choreIcon: chore.icon,
      assigneeUserId: assigneeClerkId,
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    await loadBoard();
    toast.success("Görev eklendi");
  }

  async function handleUpdate(
    assignment: WeekAssignment,
    params: {
      recurrenceType: "daily" | "weekly" | "monthly";
      scheduleDay: number;
      assigneeClerkId: string;
    }
  ) {
    if (!user) return;

    const oldType = assignment.recurrenceType ?? "weekly";
    const scheduleChanged =
      oldType !== params.recurrenceType || assignment.dayOfWeek !== params.scheduleDay;
    const assigneeChanged = assignment.assigneeClerkId !== params.assigneeClerkId;

    if (!scheduleChanged && !assigneeChanged) {
      return;
    }

    if (scheduleChanged) {
      const removeResult = await removeAssignmentAction(user.id, assignment.id);
      if (removeResult.error) {
        toast.error(removeResult.error);
        return;
      }
    }

    const result = await setAssignmentAction({
      clerkId: user.id,
      boardId,
      weekStart,
      recurrenceType: params.recurrenceType,
      dayOfWeek: params.scheduleDay,
      choreSlug: assignment.choreSlug,
      choreName: assignment.choreName,
      choreIcon: assignment.choreIcon,
      assigneeUserId: params.assigneeClerkId,
    });

    if (result.error) {
      toast.error(result.error);
      if (scheduleChanged) await loadBoard();
      return;
    }

    await loadBoard();
    toast.success("Görev güncellendi");
  }

  async function handleToggleComplete(assignmentId: string) {
    if (!user) return;
    const result = await toggleAssignmentCompleteAction(user.id, assignmentId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              completedAt: result.data ? new Date().toISOString() : null,
            }
          : a
      )
    );
  }

  async function handleRemove(assignmentId: string) {
    if (!user) return;
    const result = await removeAssignmentAction(user.id, assignmentId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    toast.success("Görev kaldırıldı");
  }

  async function handleInvite() {
    if (!user) return;
    const result = await createBoardInviteAction(user.id, boardId);
    if (result.error || !result.data) {
      toast.error(result.error ?? "Davet oluşturulamadı");
      return;
    }
    const inviteUrl = `${window.location.origin}/apps/ev-isleri/s?t=${result.data}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Davet linki kopyalandı");
  }

  async function handleRemoveMember(targetClerkId: string) {
    if (!user) return;
    const result = await removeBoardMemberAction(user.id, boardId, targetClerkId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setMembers((prev) => prev.filter((m) => m.clerkId !== targetClerkId));
    toast.success("Üye kaldırıldı");
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newBoardName.trim()) return;
    setCreating(true);
    try {
      const result = await createBoardAction(user.id, newBoardName.trim());
      if (result.error || !result.data) {
        toast.error(result.error ?? "Oluşturulamadı");
        return;
      }
      const created = result.data;
      onBoardsChange([created, ...boards]);
      onBoardChange(created.id);
      setShowCreate(false);
      setNewBoardName("");
      toast.success("Board oluşturuldu");
    } finally {
      setCreating(false);
    }
  }

  function handleBoardDeleted(nextBoards: Board[]) {
    onBoardsChange(nextBoards);
    if (nextBoards.length === 0) {
      onBoardChange("");
      return;
    }
    if (!nextBoards.some((board) => board.id === boardId)) {
      onBoardChange(nextBoards[0].id);
    }
  }

  if (!isLoaded || loading) {
    return (
      <EvIsleriShell>
        <div className="text-center py-20 text-app-muted text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </EvIsleriShell>
    );
  }

  if (!user) {
    return (
      <EvIsleriShell>
        <p className="text-center text-sm font-bold text-app-muted py-16">Giriş yapmalısın.</p>
      </EvIsleriShell>
    );
  }

  return (
    <EvIsleriShell
      title={boardName || "Board"}
      onTitleClick={() => setSwitcherOpen(true)}
    >
      <Toaster position="top-center" />

      <MembersBar
        members={members}
        isOwner={myRole === "owner"}
        onInvite={handleInvite}
        onRemoveMember={handleRemoveMember}
      />

      <RoutineList
        weekStart={weekStart}
        weekLabel=""
        assignments={assignments}
        members={members}
        currentUserId={user.id}
        onPrevWeek={() => {}}
        onNextWeek={() => {}}
        onAssign={handleAssign}
        onUpdate={handleUpdate}
        onToggleComplete={handleToggleComplete}
        onRemove={handleRemove}
      />

      <BoardSwitcherDrawer
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        boards={boards}
        activeBoardId={boardId}
        onSelect={onBoardChange}
        onCreate={() => setShowCreate(true)}
        onBoardsChange={handleBoardDeleted}
        userId={user.id}
      />

      <CreateBoardDrawer
        open={showCreate}
        onOpenChange={setShowCreate}
        boardName={newBoardName}
        onBoardNameChange={setNewBoardName}
        onSubmit={(e) => void handleCreateBoard(e)}
        creating={creating}
      />
    </EvIsleriShell>
  );
}
