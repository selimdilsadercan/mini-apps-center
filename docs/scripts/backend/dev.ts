#!/usr/bin/env bun
/** Encore development server */
import { run } from "../lib/exec";
import { backendDir } from "../lib/backend";
import { BACKEND_DEV_PORT } from "../lib/ports";

await run(["encore", "run", "--port", String(BACKEND_DEV_PORT)], backendDir());
