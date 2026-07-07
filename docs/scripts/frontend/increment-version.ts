#!/usr/bin/env bun
/** Uygulama sürüm numarasını artır */
import { incrementVersion } from "../lib/capacitor-build";

const args = process.argv.slice(2);
await incrementVersion(args);
