#!/usr/bin/env bun
/** iOS build pipeline (macOS only) */
import { capacitorNextBuild, capSync, cleanIosProcesses } from "../lib/capacitor-build";
import { run } from "../lib/exec";
import { frontendDir } from "../lib/frontend";
import { runIncrementVersion } from "../../../frontend/scripts/increment-version.ts";

if (process.platform !== "darwin") {
  console.error("ios script yalnızca macOS üzerinde çalışır.");
  process.exit(1);
}

const args = process.argv.slice(2);
await runIncrementVersion(args);

await cleanIosProcesses();
await capacitorNextBuild();
await capSync();
await run(["bunx", "cap", "open", "ios"], frontendDir());
