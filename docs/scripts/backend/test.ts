#!/usr/bin/env bun
/** Backend test suite (vitest) */
import { run } from "../lib/exec";
import { backendDir } from "../lib/backend";

await run(["bunx", "vitest"], backendDir());
