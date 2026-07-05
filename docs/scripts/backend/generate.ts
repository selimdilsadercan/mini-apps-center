#!/usr/bin/env bun
/** Encore TypeScript client codegen → frontend/lib/client.ts */
import { run } from "../lib/exec";
import { backendDir, ENCORE_APP_ID, ENCORE_CLIENT_OUTPUT } from "../lib/backend";

await run(
  [
    "encore",
    "gen",
    "client",
    ENCORE_APP_ID,
    "-e",
    "local",
    `--output=${ENCORE_CLIENT_OUTPUT}`,
  ],
  backendDir()
);
