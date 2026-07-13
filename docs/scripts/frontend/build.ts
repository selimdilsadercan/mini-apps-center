#!/usr/bin/env bun
/** Frontend production build (sync games + next build) */
import { run } from "../lib/exec";
import { frontendDir } from "../lib/frontend";

const dir = frontendDir();

await run(["node", "scripts/sync-games.js"], dir);
// Webpack avoids Turbopack panics during static export (Capacitor/OTA builds).
await run(["bunx", "next", "build", "--webpack"], dir);
