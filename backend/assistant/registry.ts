import type {
  AppAssistantModule,
  AssistantAppCapabilities,
} from "../lib/assistant-types";
import { AssistantToolError } from "../lib/assistant-tool-error";
import { chocolateDbAssistant } from "../chocolate-db/assistant";
import { dailyWeatherAssistant } from "../daily-weather/assistant";
import { concertListAssistant } from "../concert-list/assistant";
import { friendshipAssistant } from "../friendship/assistant";
import { hobbyCenterAssistant } from "../hobby-center/assistant";
import { iconSetGuideAssistant } from "../icon-set-guide/assistant";
import { iskambilAssistant } from "../iskambil/assistant";
import { ituYemekhaneAssistant } from "../itu-yemekhane/assistant";
import { kilerAssistant } from "../kiler/assistant";
import { mapTrackerAssistant } from "../map-tracker/assistant";
import { memedexAssistant } from "../memedex/assistant";
import { moviesThisYearAssistant } from "../movies-this-year/assistant";
import { recipeAssistant } from "../recipe/assistant";
import { subcenterAssistant } from "../subcenter/assistant";
import { tournamentAssistant } from "../tournament/assistant";
import { tasketAssistant } from "../tasket/assistant";
import { tutorCrmAssistant } from "../tutor-crm/assistant";
import { usersAssistant } from "../users/assistant";
import { workplacesAssistant } from "../workplaces/assistant";
import { boardGameClubsAssistant } from "../board-game-clubs/assistant";
import { pomodoroAssistant } from "../pomodoro/assistant";
import { kimGelirAssistant } from "../kim-gelir/assistant";
import { feedAssistant } from "../feed/assistant";
import { penaltyJarAssistant } from "../penalty-jar/assistant";
import { campusConcertsAssistant } from "../campus-concerts/assistant";
import { birikimAssistant } from "../birikim/assistant";
import { budgetAssistant } from "../budget/assistant";
import { stampCardAssistant } from "../stamp-card/assistant";
import { applyTrackerAssistant } from "../apply-tracker/assistant";

export const APP_ASSISTANTS: AppAssistantModule[] = [
  birikimAssistant,
  kilerAssistant,
  subcenterAssistant,
  recipeAssistant,
  concertListAssistant,
  hobbyCenterAssistant,
  mapTrackerAssistant,
  chocolateDbAssistant,
  memedexAssistant,
  tournamentAssistant,
  iskambilAssistant,
  iconSetGuideAssistant,
  ituYemekhaneAssistant,
  moviesThisYearAssistant,
  friendshipAssistant,
  tasketAssistant,
  tutorCrmAssistant,
  usersAssistant,
  workplacesAssistant,
  boardGameClubsAssistant,
  pomodoroAssistant,
  kimGelirAssistant,
  feedAssistant,
  dailyWeatherAssistant,
  penaltyJarAssistant,
  campusConcertsAssistant,
  budgetAssistant,
  stampCardAssistant,
  applyTrackerAssistant,
];

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

  const executor = module.executors[params.toolName];
  if (!executor) {
    throw new AssistantToolError(
      `No executor defined for tool "${params.toolName}" in app "${params.appId}"`,
    );
  }

  try {
    return await executor({
      userId: params.userId,
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
