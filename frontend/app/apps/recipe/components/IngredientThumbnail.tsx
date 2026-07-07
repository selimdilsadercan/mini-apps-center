"use client";

import { useEffect, useState } from "react";
import {
  getItemInitial,
  resolveItemImageUrl,
} from "../../eksik-var/item-images";

export default function IngredientThumbnail({
  name,
  size = "list",
}: {
  name: string;
  size?: "list" | "tooltip";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = resolveItemImageUrl(name);
  const initial = getItemInitial(name);

  const boxClass =
    size === "tooltip" ? "w-10 h-10 text-sm shrink-0" : "w-9 h-9 text-sm shrink-0";
  const roundClass = "rounded-lg";

  useEffect(() => {
    setImageFailed(false);
  }, [name, imageUrl]);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        onError={() => setImageFailed(true)}
        className={`${boxClass} object-contain ${roundClass}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex ${boxClass} ${roundClass} bg-gray-100 border border-gray-200/80 items-center justify-center font-black text-gray-500`}
    >
      {initial}
    </span>
  );
}
