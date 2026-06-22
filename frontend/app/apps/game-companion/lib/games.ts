import gamesData from "./games.json";

export const MOCK_GAMES = gamesData;

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
    specialPoints: state.specialPoints || undefined,
  };
}
