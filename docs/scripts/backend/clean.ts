#!/usr/bin/env bun
/** Backend node_modules ve .encore temizliği */
import { rm } from "fs/promises";
import path from "path";
import { backendDir } from "../lib/backend";

const dir = backendDir();

await rm(path.join(dir, "node_modules"), { recursive: true, force: true });
await rm(path.join(dir, ".encore"), { recursive: true, force: true });

console.log("Cleaned backend/node_modules and backend/.encore");
