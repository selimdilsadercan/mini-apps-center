export type AssistantPermission = "read" | "create" | "update" | "delete";

export interface AssistantToolParameter {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
}

export interface AssistantToolDefinition {
  name: string;
  description: string;
  permission: AssistantPermission;
  parameters: Record<string, AssistantToolParameter>;
}

export interface AppAssistantDefinition {
  appId: string;
  name: string;
  description: string;
  schema: string;
  tools: AssistantToolDefinition[];
}

export interface AssistantExecuteContext {
  userId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export type AssistantExecutor = (
  ctx: AssistantExecuteContext,
) => Promise<unknown>;

export interface AppAssistantModule extends AppAssistantDefinition {
  execute: AssistantExecutor;
}

export interface AssistantAppCapabilities {
  appId: string;
  name: string;
  description: string;
  schema: string;
  tools: AssistantToolDefinition[];
}
