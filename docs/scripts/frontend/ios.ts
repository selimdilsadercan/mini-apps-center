#!/usr/bin/env bun
/** iOS build pipeline (macOS only) */
import { capacitorNextBuild, capSync, cleanIosProcesses } from "../lib/capacitor-build";
import { run } from "../lib/exec";
import { frontendDir } from "../lib/frontend";

if (process.platform !== "darwin") {
  console.error("ios script yalnızca macOS üzerinde çalışır.");
  process.exit(1);
}

await cleanIosProcesses();
await capacitorNextBuild();
await capSync();
await run(["bunx", "cap", "open", "ios"], frontendDir());
