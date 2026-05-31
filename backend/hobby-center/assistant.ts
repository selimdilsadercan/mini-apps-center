import type { AppAssistantDefinition } from "../lib/assistant-types";

export const hobbyCenterAssistantDefinition: AppAssistantDefinition = {
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
};
