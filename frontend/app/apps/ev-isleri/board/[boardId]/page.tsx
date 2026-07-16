import BoardRedirectClient from "./BoardRedirectClient";

export function generateStaticParams() {
  return [{ boardId: "default" }];
}

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  return <BoardRedirectClient boardId={boardId} />;
}
