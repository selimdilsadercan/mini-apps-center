import { rootDir } from "./root";

export async function run(
  cmd: string[],
  cwd?: string,
  env?: Record<string, string>
) {
  const proc = Bun.spawn({
    cmd,
    cwd: cwd ?? rootDir(),
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, ...env },
  });

  const code = await proc.exited;
  if (code !== 0) process.exit(code ?? 1);
}

export async function runShell(
  command: string,
  cwd?: string,
  env?: Record<string, string>
) {
  if (process.platform === "win32") {
    await run(["cmd", "/c", command], cwd, env);
  } else {
    await run(["sh", "-c", command], cwd, env);
  }
}
