import IconSetDetailClient from "./IconSetDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [{ id: "default" }];
}

export default async function IconSetDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <IconSetDetailClient id={id} />;
}

