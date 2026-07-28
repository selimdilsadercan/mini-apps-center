"use client";

import React, { useEffect, useState } from "react";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { getAppHref } from "@/lib/apps";
import { getPublishedAppById } from "@/lib/app-catalog";

export function DirectoryOpenAppButton({ appId }: { appId: string }) {
  const app = getPublishedAppById(appId);
  const [href, setHref] = useState("#");

  useEffect(() => {
    if (app) setHref(getAppHref(app));
  }, [app]);

  if (!app) return null;

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 px-8 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg"
    >
      Uygulamayı Aç
      <ArrowSquareOut size={16} weight="bold" />
    </a>
  );
}
