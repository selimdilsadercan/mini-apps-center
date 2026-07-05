/**
 * Belirtilen portlarda dinleyen süreçleri sonlandırır.
 * macOS / Linux: lsof
 * Windows: netstat + taskkill
 */
export async function killPorts(ports: number[]) {
  for (const port of ports) {
    try {
      if (process.platform === "win32") {
        const find = Bun.spawnSync({
          cmd: ["cmd", "/c", `netstat -ano | findstr :${port}`],
          stdout: "pipe",
        });
        const output = find.stdout.toString();
        const pids = new Set<number>();

        for (const line of output.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.includes("LISTENING")) continue;
          const parts = trimmed.split(/\s+/);
          const pid = Number(parts[parts.length - 1]);
          if (pid > 0) pids.add(pid);
        }

        for (const pid of pids) {
          Bun.spawnSync({ cmd: ["taskkill", "/F", "/PID", String(pid)] });
        }
      } else {
        Bun.spawnSync({
          cmd: ["sh", "-c", `lsof -ti :${port} | xargs kill -9 2>/dev/null || true`],
        });
      }
    } catch {
      // Port zaten boş olabilir
    }
  }
}
