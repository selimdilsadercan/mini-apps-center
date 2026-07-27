import { zipSync } from "fflate";
import { ALL_ICON_TARGETS, IconExportTarget } from "./icon-spec";

export interface IconExportOptions {
  opaqueBackground?: string;
  borderRadius?: number; // 0 for square, 0.22 for iOS squircle, 0.5 for circle
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
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
  options?: { opaque?: boolean; background?: string; borderRadius?: number },
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas desteklenmiyor");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Clip canvas with rounded corners if borderRadius is provided
  if (options?.borderRadius && options.borderRadius > 0) {
    const r = options.borderRadius <= 1 ? size * options.borderRadius : options.borderRadius;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, size, size, r);
    } else {
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    }
    ctx.clip();
  }

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

export async function createIcoBlobFromPngBlobs(
  pngBlobs: { width: number; height: number; blob: Blob }[],
): Promise<Blob> {
  const buffers: { width: number; height: number; data: Uint8Array }[] = [];
  for (const item of pngBlobs) {
    const data = new Uint8Array(await item.blob.arrayBuffer());
    buffers.push({ width: item.width, height: item.height, data });
  }

  const numImages = buffers.length;
  const headerSize = 6;
  const directorySize = 16 * numImages;
  let currentOffset = headerSize + directorySize;

  const totalLength = buffers.reduce(
    (acc, img) => acc + img.data.length,
    currentOffset,
  );
  const icoData = new Uint8Array(totalLength);
  const view = new DataView(icoData.buffer);

  // ICO Header
  view.setUint16(0, 0, true); // Reserved (0)
  view.setUint16(2, 1, true); // Type (1 = ICO)
  view.setUint16(4, numImages, true); // Image count

  // Directory entries & Image data
  let dirOffset = 6;
  for (const img of buffers) {
    icoData[dirOffset] = img.width >= 256 ? 0 : img.width;
    icoData[dirOffset + 1] = img.height >= 256 ? 0 : img.height;
    icoData[dirOffset + 2] = 0; // Color palette count
    icoData[dirOffset + 3] = 0; // Reserved
    view.setUint16(dirOffset + 4, 1, true); // Planes
    view.setUint16(dirOffset + 6, 32, true); // BPP
    view.setUint32(dirOffset + 8, img.data.length, true); // Data size
    view.setUint32(dirOffset + 12, currentOffset, true); // Data offset

    icoData.set(img.data, currentOffset);

    dirOffset += 16;
    currentOffset += img.data.length;
  }

  return new Blob([icoData], { type: "image/x-icon" });
}

export async function createIcoBlob(
  source: HTMLImageElement,
  sizes: number[] = [16, 32, 48],
  options?: { borderRadius?: number; opaque?: boolean; background?: string },
): Promise<Blob> {
  const pngBlobs: { width: number; height: number; blob: Blob }[] = [];
  for (const size of sizes) {
    const blob = await resizeIconToBlob(source, size, {
      borderRadius: options?.borderRadius,
      opaque: options?.opaque,
      background: options?.background,
    });
    pngBlobs.push({ width: size, height: size, blob });
  }
  return createIcoBlobFromPngBlobs(pngBlobs);
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
  const radius = options.borderRadius ?? 0;

  const zipEntries: Record<string, Uint8Array> = {};

  const readme = `Icon Export — Everything
Kaynak: ${file.name} (${source.naturalWidth}x${source.naturalHeight})

Klasörler:
- ios/     → AppIcon.appiconset dosyaları (Xcode)
- android/ → mipmap-* ve Play Store 512
- web/     → public/ PWA & favicon.ico dosyaları

iOS 1024.png opak arka plan (${bg}) ile export edildi (App Store gereksinimi).
web/favicon.ico (16, 32, 48 piksel katmanlı ikonu) paketlendi.
`;
  zipEntries["README.txt"] = new TextEncoder().encode(readme);

  // Generate multi-resolution ICO (16, 32, 48px PNG layers packed in binary ICO format)
  const icoBlob = await createIcoBlob(source, [16, 32, 48], { borderRadius: radius });
  const icoBytes = await blobToUint8Array(icoBlob);
  zipEntries["web/favicon.ico"] = icoBytes;
  zipEntries["favicon.ico"] = icoBytes;

  for (const target of ALL_ICON_TARGETS) {
    if (target.path.endsWith(".ico")) continue;
    const blob = await resizeIconToBlob(source, target.size, {
      opaque: target.opaque,
      background: bg,
      borderRadius: radius,
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
