import path from "path";
import { rootDir } from "./root";

export function backendDir() {
  return path.join(rootDir(), "backend");
}

/** Encore client generate çıktı yolu (frontend/lib/client.ts) */
export const ENCORE_CLIENT_OUTPUT = "../frontend/lib/client.ts";
export const ENCORE_APP_ID = "mini-apps-center-8u7i";
