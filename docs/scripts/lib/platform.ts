import { rm } from "fs/promises";
import path from "path";
import { run } from "./exec";
import { frontendDir } from "./frontend";

export function gradleCmd(...tasks: string[]) {
  const androidDir = path.join(frontendDir(), "android");
  if (process.platform === "win32") {
    return { cmd: ["cmd", "/c", "gradlew.bat", ...tasks], cwd: androidDir };
  }
  return { cmd: ["./gradlew", ...tasks], cwd: androidDir };
}

export async function runGradle(tasks: string[], env?: Record<string, string>) {
  const { cmd, cwd } = gradleCmd(...tasks);
  await run(cmd, cwd, env);
}

export async function openPath(relativePath: string) {
  const fullPath = path.join(frontendDir(), relativePath);

  if (process.platform === "win32") {
    await run(["explorer", fullPath.replace(/\//g, "\\")]);
    return;
  }

  if (process.platform === "darwin") {
    await run(["open", fullPath]);
    return;
  }

  await run(["xdg-open", fullPath]);
}

export async function removeNextDir() {
  await rm(path.join(frontendDir(), ".next"), { recursive: true, force: true });
}
