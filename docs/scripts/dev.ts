#!/usr/bin/env bun
/**
 * Geliştirme ortamını başlatır:
 * - 3000 ve 4000 portlarını temizler
 * - frontend (Next.js), encore (backend), generate:watch süreçlerini paralel çalıştırır
 */
import { rootDir } from "./lib/root";
import { killPorts } from "./lib/kill-ports";
import { runCommand, stopAll, type ManagedProcess } from "./lib/run";

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
  console.log("Clearing ports 3000 and 4000...");
  await killPorts([3000, 4000]);

  trackProcess(
    runCommand(
      "frontend",
      ["bun", "run", "dev"],
      `${root}/frontend`,
      {
        ENCORE_PROXY_TARGET: "http://localhost:4000",
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
