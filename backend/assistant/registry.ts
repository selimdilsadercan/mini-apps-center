import type {
  AppAssistantDefinition,
  AppAssistantModule,
  AssistantAppCapabilities,
} from "../lib/assistant-types";
import { AssistantToolError } from "../lib/assistant-tool-error";
import { chocolateDbAssistantDefinition } from "../chocolate-db/assistant";
import { concertListAssistantDefinition } from "../concert-list/assistant";
import { friendshipAssistantDefinition } from "../friendship/assistant";
import { hobbyCenterAssistantDefinition } from "../hobby-center/assistant";
import { iconSetGuideAssistantDefinition } from "../icon-set-guide/assistant";
import { iskambilAssistantDefinition } from "../iskambil/assistant";
import { ituYemekhaneAssistantDefinition } from "../itu-yemekhane/assistant";
import { kilerAssistantDefinition } from "../kiler/assistant";
import { mapTrackerAssistantDefinition } from "../map-tracker/assistant";
import { memedexAssistantDefinition } from "../memedex/assistant";
import { moviesThisYearAssistantDefinition } from "../movies-this-year/assistant";
import { recipeAssistantDefinition } from "../recipe/assistant";
import { subcenterAssistantDefinition } from "../subcenter/assistant";
import { tournamentAssistantDefinition } from "../tournament/assistant";
import { usersAssistantDefinition } from "../users/assistant";
import { ASSISTANT_EXECUTORS } from "./executors";

const ASSISTANT_DEFINITIONS: AppAssistantDefinition[] = [
  kilerAssistantDefinition,
  subcenterAssistantDefinition,
  recipeAssistantDefinition,
  concertListAssistantDefinition,
  hobbyCenterAssistantDefinition,
  mapTrackerAssistantDefinition,
  chocolateDbAssistantDefinition,
  memedexAssistantDefinition,
  tournamentAssistantDefinition,
  iskambilAssistantDefinition,
  iconSetGuideAssistantDefinition,
  ituYemekhaneAssistantDefinition,
  moviesThisYearAssistantDefinition,
  friendshipAssistantDefinition,
  usersAssistantDefinition,
];

function toModule(definition: AppAssistantDefinition): AppAssistantModule {
  const execute = ASSISTANT_EXECUTORS[definition.appId];
  if (!execute) {
    throw new Error(`Missing executor for app: ${definition.appId}`);
  }
  return { ...definition, execute };
}

export const APP_ASSISTANTS: AppAssistantModule[] =
  ASSISTANT_DEFINITIONS.map(toModule);

const assistantByAppId = new Map(
  APP_ASSISTANTS.map((module) => [module.appId, module]),
);

export function listAssistantCapabilities(): AssistantAppCapabilities[] {
  return APP_ASSISTANTS.map((module) => ({
    appId: module.appId,
    name: module.name,
    description: module.description,
    schema: module.schema,
    tools: module.tools,
  }));
}

export function getAssistantModule(appId: string): AppAssistantModule | undefined {
  return assistantByAppId.get(appId);
}

export async function executeAssistantTool(params: {
  appId: string;
  toolName: string;
  userId: string;
  args: Record<string, unknown>;
}): Promise<unknown> {
  const module = getAssistantModule(params.appId);
  if (!module) {
    throw new AssistantToolError(`Unknown app: ${params.appId}`);
  }

  const tool = module.tools.find((entry) => entry.name === params.toolName);
  if (!tool) {
    throw new AssistantToolError(
      `Unknown tool "${params.toolName}" for app "${params.appId}"`,
    );
  }

  try {
    return await module.execute({
      userId: params.userId,
      toolName: params.toolName,
      args: params.args,
    });
  } catch (error) {
    if (error instanceof AssistantToolError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Tool execution failed";
    throw new AssistantToolError(message);
  }
}
