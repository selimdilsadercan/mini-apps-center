import BoardDetailClient from "./BoardDetailClient";
import { use } from "react";

export function generateStaticParams() {
  return [{ boardId: "default" }];
}

export default function BoardDetailPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = use(params);
  return <BoardDetailClient boardId={boardId} />;
}
