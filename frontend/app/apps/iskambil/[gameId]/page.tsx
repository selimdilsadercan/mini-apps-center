import { Metadata } from "next";
import { notFound } from "next/navigation";
import { GAMES_DATA } from "../games-registry";
import GameDetailClient from "./GameDetailClient";

interface PageProps {
  params: Promise<{ gameId: string }>;
}

// Generate static routes for build time (SSG / Static Export)
export async function generateStaticParams() {
  return GAMES_DATA.map((game) => ({
    gameId: game.id,
  }));
}

// Generate rich SEO metadata dynamically
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameId } = await params;
  const game = GAMES_DATA.find((g) => g.id === gameId);

  if (!game) {
    return {
      title: "Oyun Bulunamadı | Card Games",
    };
  }

  // Optimize for search queries like: "whist nasıl oynanır", "how to play whist"
  return {
    title: `${game.name_tr.toUpperCase()} Nasıl Oynanır? Kuralları & Detaylı Rehberi | How to Play ${game.name_en}`,
    description: `TR: ${game.description_tr} İskambil oyunu kuralları, dağıtımı, taktikleri ve oynanışı. EN: ${game.description_en} Card game rules, setup, objectives, and gameplay.`,
    alternates: {
      canonical: `/apps/iskambil/${game.id}`,
    },
    openGraph: {
      title: `${game.name_tr.toUpperCase()} Nasıl Oynanır? Kuralları & Rehberi`,
      description: game.description_tr,
      type: "website",
    },
  };
}

export default async function GamePage({ params }: PageProps) {
  const { gameId } = await params;
  const game = GAMES_DATA.find((g) => g.id === gameId);

  if (!game) {
    notFound();
  }

  // Structured Data for Google Rich Snippets (TR)
  const schemaTr = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `${game.name_tr.toUpperCase()} Nasıl Oynanır?`,
    "description": game.description_tr,
    "step": (game.rules_tr || []).map((rule, idx) => ({
      "@type": "HowToStep",
      "position": idx + 1,
      "text": rule,
    })),
  };

  // Structured Data for Google Rich Snippets (EN)
  const schemaEn = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `How to Play ${game.name_en}?`,
    "description": game.description_en,
    "step": (game.rules_en || []).map((rule, idx) => ({
      "@type": "HowToStep",
      "position": idx + 1,
      "text": rule,
    })),
  };

  // Pass to Client Component wrapper which handles language contexts, favoriting, notes, and local storage/DB sync
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaTr) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaEn) }}
      />
      <GameDetailClient initialGame={game} />
    </>
  );
}
