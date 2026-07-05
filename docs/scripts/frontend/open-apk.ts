#!/usr/bin/env bun
/** Debug APK klasörünü aç */
import { openPath } from "../lib/platform";

await openPath("android/app/build/outputs/apk/debug");
