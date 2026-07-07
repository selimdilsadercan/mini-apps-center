import path from "path";
import { run } from "./exec";
import { CAPACITOR_ENV, frontendDir } from "./frontend";
import { removeNextDir } from "./platform";

export async function incrementVersion(args: string[] = []) {
  const cmd = ["bun", "scripts/increment-version.ts", ...args];
  await run(cmd, frontendDir());
}

export async function capacitorNextBuild() {
  const dir = frontendDir();

  await removeNextDir();
  await run(["node", "scripts/toggle-cancelled-apps.js", "hide"], dir);
  await run(["bunx", "next", "build"], dir, { ...CAPACITOR_ENV });
  await run(["node", "scripts/toggle-cancelled-apps.js", "restore"], dir);
}

export async function capSync() {
  const dir = frontendDir();

  await run(["bunx", "cap", "sync"], dir, { CI: "1" });
  await run(["node", "scripts/patch-ios-google-auth-podfile.js"], dir);

  if (process.platform === "darwin") {
    await run(["pod", "install"], path.join(dir, "ios/App"));
  }
}

export async function cleanIosProcesses() {
  if (process.platform !== "darwin") return;

  await runShellSafe("pkill -9 Xcode || true");
  await runShellSafe("pkill -9 Simulator || true");
}

async function runShellSafe(command: string) {
  try {
    if (process.platform === "win32") {
      await Bun.spawn({ cmd: ["cmd", "/c", command], stdout: "ignore", stderr: "ignore" }).exited;
    } else {
      await Bun.spawn({ cmd: ["sh", "-c", command], stdout: "ignore", stderr: "ignore" }).exited;
    }
  } catch {
    // Xcode/Simulator zaten kapalı olabilir
  }
}
