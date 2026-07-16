export interface DeviceChromeConfig {
  top: number;
  bottom: number;
}

const CHROME_BY_PRESET: Record<string, DeviceChromeConfig> = {
  "iphone-67": { top: 47, bottom: 34 },
  "iphone-65": { top: 47, bottom: 34 },
  "iphone-55": { top: 20, bottom: 0 },
  "ipad-129": { top: 24, bottom: 20 },
};

export function getDeviceChrome(presetId: string): DeviceChromeConfig {
  return CHROME_BY_PRESET[presetId] ?? CHROME_BY_PRESET["iphone-67"];
}

export function getContentHeight(
  viewportHeight: number,
  chrome: DeviceChromeConfig,
): number {
  return viewportHeight - chrome.top - chrome.bottom;
}

export function injectIframeViewport(
  doc: Document,
  width: number,
  height: number,
  presetId?: string,
) {
  let meta = doc.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = doc.createElement("meta");
    meta.setAttribute("name", "viewport");
    doc.head.appendChild(meta);
  }
  meta.setAttribute(
    "content",
    `width=${width}, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover`,
  );

  const isTablet = presetId === "ipad-129";
  doc.documentElement.classList.toggle("store-preview-tablet", isTablet);
  doc.documentElement.classList.toggle("store-preview-phone", !isTablet);

  const styleId = "store-preview-frame-styles";
  let style = doc.getElementById(styleId);
  if (!style) {
    style = doc.createElement("style");
    style.id = styleId;
    doc.head.appendChild(style);
  }

  const tabletLayout = isTablet
    ? `
    html.store-preview-tablet .max-w-lg,
    html.store-preview-tablet .max-w-xl,
    html.store-preview-tablet .max-w-md,
    html.store-preview-tablet .max-w-2xl {
      max-width: 100% !important;
      width: 100% !important;
    }

    html.store-preview-tablet main {
      padding-left: 40px !important;
      padding-right: 40px !important;
    }

    html.store-preview-tablet header .max-w-lg,
    html.store-preview-tablet .app-chrome-bottom .max-w-lg {
      max-width: 100% !important;
      padding-left: 40px !important;
      padding-right: 40px !important;
    }

    html.store-preview-tablet main .space-y-10 > section.space-y-3 {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 16px !important;
    }

    html.store-preview-tablet main .space-y-10 > section:not(.space-y-3) .space-y-0 {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 12px !important;
    }

    html.store-preview-tablet .flex.min-h-screen {
      width: 100% !important;
    }
  `
    : "";

  style.textContent = `
    html, body {
      width: ${width}px !important;
      max-width: ${width}px !important;
      min-width: ${width}px !important;
      height: ${height}px !important;
      overflow: hidden !important;
      overflow-x: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
    }
    body * {
      box-sizing: border-box;
    }
    body > div {
      max-width: ${width}px !important;
      width: 100% !important;
      overflow-x: hidden !important;
    }
    ${tabletLayout}
  `;
}

function drawStatusBar(
  ctx: CanvasRenderingContext2D,
  exportWidth: number,
  topExport: number,
  viewportWidth: number,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, exportWidth, topExport);

  const scale = exportWidth / viewportWidth;

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `600 ${Math.round(15 * scale)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("9:41", 28 * scale, topExport / 2);

  const rightX = exportWidth - 28 * scale;
  const barY = topExport / 2;

  ctx.fillStyle = "#FFFFFF";
  for (let i = 0; i < 4; i++) {
    const h = (6 + i * 3) * scale;
    ctx.fillRect(rightX - 18 * scale + i * 5 * scale, barY - h / 2, 3 * scale, h);
  }

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeRect(rightX - 2 * scale, barY - 5 * scale, 22 * scale, 10 * scale);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(rightX + 1 * scale, barY - 2 * scale, 14 * scale, 4 * scale);
}

function drawBottomBar(
  ctx: CanvasRenderingContext2D,
  exportWidth: number,
  exportHeight: number,
  bottomExport: number,
  viewportWidth: number,
) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, exportHeight - bottomExport, exportWidth, bottomExport);

  const scale = exportWidth / viewportWidth;
  const barW = 134 * scale;
  const barH = 5 * scale;
  const x = exportWidth / 2 - barW / 2;
  const y = exportHeight - bottomExport / 2 - barH / 2;

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(x, y, barW, barH, barH / 2);
  ctx.fill();
}

export async function compositeScreenshot(
  contentDataUrl: string,
  preset: {
    viewportWidth: number;
    viewportHeight: number;
    exportWidth: number;
    exportHeight: number;
  },
  chrome: DeviceChromeConfig,
): Promise<string> {
  const topExport = Math.round(
    preset.exportHeight * (chrome.top / preset.viewportHeight),
  );
  const bottomExport = Math.round(
    preset.exportHeight * (chrome.bottom / preset.viewportHeight),
  );
  const contentExportH = preset.exportHeight - topExport - bottomExport;

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = contentDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = preset.exportWidth;
  canvas.height = preset.exportHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, topExport, preset.exportWidth, contentExportH);

  drawStatusBar(ctx, preset.exportWidth, topExport, preset.viewportWidth);
  if (chrome.bottom > 0) {
    drawBottomBar(
      ctx,
      preset.exportWidth,
      preset.exportHeight,
      bottomExport,
      preset.viewportWidth,
    );
  }

  return canvas.toDataURL("image/png");
}
