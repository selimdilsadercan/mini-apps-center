import PublicFeedbackClient from "./PublicFeedbackClient";
import { use } from "react";

export function generateStaticParams() {
  return [{ id: "dummy" }];
}

export default function PublicFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <PublicFeedbackClient businessId={id} />;
}
