import { Metadata } from "next";
import { createServerClient } from "@/lib/api";
import SuggestRecipientClient from "./SuggestRecipientClient";

export function generateStaticParams() {
  return [{ id: "dummy" }];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (id === "dummy") {
    return {
      title: "Suggest Tavsiyesi",
      description: "Arkadaşından gelen tavsiyeyi hemen gör!",
    };
  }

  try {
    const client = await createServerClient();
    const res = await client.suggest.getPublicSuggestion(id, {});

    if (res.isExpired || !res.suggestion) {
      return {
        title: "Süresi Dolan Tavsiye | Suggest",
        description: "Bu tavsiyenin süresi 24 saati geçtiği için kaldırılmıştır.",
      };
    }

    const { senderUsername } = res;
    const title = `${senderUsername || "Bir arkadaşın"} sana bir tavsiye bıraktı!`;
    const description = `24 saat dolmadan hemen tıkla ve arkadaşının senin için bıraktığı öneriyi gör.`;

    const ogImage = "/suggest-og.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        images: [{ url: ogImage }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (err) {
    return {
      title: "Suggest Tavsiyesi",
      description: "Arkadaşından gelen tavsiyeyi hemen gör!",
      openGraph: {
        images: [{ url: "/suggest-og.png" }],
      },
      twitter: {
        card: "summary_large_image",
        images: ["/suggest-og.png"],
      },
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  // In a static export, we can't reliably fetch data at build time for dynamic IDs.
  // We pass the ID to the client component which will handle fetching if initial data is missing.
  return (
    <SuggestRecipientClient
      id={id}
      initialSuggestion={null as any}
      initialSenderName={null}
      initialSenderAvatar={null}
      initialSenderClerkId={null}
      initialIsExpired={false}
    />
  );
}
