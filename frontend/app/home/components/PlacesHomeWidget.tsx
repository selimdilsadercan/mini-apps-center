"use client";

import { useRouter } from "next/navigation";
import { Coffee, MapPin } from "@phosphor-icons/react";
import type { workplaces } from "@/lib/client";
import { resolvePlaceImageSrc } from "@/app/apps/workplaces/lib/place-image";

const TYPE_EMOJI: Record<string, string> = {
  cafe: "☕",
  restaurant: "🍽️",
  dessert: "🍰",
  library: "📚",
  study_spot: "📖",
  park: "🌳",
  bar: "🍺",
};

function placeEmoji(place: workplaces.Place): string {
  const type = place.types?.[0];
  return (type && TYPE_EMOJI[type]) || "📍";
}

export function PlacesHomeWidget({ places }: { places: workplaces.Place[] }) {
  const router = useRouter();

  const items = places
    .filter((p) => p.latitude != null && p.longitude != null)
    .slice(0, 14);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-app-border pt-3 pb-4">
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none snap-x snap-mandatory scroll-pl-4">
        {items.map((place) => {
          const imageSrc = resolvePlaceImageSrc(place.image_url);
          const rating =
            place.internal_rating != null ? place.internal_rating.toFixed(1) : null;

          return (
            <button
              key={place.id}
              type="button"
              onClick={() =>
                router.push(`/apps/workplaces/map?placeId=${encodeURIComponent(place.id)}`)
              }
              className="snap-start shrink-0 w-[9.5rem] text-left rounded-2xl border border-app-border bg-app-surface overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group"
            >
              <div className="aspect-[4/3] relative bg-app-surface-muted overflow-hidden">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {placeEmoji(place)}
                  </div>
                )}
                {rating && (
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                    ★ {rating}
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-black text-app-text leading-tight line-clamp-2 min-h-[2rem]">
                  {place.name}
                </p>
                {place.district && (
                  <p className="text-[9px] text-app-muted font-bold mt-1 truncate flex items-center gap-0.5">
                    <MapPin size={10} className="shrink-0" />
                    {place.district}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="px-4 pt-2 text-[9px] font-bold text-app-muted flex items-center gap-1">
        <Coffee size={11} />
        Kaydır · mekana tıkla, haritada aç
      </p>
    </div>
  );
}
