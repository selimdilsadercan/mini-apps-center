import { Metadata } from "next";
import { createServerClient } from "@/lib/api";
import SuggestRecipientClient from "./SuggestRecipientClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const client = await createServerClient();
    const res = await client.suggest.getPublicSuggestion(id, {});

    if (res.isExpired || !res.suggestion) {
      return {
        title: "Süresi Dolan Tavsiye | Suggest",
        description: "Bu tavsiyenin süresi 24 saati geçtiği için kaldırılmıştır.",
      };
    }

    const { suggestion, sender_username } = res;
    const categoryMap: Record<string, string> = {
      song: "Şarkı 🎵",
      movie: "Film 🎬",
      tv: "Dizi 📺",
      video: "Video 📹",
      place: "Mekan 📍",
      book: "Kitap 📚",
    };

    const title = `${sender_username || "Bir arkadaşın"} sana bir ${categoryMap[suggestion.category] || "Öneri"} bıraktı!`;
    const description = `"${suggestion.title}" ${suggestion.short_note ? `— "${suggestion.short_note}"` : ""}`;

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
  let suggestion = null;
  let sender_username = null;
  let sender_avatar = null;
  let sender_clerk_id = null;
  let isExpired = false;

  try {
    const client = await createServerClient();
    const res = await client.suggest.getPublicSuggestion(id, {});
    suggestion = res.suggestion;
    sender_username = res.sender_username;
    sender_avatar = res.sender_avatar;
    sender_clerk_id = res.sender_clerk_id;
    isExpired = res.isExpired;
  } catch (err) {
    console.error("Failed to load server suggestion:", err);
  }

  return (
    <SuggestRecipientClient
      id={id}
      initialSuggestion={suggestion as any}
      initialSenderName={sender_username}
      initialSenderAvatar={sender_avatar}
      initialSenderClerkId={sender_clerk_id}
      initialIsExpired={isExpired}
    />
  );
}
