import { zipSync } from "fflate";
import { ALL_ICON_TARGETS, IconExportTarget } from "./icon-spec";

export interface IconExportOptions {
  opaqueBackground?: string;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel yüklenemedi"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG oluşturulamadı"));
      },
      "image/png",
      1,
    );
  });
}

export async function resizeIconToBlob(
  source: HTMLImageElement,
  size: number,
  options?: { opaque?: boolean; background?: string },
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (options?.opaque) {
    ctx.fillStyle = options.background ?? "#FFFFFF";
    ctx.fillRect(0, 0, size, size);
  }

  const srcW = source.naturalWidth || source.width;
  const srcH = source.naturalHeight || source.height;
  const side = Math.min(srcW, srcH);
  const sx = (srcW - side) / 2;
  const sy = (srcH - side) / 2;

  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
  return canvasToBlob(canvas);
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function buildIconExportZip(
  file: File,
  options: IconExportOptions = {},
): Promise<Blob> {
  const source = await loadImageFromFile(file);
  const bg = options.opaqueBackground ?? "#FFFFFF";

  const zipEntries: Record<string, Uint8Array> = {};

  const readme = `Icon Export — Everything
Kaynak: ${file.name} (${source.naturalWidth}x${source.naturalHeight})

Klasörler:
- ios/     → AppIcon.appiconset dosyaları (Xcode)
- android/ → mipmap-* ve Play Store 512
- web/     → public/ PWA & favicon dosyaları

iOS 1024.png opak arka plan (${bg}) ile export edildi (App Store gereksinimi).
`;
  zipEntries["README.txt"] = new TextEncoder().encode(readme);

  for (const target of ALL_ICON_TARGETS) {
    const blob = await resizeIconToBlob(source, target.size, {
      opaque: target.opaque,
      background: bg,
    });
    zipEntries[target.path] = await blobToUint8Array(blob);
  }

  const zipped = zipSync(zipEntries, { level: 6 });
  return new Blob([zipped as BlobPart], { type: "application/zip" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
