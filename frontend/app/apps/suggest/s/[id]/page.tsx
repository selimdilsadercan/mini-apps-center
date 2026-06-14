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

    const { suggestion, senderUsername } = res;
    const categoryMap: Record<string, string> = {
      song: "Şarkı 🎵",
      movie: "Film 🎬",
      tv: "Dizi 📺",
      video: "Video 📹",
      place: "Mekan 📍",
      book: "Kitap 📚",
    };

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
  let suggestion = null;
  let senderUsername = null;
  let senderAvatar = null;
  let senderId = null;
  let isExpired = false;

  try {
    const client = await createServerClient();
    const res = await client.suggest.getPublicSuggestion(id, {});
    suggestion = res.suggestion;
    senderUsername = res.senderUsername;
    senderAvatar = res.senderAvatar;
    senderId = res.senderId;
    isExpired = res.isExpired;
  } catch (err) {
    console.error("Failed to load server suggestion:", err);
  }

  return (
    <SuggestRecipientClient
      id={id}
      initialSuggestion={suggestion as any}
      initialSenderName={senderUsername}
      initialSenderAvatar={senderAvatar}
      initialSenderClerkId={senderId}
      initialIsExpired={isExpired}
    />
  );
}
