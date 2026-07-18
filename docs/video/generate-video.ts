#!/usr/bin/env bun
/**
 * Görsellerden MP4 sunum videosu üretir.
 * Kullanım: bun run video   (docs/video klasöründen)
 */

import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { readdirSync, statSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import os from "node:os";

const ROOT = import.meta.dir;
const IMAGES_DIR = join(ROOT, "images");
const LOGO_PATH = join(ROOT, "logo-small.png");
const OUT_DIR = join(ROOT, "output");
const TMP_DIR = join(OUT_DIR, ".tmp");
const OUTPUT = join(OUT_DIR, "sunum.mp4");

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const SLIDE_SEC = 4;
const FRAMES = FPS * SLIDE_SEC;
const LOGO_MARGIN = 36;

if (!ffmpegPath) {
  console.error("ffmpeg-static bulunamadı. Önce: bun install");
  process.exit(1);
}

const ffmpeg = ffmpegPath;

function runSync(args: string[]) {
  execFileSync(ffmpeg, args, { stdio: "ignore" });
}

// Spawns ffmpeg process asynchronously returning a Promise
function runAsync(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = Bun.spawn([ffmpeg, ...args], {
      stdout: "ignore",
      stderr: "ignore",
    });

    const timer = setInterval(() => {
      if (proc.killed || proc.exitCode !== null) {
        clearInterval(timer);
        if (proc.exitCode === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${proc.exitCode}`));
        }
      }
    }, 100);
  });
}

interface ImageItem {
  absolutePath: string;
  category: string;
  filename: string;
}

function getSlideTitle(category: string): string {
  // Format clean name from category directory name
  let title = category
    .replace(/-/g, " ") // replace dashes with spaces
    .trim();

  title = title
    .replace(/i/g, "İ")
    .replace(/ı/g, "I")
    .replace(/ş/g, "Ş")
    .replace(/ç/g, "Ç")
    .replace(/ğ/g, "Ğ")
    .replace(/ü/g, "Ü")
    .replace(/ö/g, "Ö")
    .toUpperCase();

  return title;
}

function makeImageClipArgs(input: string, category: string, out: string): string[] {
  const zoomEnd = 1.05;
  const slideTitle = getSlideTitle(category);

  // Position text in top-left: x=48, y=48 with beautiful and guaranteed Arial Bold system font file
  const textFilter = `drawtext=fontfile='/System/Library/Fonts/Supplemental/Arial Bold.ttf':text='${slideTitle}':fontsize=60:fontcolor=white:x=48:y=48:box=1:boxcolor=black@0.6:boxborderw=24`;

  const filters = [
    `[0:v]scale=2560:2560:force_original_aspect_ratio=increase:flags=bilinear,zoompan=z='1+${(zoomEnd - 1).toFixed(4)}*on/${FRAMES}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${FRAMES}:s=${WIDTH}x${HEIGHT}:fps=${FPS},${textFilter}[v]`,
    `[1:v]scale=220:-1[logo]`,
    `[v][logo]overlay=${LOGO_MARGIN}:main_h-overlay_h-${LOGO_MARGIN}`,
  ].join(";");

  return [
    "-y",
    "-loop",
    "1",
    "-i",
    input,
    "-i",
    LOGO_PATH,
    "-filter_complex",
    filters,
    "-c:v",
    "libx264",
    "-preset",
    "superfast",
    "-pix_fmt",
    "yuv420p",
    "-t",
    String(SLIDE_SEC),
    out,
  ];
}

function concatClips(clips: string[], out: string) {
  const listPath = join(TMP_DIR, "concat.txt");
  writeFileSync(
    listPath,
    clips.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join("\n"),
  );

  runSync([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c:v",
    "libx264",
    "-preset",
    "superfast",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    out,
  ]);
}

async function runPool(items: ImageItem[], clips: string[]) {
  const concurrency = Math.max(1, os.cpus().length - 1);
  console.log(`⚡ Concurrency limit: ${concurrency} (Cores: ${os.cpus().length})`);

  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      if (i >= items.length) break;
      const clip = clips[i];
      const item = items[i];
      console.log(`▶ Başlatıldı [${i + 1}/${items.length}]: ${item.category}/${item.filename}`);
      const args = makeImageClipArgs(item.absolutePath, item.category, clip);
      try {
        await runAsync(args);
        console.log(`✔ Tamamlandı [${i + 1}/${items.length}]: ${item.category}/${item.filename}`);
      } catch (err) {
        console.error(`❌ Hata [${i + 1}/${items.length}]:`, err);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
}

// --- main ---

rmSync(TMP_DIR, { recursive: true, force: true });
mkdirSync(TMP_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// Scan categories
const items: ImageItem[] = [];
const categoryDirs = readdirSync(IMAGES_DIR).filter((dir) => {
  return statSync(join(IMAGES_DIR, dir)).isDirectory();
}).sort();

for (const cat of categoryDirs) {
  const catPath = join(IMAGES_DIR, cat);
  const files = readdirSync(catPath)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  for (const file of files) {
    items.push({
      absolutePath: join(catPath, file),
      category: cat,
      filename: file,
    });
  }
}

if (items.length === 0) {
  console.error("Görsel bulunamadı.");
  process.exit(1);
}

console.log(`🖼  ${items.length} görsel bulundu (${categoryDirs.length} kategori)`);
const clips = items.map((_, i) => join(TMP_DIR, `${String(i + 1).padStart(2, "0")}-img.mp4`));

await runPool(items, clips);

console.log("🎬 Videolar birleştiriliyor...");
concatClips(clips, OUTPUT);

rmSync(TMP_DIR, { recursive: true, force: true });

const durationMin = ((clips.length * SLIDE_SEC) / 60).toFixed(1);
console.log(`\n✅ Hazır: ${OUTPUT}`);
console.log(`   ${clips.length} slayt × ${SLIDE_SEC}s ≈ ${durationMin} dk`);

