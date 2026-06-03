import {
  optionalNumber,
  optionalString,
  requireString,
} from "../lib/assistant-params";
import type { AppAssistantModule } from "../lib/assistant-types";
import { board_game_clubs } from "~encore/clients";

export const boardGameClubsAssistant: AppAssistantModule = {
  appId: "board-game-clubs",
  name: "Board Game Clubs",
  description: "Oyun kulüplerini ve oyun kütüphanelerini yönetir.",
  schema: "board_game_clubs",
  tools: [
    {
      name: "list_clubs",
      description: "Kullanıcının sahip olduğu board game kulüplerini listeler.",
      permission: "read",
      parameters: {},
    },
    {
      name: "create_club",
      description: "Yeni bir board game kulübü veya kafe profili oluşturur.",
      permission: "create",
      parameters: {
        name: { type: "string", required: true, description: "Kulüp veya kafe adı" },
        description: { type: "string", description: "Kulüp açıklaması veya lokasyonu" },
        logoUrl: { type: "string", description: "Kulüp logo resmi URL'si" },
      },
    },
    {
      name: "list_club_games",
      description: "Belirli bir kulübün oyun kütüphanesini listeler.",
      permission: "read",
      parameters: {
        clubId: { type: "string", required: true, description: "Kulüp ID'si (UUID)" },
      },
    },
    {
      name: "add_game",
      description: "Kulüp kütüphanesine yeni bir board game ekler.",
      permission: "create",
      parameters: {
        clubId: { type: "string", required: true, description: "Kulüp ID'si (UUID)" },
        title: { type: "string", required: true, description: "Oyun adı" },
        bggId: { type: "number", description: "Varsa BoardGameGeek ID'si" },
        imageUrl: { type: "string", description: "Oyun resim URL'si" },
        minPlayers: { type: "number", description: "Minimum oyuncu sayısı" },
        maxPlayers: { type: "number", description: "Maksimum oyuncu sayısı" },
        playingTime: { type: "number", description: "Ortalama oynanış süresi (dakika)" },
        description: { type: "string", description: "Oyun açıklaması" },
        condition: { type: "string", description: "Oyun durumu: new, good, worn, damaged" },
        notes: { type: "string", description: "Özel notlar (örneğin: eksik parçalar)" },
      },
    },
    {
      name: "search_bgg",
      description: "BoardGameGeek sitesinde oyun arar.",
      permission: "read",
      parameters: {
        query: { type: "string", required: true, description: "Aranacak kelime (örneğin: Catan)" },
      },
    },
  ],
  executors: {
    list_clubs: async ({ userId }) => {
      const res = await board_game_clubs.getUserClubs({ userId });
      return res.clubs;
    },
    create_club: async ({ userId, args }) => {
      const res = await board_game_clubs.createClub({
        ownerId: userId,
        name: requireString(args, "name"),
        description: optionalString(args, "description") ?? undefined,
        logoUrl: optionalString(args, "logoUrl") ?? undefined,
      });
      return res.club ? [res.club] : [];
    },
    list_club_games: async ({ args }) => {
      const res = await board_game_clubs.getClubGames({
        clubId: requireString(args, "clubId"),
      });
      return res.games;
    },
    add_game: async ({ args }) => {
      const res = await board_game_clubs.addClubGame({
        clubId: requireString(args, "clubId"),
        title: requireString(args, "title"),
        bggId: optionalNumber(args, "bggId") ?? undefined,
        imageUrl: optionalString(args, "imageUrl") ?? undefined,
        minPlayers: optionalNumber(args, "minPlayers") ?? undefined,
        maxPlayers: optionalNumber(args, "maxPlayers") ?? undefined,
        playingTime: optionalNumber(args, "playingTime") ?? undefined,
        description: optionalString(args, "description") ?? undefined,
        condition: (optionalString(args, "condition") as any) ?? undefined,
        notes: optionalString(args, "notes") ?? undefined,
      });
      return res.game ? [res.game] : [];
    },
    search_bgg: async ({ args }) => {
      const res = await board_game_clubs.searchBggGames({
        query: requireString(args, "query"),
      });
      return res.results;
    },
  },
};
