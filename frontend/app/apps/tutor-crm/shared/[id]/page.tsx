import SharedPlanClient from "./SharedPlanClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: "default" }];
}

export default async function SharedPlanPage({ params }: PageProps) {
  const { id } = await params;
  return <SharedPlanClient id={id} />;
}

