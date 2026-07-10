#!/usr/bin/env bun
/** Encore TypeScript client codegen → frontend/lib/client.ts */
import path from "path";
import { readFileSync, writeFileSync } from "fs";
import { run } from "../lib/exec";
import { backendDir, ENCORE_APP_ID, ENCORE_CLIENT_OUTPUT } from "../lib/backend";
import { BACKEND_DEV_URL } from "../lib/ports";

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

const clientPath = path.join(backendDir(), ENCORE_CLIENT_OUTPUT);
const generated = readFileSync(clientPath, "utf-8");
const patched = generated.replace(
  /export const Local: BaseURL = "http:\/\/localhost:\d+"/,
  `export const Local: BaseURL = "${BACKEND_DEV_URL}"`
);
if (patched !== generated) {
  writeFileSync(clientPath, patched);
}
