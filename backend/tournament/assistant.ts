import type { AppAssistantDefinition } from "../lib/assistant-types";

export const tournamentAssistantDefinition: AppAssistantDefinition = {
  appId: "tournament",
  name: "Turnuva Merkezi",
  description: "Turnuva oluşturur ve skorları günceller.",
  schema: "tournament",
  tools: [
    {
      name: "list_tournaments",
      description: "Turnuvaları listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_tournament",
      description: "Yeni turnuva oluşturur.",
      permission: "create",
      parameters: {
        name: { type: "string", required: true, description: "Turnuva adı" },
        slug: { type: "string", required: true, description: "URL slug" },
        capacity: { type: "number", required: true, description: "Kapasite" },
        format: {
          type: "string",
          required: true,
          description: "league_knockout | knockout",
        },
        icon: { type: "string", description: "İkon" },
        leagueMatchCount: { type: "number", description: "Lig maç sayısı" },
        advanceCount: { type: "number", description: "Üst tura çıkan" },
        playersPerMatch: { type: "number", description: "Maç başına oyuncu" },
      },
    },
    {
      name: "join_tournament",
      description: "Turnuvaya katılır.",
      permission: "create",
      parameters: {
        slug: { type: "string", required: true, description: "Turnuva slug" },
        username: { type: "string", required: true, description: "Kullanıcı adı" },
        avatar: { type: "string", description: "Avatar URL" },
        avoidList: { type: "array", description: "Kaçınılacak oyuncu id listesi" },
      },
    },
    {
      name: "update_match_score",
      description: "Maç skorunu günceller.",
      permission: "update",
      parameters: {
        matchId: { type: "string", required: true, description: "Maç id" },
        scores: {
          type: "object",
          required: true,
          description: "participantId -> skor",
        },
      },
    },
    {
      name: "delete_tournament",
      description: "Turnuvayı siler.",
      permission: "delete",
      parameters: {
        slug: { type: "string", required: true, description: "Turnuva slug" },
      },
    },
  ],
};
