export class AssistantToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantToolError";
  }
}

export async function runRpc<T>(
  label: string,
  fn: () => Promise<{ data: T | null; error: { message: string } | null }>,
): Promise<T> {
  const { data, error } = await fn();
  if (error) {
    throw new AssistantToolError(`${label}: ${error.message}`);
  }
  return data as T;
}
