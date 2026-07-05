#!/usr/bin/env bun
/** Backend .ts değişikliklerinde client codegen watcher */
import path from "path";
import { run } from "../lib/exec";
import { backendDir } from "../lib/backend";
import { rootDir } from "../lib/root";

const generateScript = path.join(rootDir(), "docs/scripts/backend/generate.ts");

await run(
  [
    "bunx",
    "nodemon",
    "--watch",
    ".",
    "--ext",
    "ts",
    "--ignore",
    "node_modules",
    "--exec",
    `bun ${generateScript}`,
  ],
  backendDir()
);
