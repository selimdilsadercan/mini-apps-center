#!/usr/bin/env bun
/** Android debug APK + release bundle */
import { androidEnv } from "../lib/frontend";
import { runGradle } from "../lib/platform";

await runGradle(["assembleDebug", "bundleRelease"], androidEnv());
