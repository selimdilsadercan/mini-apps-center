import type { AppAssistantModule } from "../lib/assistant-types";

export const pomodoroAssistant: AppAssistantModule = {
  appId: "pomodoro",
  name: "Pomodoro",
  description: "Pomodoro sayacı ve odaklanma yardımcısı.",
  schema: "pomodoro",
  tools: [],
  executors: {},
};
