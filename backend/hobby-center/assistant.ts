import {
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { hobby_center } from "~encore/clients";

export const hobbyCenterAssistant: AppAssistantModule = {
  appId: "hobby-center",
  name: "Hobby Center",
  description: "Hobi ilerlemesini günceller.",
  schema: "hobby_center",
  tools: [
    {
      name: "list_hobbies",
      description: "Kullanıcının hobi kayıtlarını listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "update_hobby",
      description: "Hobi durumunu ve notları günceller.",
      permission: "update",
      parameters: {
        hobbyId: { type: "string", required: true, description: "Hobi id" },
        status: {
          type: "string",
          required: true,
          description: "interested | in_progress | learned",
        },
        notes: { type: "string", required: true, description: "Notlar" },
        completedSteps: {
          type: "array",
          required: true,
          description: "Tamamlanan adım numaraları",
        },
      },
    },
  ],
  executors: {
    list_hobbies: async ({ userId }) => {
      const res = await hobby_center.getUserHobbies({ userId });
      return res.tracks;
    },
    update_hobby: async ({ userId, args }) => {
      const res = await hobby_center.updateUserHobby({
        userId,
        hobbyId: requireString(args, "hobbyId"),
        status: requireString(args, "status") as any,
        notes: requireString(args, "notes"),
        completedSteps: (args.completedSteps as any) ?? [],
      });
      return res.track ? [res.track] : [];
    },
  },
};
