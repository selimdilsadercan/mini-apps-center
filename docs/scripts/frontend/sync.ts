#!/usr/bin/env bun
/** Capacitor sync + iOS pod install */
import { capSync } from "../lib/capacitor-build";

await capSync();
