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

function findPuppeteerChrome(): string | undefined {
  const baseDirs = [
    process.env.PUPPETEER_CACHE_DIR,
    process.env.HOME ? `${process.env.HOME}/.cache/puppeteer` : undefined,
    "/root/.cache/puppeteer",
    "/home/encore/.cache/puppeteer",
    "/tmp/.cache/puppeteer",
  ].filter(Boolean) as string[];

  try {
    if (fs.existsSync("/home")) {
      const users = fs.readdirSync("/home");
      for (const u of users) {
        baseDirs.push(`/home/${u}/.cache/puppeteer`);
      }
    }
  } catch {}

  const findInDir = (dir: string, depth = 0): string | undefined => {
    if (depth > 6 || !fs.existsSync(dir)) return undefined;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isFile() && entry.name === "chrome") {
          return fullPath;
        }
        if (entry.isDirectory()) {
          const found = findInDir(fullPath, depth + 1);
          if (found) return found;
        }
      }
    } catch {}
    return undefined;
  };

  for (const base of baseDirs) {
    const found = findInDir(base);
    if (found) return found;
  }

  return undefined;
}

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

  // Scan all .cache/puppeteer locations
  const scanned = findPuppeteerChrome();
  if (scanned) return scanned;

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
