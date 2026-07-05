#!/usr/bin/env bun
/** Encore secret set (local, dev, prod) */
import { backendDir } from "../lib/backend";

const proc = Bun.spawn({
  cmd: ["encore", "secret", "set", "--type", "local,dev,prod"],
  cwd: backendDir(),
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

process.exit(await proc.exited);
