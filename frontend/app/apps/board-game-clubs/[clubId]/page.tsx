import ClubDetailClient from "./ClubDetailClient";

interface PageProps {
  params: Promise<{ clubId: string }>;
}

// Generate static params for static export
export function generateStaticParams() {
  return [{ clubId: "default" }];
}

export default async function ClubDetailPage({ params }: PageProps) {
  const { clubId } = await params;
  return <ClubDetailClient clubId={clubId} />;
}
