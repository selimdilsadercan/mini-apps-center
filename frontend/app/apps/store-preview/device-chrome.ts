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
  chromeTop: number,
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
    html.store-preview-tablet [class*="max-w-"] {
      max-width: 800px !important;
      width: 100% !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    html.store-preview-tablet body > div {
      width: 100% !important;
    }

    html.store-preview-tablet main {
      padding-left: 24px !important;
      padding-right: 24px !important;
      max-width: 800px !important;
      width: 100% !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    html.store-preview-tablet header > div {
      max-width: 800px !important;
      width: 100% !important;
      margin-left: auto !important;
      margin-right: auto !important;
    }

    html.store-preview-tablet .app-chrome-bottom > div {
      max-width: 800px !important;
      margin-left: auto !important;
      margin-right: auto !important;
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
      padding-top: ${Math.max(0, chromeTop - 18)}px !important;
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
  theme: "light" | "dark" = "dark",
  presetId?: string,
) {
  const scale = exportWidth / viewportWidth;
  const barY = topExport / 2;

  // Draw Dynamic Island if preset is iphone-67 or iphone-65
  if (presetId === "iphone-67" || presetId === "iphone-65") {
    const diWidth = 110 * scale;
    const diHeight = 30 * scale;
    const diX = exportWidth / 2 - diWidth / 2;
    const diY = 11 * scale;

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(diX, diY, diWidth, diHeight, diHeight / 2);
    ctx.fill();

    // Draw Camera Lens inside
    const lensX = diX + 20 * scale;
    const lensY = diY + diHeight / 2;
    const lensR = 4.25 * scale;

    // Lens outer reflection (dark blue-gray gradient)
    const grad = ctx.createRadialGradient(lensX, lensY, 0.5 * scale, lensX, lensY, lensR);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(0.5, "#0f172a");
    grad.addColorStop(1, "#020617");
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensR, 0, Math.PI * 2);
    ctx.fill();

    // Subtle outer border (rgba white for lens rim)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 0.5 * scale;
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensR, 0, Math.PI * 2);
    ctx.stroke();

    // Flare dot (cyan)
    ctx.fillStyle = "rgba(56, 189, 248, 0.6)";
    ctx.beginPath();
    ctx.arc(lensX - 1.5 * scale, lensY - 1.5 * scale, 0.9 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Secondary flare (indigo)
    ctx.fillStyle = "rgba(129, 140, 248, 0.5)";
    ctx.beginPath();
    ctx.arc(lensX + 1.5 * scale, lensY + 1.5 * scale, 0.7 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  const color = theme === "light" ? "#000000" : "#FFFFFF";
  const mutedColor = theme === "light" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.4)";

  // 1. Time (9:41)
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.round(14.5 * scale)}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("9:41", 32 * scale, barY);

  // 2. Status Icons (Cellular, Wifi, Battery) on the right
  let rightX = exportWidth - 32 * scale;

  // A. Battery
  const batWidth = 22 * scale;
  const batHeight = 11.5 * scale;
  const batX = rightX - batWidth;
  const batY = barY - batHeight / 2;

  // Battery Outline
  ctx.strokeStyle = mutedColor;
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.roundRect(batX, batY, batWidth, batHeight, 3.5 * scale);
  ctx.stroke();

  // Battery Fill
  ctx.fillStyle = color;
  const innerPad = 2 * scale;
  const innerW = batWidth - innerPad * 2;
  const innerH = batHeight - innerPad * 2;
  ctx.beginPath();
  ctx.roundRect(batX + innerPad, batY + innerPad, innerW, innerH, 1.5 * scale);
  ctx.fill();

  // Battery Nipple
  const capWidth = 1.3 * scale;
  const capHeight = 4 * scale;
  ctx.fillStyle = mutedColor;
  ctx.beginPath();
  ctx.roundRect(
    batX + batWidth + 1 * scale,
    barY - capHeight / 2,
    capWidth,
    capHeight,
    [0, 1 * scale, 1 * scale, 0]
  );
  ctx.fill();

  // Shift cursor to the left of battery
  rightX -= (batWidth + 7 * scale);

  // B. Wifi Icon (Solid arcs)
  const wifiSize = 13 * scale;
  const wifiX = rightX - wifiSize / 2;
  const wifiY = barY;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5 * scale;
  ctx.lineCap = "round";

  // Wifi Dot
  ctx.beginPath();
  ctx.arc(wifiX, wifiY + 3 * scale, 1.3 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Wifi Arcs
  ctx.beginPath();
  ctx.arc(wifiX, wifiY + 3 * scale, 5 * scale, -Math.PI * 0.72, -Math.PI * 0.28);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(wifiX, wifiY + 3 * scale, 9 * scale, -Math.PI * 0.72, -Math.PI * 0.28);
  ctx.stroke();

  // Shift cursor to the left of Wifi
  rightX -= (wifiSize + 6 * scale);

  // C. Cellular Signal Bars
  const cellWidth = 3 * scale;
  const cellSpacing = 1.5 * scale;
  const cellHeightMax = 10 * scale;
  const cellX = rightX - (cellWidth * 4 + cellSpacing * 3);

  ctx.fillStyle = color;
  for (let i = 0; i < 4; i++) {
    const h = (3 + i * 2.3) * scale;
    const x = cellX + i * (cellWidth + cellSpacing);
    const y = barY + cellHeightMax / 2 - h;
    ctx.beginPath();
    ctx.roundRect(x, y, cellWidth, h, 0.8 * scale);
    ctx.fill();
  }
}

function drawBottomBar(
  ctx: CanvasRenderingContext2D,
  exportWidth: number,
  exportHeight: number,
  bottomExport: number,
  viewportWidth: number,
  theme: "light" | "dark" = "dark",
) {
  const scale = exportWidth / viewportWidth;
  const barW = 134 * scale;
  const barH = 5 * scale;
  const x = exportWidth / 2 - barW / 2;
  const y = exportHeight - bottomExport / 2 - barH / 2;

  ctx.fillStyle = theme === "light" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.92)";
  ctx.beginPath();
  ctx.roundRect(x, y, barW, barH, barH / 2);
  ctx.fill();
}

export async function compositeScreenshot(
  contentDataUrl: string,
  preset: {
    id: string;
    viewportWidth: number;
    viewportHeight: number;
    exportWidth: number;
    exportHeight: number;
  },
  chrome: DeviceChromeConfig,
  theme: "light" | "dark" = "dark",
  bgImageDataUrl?: string,
): Promise<string> {
  const topExport = Math.round(
    preset.exportHeight * (chrome.top / preset.viewportHeight),
  );
  const bottomExport = Math.round(
    preset.exportHeight * (chrome.bottom / preset.viewportHeight),
  );
  const contentExportHeight = preset.exportHeight - topExport;

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

  // 1. Draw background image if provided (cover fill)
  if (bgImageDataUrl) {
    const bgImg = new Image();
    await new Promise<void>((resolve) => {
      bgImg.onload = () => resolve();
      bgImg.onerror = () => resolve();
      bgImg.src = bgImageDataUrl;
    });
    const scale = Math.max(
      preset.exportWidth / bgImg.width,
      preset.exportHeight / bgImg.height,
    );
    const dw = bgImg.width * scale;
    const dh = bgImg.height * scale;
    const dx = (preset.exportWidth - dw) / 2;
    const dy = (preset.exportHeight - dh) / 2;
    ctx.drawImage(bgImg, dx, dy, dw, dh);
  }

  // 2. Draw black status bar background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, preset.exportWidth, topExport);

  // 3. Draw the content image BELOW the status bar zone
  ctx.drawImage(img, 0, topExport, preset.exportWidth, contentExportHeight);

  // 4. Draw status bar icons
  drawStatusBar(ctx, preset.exportWidth, topExport, preset.viewportWidth, theme, preset.id);

  // 5. Draw bottom bar
  if (chrome.bottom > 0) {
    drawBottomBar(
      ctx,
      preset.exportWidth,
      preset.exportHeight,
      bottomExport,
      preset.viewportWidth,
      theme,
    );
  }

  return canvas.toDataURL("image/png");
}
