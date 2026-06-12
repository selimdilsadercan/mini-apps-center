import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createBrowserClient } from "@/lib/api";
import ChocolateDetailClient from "@/app/apps/chocolate-db/[id]/ChocolateDetailClient";

const client = createBrowserClient();

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static routes for build time
export async function generateStaticParams() {
  try {
    const resp = await client.chocolate_db.listChocolates({ limit: 1000 });
    return resp.chocolates.map((choco) => ({
      id: choco.id,
    }));
  } catch (err) {
    console.error("Failed to generate static params for chocolates:", err);
    return [];
  }
}

// Generate rich SEO metadata dynamically
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const choco = await client.chocolate_db.getChocolate(id);

    const title = `${choco.name} - ${choco.brand} | ChocolateDB Puanı: ${choco.avg_rating.toFixed(1)}/10`;
    const description = `${choco.brand} markasının ${choco.name} ürünü hakkında detaylı bilgiler, kullanıcı yorumları ve puanları. ${choco.description_tr || ""}`;

    return {
      title,
      description,
      alternates: {
        canonical: `/apps/chocolate-db/${choco.id}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        images: choco.image_url ? [{ url: choco.image_url }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: choco.image_url ? [choco.image_url] : [],
      },
    };
  } catch (err) {
    return {
      title: "Çikolata Bulunamadı | ChocolateDB",
    };
  }
}

export default async function ChocolatePage({ params }: PageProps) {
  const { id } = await params;
  
  try {
    const choco = await client.chocolate_db.getChocolate(id);

    // Structured Data for Google Rich Snippets
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": choco.name,
      "image": choco.image_url,
      "description": choco.description_tr || choco.description_en,
      "brand": {
        "@type": "Brand",
        "name": choco.brand
      },
      "aggregateRating": choco.review_count > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": choco.avg_rating,
        "reviewCount": choco.review_count,
        "bestRating": "10",
        "worstRating": "1"
      } : undefined
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ChocolateDetailClient initialChoco={choco} />
      </>
    );
  } catch (err) {
    notFound();
  }
}
