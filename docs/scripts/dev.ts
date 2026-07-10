#!/usr/bin/env bun
/**
 * Geliştirme ortamını başlatır:
 * - 5000 ve 8000 portlarını temizler
 * - frontend (Next.js), encore (backend), generate:watch süreçlerini paralel çalıştırır
 */
import { rootDir } from "./lib/root";
import { killPorts } from "./lib/kill-ports";
import { runCommand, stopAll, type ManagedProcess } from "./lib/run";
import { BACKEND_DEV_URL, FRONTEND_DEV_PORT, BACKEND_DEV_PORT } from "./lib/ports";

const root = rootDir();
const processes: ManagedProcess[] = [];

function trackProcess(managed: ManagedProcess) {
  processes.push(managed);
  managed.proc.exited.then((code) => {
    if (code !== 0) {
      console.error(`[${managed.name}] exited with code ${code}`);
      stopAll(processes);
      process.exit(code ?? 1);
    }
  });
}

async function main() {
  console.log(`Clearing ports ${FRONTEND_DEV_PORT} and ${BACKEND_DEV_PORT}...`);
  await killPorts([FRONTEND_DEV_PORT, BACKEND_DEV_PORT]);

  trackProcess(
    runCommand(
      "frontend",
      ["bun", "run", "dev"],
      `${root}/frontend`,
      {
        ENCORE_PROXY_TARGET: BACKEND_DEV_URL,
        NEXT_PUBLIC_ENCORE_ENVIRONMENT: "local",
      }
    )
  );

  trackProcess(runCommand("encore", ["bun", "run", "dev"], `${root}/backend`));

  // Encore ayağa kalksın diye client generate watcher'ı biraz gecikmeli başlat
  setTimeout(() => {
    trackProcess(
      runCommand("generate", ["bun", "run", "generate:watch"], `${root}/backend`)
    );
  }, 3000);

  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    stopAll(processes);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Ctrl+C veya süreç hatasına kadar bekle
  await new Promise(() => {});
}

main().catch((err) => {
  console.error(err);
  stopAll(processes);
  process.exit(1);
});
