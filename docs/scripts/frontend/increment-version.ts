#!/usr/bin/env bun
/** Uygulama sürüm numarasını artır */
import { incrementVersion } from "../lib/capacitor-build";

await incrementVersion();
