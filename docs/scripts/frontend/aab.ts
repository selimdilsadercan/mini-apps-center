#!/usr/bin/env bun
/** Play Store AAB build */
import { incrementVersion } from "../lib/capacitor-build";
import { androidEnv } from "../lib/frontend";
import { runGradle } from "../lib/platform";

await incrementVersion();
await runGradle(["bundleRelease"], androidEnv());
