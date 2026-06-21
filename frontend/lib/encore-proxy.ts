import { Environment, Local } from "./client";

export function getEncoreProxyTarget(): string {
  if (process.env.ENCORE_PROXY_TARGET) {
    return process.env.ENCORE_PROXY_TARGET.replace(/\/$/, "");
  }

  const environment =
    process.env.NEXT_PUBLIC_ENCORE_ENVIRONMENT ||
    process.env.ENCORE_ENVIRONMENT ||
    (process.env.NODE_ENV === "development" ? "local" : "staging");

  if (environment === "local") {
    return Local;
  }

  return Environment(environment);
}
