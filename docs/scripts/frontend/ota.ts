#!/usr/bin/env bun
/** OTA update build */
import { runIncrementVersion } from "../../../frontend/scripts/increment-version.ts";
import { run } from "../lib/exec";
import { frontendDir } from "../lib/frontend";

const args = process.argv.slice(2);

await runIncrementVersion(args);
await run(["bun", "scripts/ota-build.ts"], frontendDir());
