#!/usr/bin/env bun
/** Android Gradle clean */
import { runGradle } from "../lib/platform";

await runGradle(["clean"]);
