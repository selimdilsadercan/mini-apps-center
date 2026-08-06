import fs from "fs";
import puppeteer from "puppeteer";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { Browser, LaunchOptions } from "puppeteer";

puppeteerExtra.use(StealthPlugin());

const DEFAULT_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-blink-features=AutomationControlled",
  "--lang=tr-TR,tr",
];

function resolveChromePath(): string | undefined {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
    // Linux (Encore / Docker)
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }

  try {
    const p = puppeteer.executablePath();
    if (p && fs.existsSync(p)) return p;
  } catch {
    // ignore
  }

  return undefined;
}

export async function launchBrowser(
  headed = false,
  options: Pick<LaunchOptions, "defaultViewport" | "args"> = {},
): Promise<Browser> {
  const executablePath = resolveChromePath();
  if (!executablePath) {
    throw new Error(
      "Chrome bulunamadı. Sunucuda `bunx puppeteer browsers install chrome` çalıştırın " +
        "veya PUPPETEER_EXECUTABLE_PATH ortam değişkenini ayarlayın.",
    );
  }

  return puppeteerExtra.launch({
    headless: !headed,
    executablePath,
    args: [...DEFAULT_ARGS, ...(options.args ?? [])],
    defaultViewport: options.defaultViewport ?? { width: 1400, height: 900 },
  });
}
