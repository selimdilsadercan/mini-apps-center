#!/usr/bin/env node
/**
 * Statik directory tanıtım sayfaları üretir.
 * Her uygulama için ayrı page.tsx + apps/{id}.tsx stub.
 * Özel tasarımlı sayfalar (CUSTOM_PAGES) atlanır.
 *
 * Kullanım: node scripts/generate-directory-pages.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const CUSTOM_PAGES = new Set(["yks-tercih"]);

function parsePublishedApps(appsTs) {
  const blocks = appsTs.split(/\{\s*\n\s*id:/).slice(1);
  const apps = [];
  for (const b of blocks) {
    const id = b.match(/^\s*"([^"]+)"/)?.[1];
    const name = b.match(/name:\s*"([^"]+)"/)?.[1];
    const description = b.match(/description:\s*"([^"]+)"/)?.[1];
    const category = b.match(/category:\s*"([^"]+)"/)?.[1];
    const cancelled = b.includes("isCancelled: true");
    const implemented = b.includes("isImplemented: true");
    if (id && implemented && !cancelled && name && description) {
      apps.push({ id, name, description, category });
    }
  }
  const seen = new Set();
  return apps.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
}

function componentName(id) {
  return id
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function stubComponent(app) {
  const exportName = `${componentName(app.id)}DirectoryPage`;
  
  // SEO dosyasını oku
  let seoContent = "";
  try {
    const seoPath = path.join(root, "content/apps-seo", `${app.id}.md`);
    if (fs.existsSync(seoPath)) {
      const raw = fs.readFileSync(seoPath, "utf8");
      // Basitçe "Sayfa İçeriği"nden sonrasını al
      const parts = raw.split("## Sayfa İçeriği (SEO Yazısı)");
      if (parts[1]) {
        seoContent = parts[1].trim();
      }
    }
  } catch (e) {
    console.error(`SEO file error for ${app.id}:`, e);
  }

  // Markdown'ı basit HTML/JSX'e çevir (veya sadece metin olarak bas)
  const seoJsx = seoContent
    ? seoContent
        .split("\n")
        .map(line => {
          if (line.startsWith("### ")) return `<h3 className="text-xl font-bold text-white mt-8 mb-4">${line.replace("### ", "")}</h3>`;
          if (line.startsWith("- ")) return `<li className="text-zinc-400 ml-4 mb-2">${line.replace("- ", "")}</li>`;
          if (line.trim() === "") return "";
          return `<p className="text-zinc-400 leading-relaxed mb-4">${line}</p>`;
        })
        .join("\n")
    : `<section className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-8 text-center">
        <p className="text-sm text-zinc-500 font-medium">
          Bu sayfanın özel tasarımı yakında eklenecek.
        </p>
      </section>`;

  return `"use client";

import React from "react";
import { DirectoryAppIcon } from "@/components/landing/directory/DirectoryAppIcon";

/**
 * ${app.name} — tanıtım sayfası.
 * Bu dosyayı özgürce düzenleyin; her uygulamanın tasarımı ayrıdır.
 */
export default function ${exportName}() {
  return (
    <div className="max-w-5xl mx-auto px-6 pb-8 space-y-10">
      <section className="space-y-4">
        <div className="flex items-start gap-4">
          <DirectoryAppIcon appId="${app.id}" />
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400">
              ${app.category}
            </p>
            <h1 className="text-4xl md:text-5xl font-[1000] tracking-tight text-white">
              ${app.name}
            </h1>
          </div>
        </div>
        <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-2xl">
          ${app.description}
        </p>
      </section>

      <div className="prose prose-invert max-w-none">
        ${seoJsx}
      </div>
    </div>
  );
}
`;
}

function pageFile(app, exportName) {
  const canonical = `https://allminiapps.com/directory/${app.id}`;
  return `import type { Metadata } from "next";
import DirectoryAppShell from "@/components/landing/directory/DirectoryAppShell";
import ${exportName} from "@/components/landing/directory/apps/${app.id}";

export const metadata: Metadata = {
  title: "${app.name} | Everything",
  description: "${app.description.replace(/"/g, '\\"')}",
  alternates: { canonical: "${canonical}" },
  openGraph: {
    title: "${app.name} | Everything",
    description: "${app.description.replace(/"/g, '\\"')}",
    url: "${canonical}",
    siteName: "Everything",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "tr_TR",
    type: "website",
  },
};

export default function Page() {
  return (
    <DirectoryAppShell appId="${app.id}">
      <${exportName} />
    </DirectoryAppShell>
  );
}
`;
}

const appsTs = fs.readFileSync(path.join(root, "lib/apps.ts"), "utf8");
const apps = parsePublishedApps(appsTs);

const pagesDir = path.join(root, "app/landing/directory");
const componentsDir = path.join(root, "components/landing/directory/apps");

fs.mkdirSync(componentsDir, { recursive: true });

// Remove dynamic route if present
const dynamicDir = path.join(pagesDir, "[appId]");
if (fs.existsSync(dynamicDir)) {
  fs.rmSync(dynamicDir, { recursive: true });
  console.log("Removed dynamic [appId] route");
}

let created = 0;
for (const app of apps) {
  const appPageDir = path.join(pagesDir, app.id);
  const componentPath = path.join(componentsDir, `${app.id}.tsx`);
  const pagePath = path.join(appPageDir, "page.tsx");
  const exportName = `${componentName(app.id)}DirectoryPage`;

  fs.mkdirSync(appPageDir, { recursive: true });

  if (!CUSTOM_PAGES.has(app.id) && (!fs.existsSync(componentPath) || process.argv.includes("--refresh-stubs"))) {
    fs.writeFileSync(componentPath, stubComponent(app));
  }

  if (!fs.existsSync(pagePath)) {
    fs.writeFileSync(pagePath, pageFile(app, exportName));
    created++;
  }
}

console.log(`Published apps: ${apps.length}, new pages: ${created}`);
