#!/usr/bin/env bun
/** Encore development server */
import { run } from "../lib/exec";
import { backendDir } from "../lib/backend";

await run(["encore", "run"], backendDir());
