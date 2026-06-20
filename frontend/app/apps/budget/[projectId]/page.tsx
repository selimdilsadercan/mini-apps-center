import ProjectDetailsClient from "./ProjectDetailsClient";
import { use } from "react";

export function generateStaticParams() {
  return [{ projectId: "dummy" }];
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  return <ProjectDetailsClient projectId={projectId} />;
}
