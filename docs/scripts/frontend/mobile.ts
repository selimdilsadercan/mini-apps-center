#!/usr/bin/env bun
/** Debug APK build pipeline */
import { capacitorNextBuild, capSync } from "../lib/capacitor-build";
import { androidEnv } from "../lib/frontend";
import { runGradle, openPath } from "../lib/platform";

await capacitorNextBuild();
await capSync();
await runGradle(["assembleDebug", "bundleRelease"], androidEnv());
await openPath("android/app/build/outputs/apk/debug");
