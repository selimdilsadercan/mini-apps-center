#!/usr/bin/env bun
/**
 * Görsellerden MP4 sunum videosu üretir.
 * Kullanım: bun run video   (docs/video klasöründen)
 */

import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

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
const BG = "0x000000";
const LOGO_MARGIN = 36;

if (!ffmpegPath) {
  console.error("ffmpeg-static bulunamadı. Önce: bun install");
  process.exit(1);
}

const ffmpeg = ffmpegPath;

function run(args: string[]) {
  execFileSync(ffmpeg, args, { stdio: "inherit" });
}

function sortImages(files: string[]) {
  return files
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function makeImageClip(input: string, out: string) {
  const zoomEnd = 1.05;
  const filters = [
    `[0:v]scale=8000:8000:force_original_aspect_ratio=increase:flags=lanczos,zoompan=z='1+${(zoomEnd - 1).toFixed(4)}*on/${FRAMES}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${FRAMES}:s=${WIDTH}x${HEIGHT}:fps=${FPS}[v]`,
    `[1:v]scale=220:-1[logo]`,
    `[v][logo]overlay=${LOGO_MARGIN}:main_h-overlay_h-${LOGO_MARGIN}`,
  ].join(";");

  run([
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
    "-pix_fmt",
    "yuv420p",
    "-t",
    String(SLIDE_SEC),
    out,
  ]);
}

function concatClips(clips: string[], out: string) {
  const listPath = join(TMP_DIR, "concat.txt");
  writeFileSync(
    listPath,
    clips.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join("\n"),
  );

  run([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    listPath,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    out,
  ]);
}

// --- main ---

console.log("📁 Geçici dosyalar hazırlanıyor...");
rmSync(TMP_DIR, { recursive: true, force: true });
mkdirSync(TMP_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const images = sortImages(readdirSync(IMAGES_DIR));
if (images.length === 0) {
  console.error("images/ klasöründe görsel bulunamadı.");
  process.exit(1);
}

console.log(`🖼  ${images.length} görsel bulundu`);

const clips: string[] = [];

for (let i = 0; i < images.length; i++) {
  const clip = join(TMP_DIR, `${String(i + 1).padStart(2, "0")}-img.mp4`);
  console.log(`▶ Görsel ${i + 1}/${images.length}: ${images[i]}`);
  makeImageClip(resolve(IMAGES_DIR, images[i]), clip);
  clips.push(clip);
}

console.log("🎬 Videolar birleştiriliyor...");
concatClips(clips, OUTPUT);

rmSync(TMP_DIR, { recursive: true, force: true });

const durationMin = ((clips.length * SLIDE_SEC) / 60).toFixed(1);
console.log(`\n✅ Hazır: ${OUTPUT}`);
console.log(`   ${clips.length} slayt × ${SLIDE_SEC}s ≈ ${durationMin} dk`);
