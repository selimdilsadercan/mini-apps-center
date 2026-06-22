import BusinessDetailClient from "./BusinessDetailClient";
import { use } from "react";

export function generateStaticParams() {
  return [{ id: "dummy" }];
}

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BusinessDetailClient id={id} />;
}
