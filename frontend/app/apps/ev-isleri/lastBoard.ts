const LAST_BOARD_KEY = "ev-isleri-last-board";

export function getLastBoardId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_BOARD_KEY);
}

export function setLastBoardId(boardId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_BOARD_KEY, boardId);
}

export function pickDefaultBoardId(boards: { id: string }[]): string | null {
  if (boards.length === 0) return null;
  const lastBoardId = getLastBoardId();
  if (lastBoardId && boards.some((board) => board.id === lastBoardId)) {
    return lastBoardId;
  }
  return boards[0]?.id ?? null;
}
