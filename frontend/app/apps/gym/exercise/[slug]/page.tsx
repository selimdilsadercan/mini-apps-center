import ExerciseDetailClient from "./ExerciseDetailClient";
import { use } from "react";

export function generateStaticParams() {
  return [{ slug: "default" }];
}

export default function ExerciseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ExerciseDetailClient slug={slug} />;
}
