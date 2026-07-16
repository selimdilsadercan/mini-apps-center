import type { AppAssistantModule } from "../lib/assistant-types";
import { buyuk_maclar } from "~encore/clients";

export const buyukMaclarAssistant: AppAssistantModule = {
  appId: "buyuk-maclar",
  name: "Büyük Maçlar",
  description:
    "Dünya Kupası, Euro, Copa América, Şampiyonlar Ligi, NBA, F1 ve Avrupa voleybol turnuvalarının maçlarını listeler; bugün ne izlenir önerisi verir.",
  schema: "buyuk_maclar",
  tools: [
    {
      name: "list_big_matches",
      description:
        "Yaklaşan ve canlı büyük turnuva maçlarını listeler (Dünya Kupası, Euro, UCL, NBA, F1, voleybol vb.).",
      permission: "read",
      parameters: {
        sport: {
          type: "string",
          description: "all | football | basketball | volleyball | f1",
        },
        liveOnly: {
          type: "boolean",
          description: "Sadece canlı maçlar",
        },
      },
    },
    {
      name: "what_to_watch",
      description:
        "Bugün / şu an izlenebilecek büyük bir maç önerisi döner (canlı öncelikli).",
      permission: "read",
      parameters: {},
    },
  ],
  executors: {
    list_big_matches: async ({ args }) => {
      const sport =
        args?.sport === "football" ||
        args?.sport === "basketball" ||
        args?.sport === "volleyball" ||
        args?.sport === "f1"
          ? args.sport
          : "all";
      const res = await buyuk_maclar.listMatches({
        sport,
        liveOnly: args?.liveOnly === true,
      });
      return res.matches;
    },
    what_to_watch: async () => {
      const res = await buyuk_maclar.watchSuggestion();
      return res;
    },
  },
};
