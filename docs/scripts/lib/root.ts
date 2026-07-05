import path from "path";

/** Monorepo kök dizini (docs/scripts/lib -> ../../..) */
export function rootDir() {
  return path.resolve(import.meta.dir, "../../..");
}
