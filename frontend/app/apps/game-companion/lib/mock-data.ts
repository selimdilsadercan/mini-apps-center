// Central mock data for UI-only mode
export const MOCK_USER = {
  uid: "u1",
  displayName: "Antigravity",
  email: "antigravity@test.com",
};

import gamesData from "./games.json";

export const MOCK_GAMES = gamesData;

export const MOCK_PLAYERS: any[] = [];

export const MOCK_GROUPS: any[] = [];

export const MOCK_GAME_LISTS = [
  { _id: "list1", name: "Cafe Oyunları", gameIds: ["g1", "g2", "g3", "g4"] },
  { _id: "list2", name: "Klasik Kutu Oyunları", gameIds: ["g5", "g6", "g7"] },
];

export function mapGameSaveToFrontend(save: any) {
  if (!save) return null;
  const state = save.state || {};
  return {
    ...save,
    _id: save.id,
    gameTemplate: save.game_template,
    createdTime: new Date(save.created_at).getTime(),
    laps: state.laps || [],
    teamLaps: state.teamLaps || [],
    redTeam: state.redTeam || [],
    blueTeam: state.blueTeam || [],
  };
}

