export function requireString(
  args: Record<string, unknown>,
  key: string,
): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing or invalid parameter: ${key}`);
  }
  return value.trim();
}

export function optionalString(
  args: Record<string, unknown>,
  key: string,
): string | null {
  const value = args[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error(`Invalid parameter: ${key}`);
  }
  return value.trim();
}

export function requireNumber(
  args: Record<string, unknown>,
  key: string,
): number {
  const value = args[key];
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Missing or invalid parameter: ${key}`);
  }
  return value;
}

export function optionalNumber(
  args: Record<string, unknown>,
  key: string,
): number | null {
  const value = args[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid parameter: ${key}`);
  }
  return value;
}

export function optionalBoolean(
  args: Record<string, unknown>,
  key: string,
): boolean | null {
  const value = args[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "boolean") {
    throw new Error(`Invalid parameter: ${key}`);
  }
  return value;
}
