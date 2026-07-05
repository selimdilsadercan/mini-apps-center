#!/usr/bin/env bun
/** AAB klasörünü aç */
import { openPath } from "../lib/platform";

await openPath("android/app/build/outputs/bundle/release");
