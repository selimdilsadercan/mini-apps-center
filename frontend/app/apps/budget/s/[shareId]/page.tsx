import SharedProjectClient from "./SharedProjectClient";
import { use } from "react";

export function generateStaticParams() {
  return [{ shareId: "dummy" }];
}

export default function SharedProjectPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = use(params);
  return <SharedProjectClient shareId={shareId} />;
}
