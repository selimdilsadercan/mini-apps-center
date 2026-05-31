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

export interface AppAssistantModule extends AppAssistantDefinition {
  executors: Record<
    string,
    (ctx: { userId: string; args: Record<string, any> }) => Promise<any>
  >;
}

export interface AssistantAppCapabilities {
  appId: string;
  name: string;
  description: string;
  schema: string;
  tools: AssistantToolDefinition[];
}
