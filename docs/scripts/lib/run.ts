import type { Subprocess } from "bun";

export type ManagedProcess = {
  name: string;
  proc: Subprocess;
};

export function runCommand(
  name: string,
  cmd: string[],
  cwd: string,
  env?: Record<string, string>
): ManagedProcess {
  console.log(`[${name}] starting: ${cmd.join(" ")}`);

  const proc = Bun.spawn({
    cmd,
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, ...env },
  });

  return { name, proc };
}

export function stopAll(processes: ManagedProcess[]) {
  for (const { name, proc } of processes) {
    try {
      proc.kill();
      console.log(`[${name}] stopped`);
    } catch {
      // already dead
    }
  }
}
