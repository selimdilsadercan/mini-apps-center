import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { pomodoro } from "~encore/clients";

export const pomodoroAssistant: AppAssistantModule = {
  appId: "pomodoro",
  name: "Pomodoro",
  description: "Pomodoro sayacı ve odaklanma yardımcısı.",
  schema: "pomodoro",
  tools: [
    {
      name: "list_sessions",
      description: "Kullanıcının tamamladığı pomodoro oturumlarını listeler.",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    list_sessions: async ({ userId }) => {
      const res = await pomodoro.getSessions({ userId });
      return res.sessions;
    },
  },
};
