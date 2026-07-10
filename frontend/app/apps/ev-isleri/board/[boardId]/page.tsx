"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/clerk-react";
import { Toaster, toast } from "react-hot-toast";
import EvIsleriShell from "../../components/EvIsleriShell";
import WeeklyBoard, { MembersBar } from "../../components/WeeklyBoard";
import {
  createBoardInviteAction,
  getBoardMembersAction,
  getWeekPlanAction,
  removeAssignmentAction,
  removeBoardMemberAction,
  setAssignmentAction,
  toggleAssignmentCompleteAction,
} from "../../actions";
import type { BoardMember, ChoreTemplate, WeekAssignment } from "../../types";
import {
  formatWeekRange,
  getMondayWeekStart,
  shiftWeekStart,
} from "../../types";
import { createBrowserClient } from "@/lib/api";

export default function BoardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;
  const { user, isLoaded } = useUser();

  const [boardName, setBoardName] = useState("");
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [assignments, setAssignments] = useState<WeekAssignment[]>([]);
  const [weekStart, setWeekStart] = useState(getMondayWeekStart());
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<"owner" | "member">("member");

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

  async function handleAssign(dayOfWeek: number, chore: ChoreTemplate, assigneeClerkId: string) {
    if (!user) return;
    const result = await setAssignmentAction({
      clerkId: user.id,
      boardId,
      weekStart,
      dayOfWeek,
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
    toast.success("Görev atandı");
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

  if (!isLoaded || loading) {
    return (
      <EvIsleriShell onBack={() => router.push("/apps/ev-isleri")}>
        <div className="text-center py-20 text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          Yükleniyor...
        </div>
      </EvIsleriShell>
    );
  }

  if (!user) {
    return (
      <EvIsleriShell onBack={() => router.push("/apps/ev-isleri")}>
        <p className="text-center text-sm font-bold text-gray-400 py-16">Giriş yapmalısın.</p>
      </EvIsleriShell>
    );
  }

  return (
    <EvIsleriShell
      title={boardName || "Board"}
      subtitle="Haftalık görev planı"
      onBack={() => router.push("/apps/ev-isleri")}
    >
      <Toaster position="top-center" />

      <MembersBar
        members={members}
        isOwner={myRole === "owner"}
        onInvite={handleInvite}
        onRemoveMember={handleRemoveMember}
      />

      <WeeklyBoard
        weekStart={weekStart}
        weekLabel={formatWeekRange(weekStart)}
        assignments={assignments}
        members={members}
        currentUserId={user.id}
        onPrevWeek={() => setWeekStart((w) => shiftWeekStart(w, -1))}
        onNextWeek={() => setWeekStart((w) => shiftWeekStart(w, 1))}
        onAssign={handleAssign}
        onToggleComplete={handleToggleComplete}
        onRemove={handleRemove}
      />
    </EvIsleriShell>
  );
}
