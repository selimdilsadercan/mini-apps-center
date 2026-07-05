#!/usr/bin/env bun
/** Play Store release build pipeline */
import { capacitorNextBuild, capSync, incrementVersion } from "../lib/capacitor-build";
import { androidEnv } from "../lib/frontend";
import { runGradle } from "../lib/platform";

await incrementVersion();
await capacitorNextBuild();
await capSync();
await runGradle(["assembleDebug", "bundleRelease"], androidEnv());
