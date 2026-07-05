#!/usr/bin/env bun
/** OTA update build */
import { incrementVersion } from "../lib/capacitor-build";
import { run } from "../lib/exec";
import { frontendDir } from "../lib/frontend";

await incrementVersion();
await run(["bunx", "tsx", "scripts/ota-build.ts"], frontendDir());
