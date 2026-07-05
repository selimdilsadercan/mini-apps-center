import path from "path";
import { rootDir } from "./root";

export function frontendDir() {
  return path.join(rootDir(), "frontend");
}

export const CAPACITOR_ENV = {
  NEXT_PUBLIC_CAPACITOR: "true",
} as const;

export function androidEnv(): Record<string, string> {
  if (process.platform !== "darwin") return {};

  const javaHome = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
  return {
    JAVA_HOME: javaHome,
    PATH: `${javaHome}/bin:${process.env.PATH ?? ""}`,
  };
}
