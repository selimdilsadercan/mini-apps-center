// Central mock data for UI-only mode
export const MOCK_USER = {
  uid: "u1",
  displayName: "Antigravity",
  email: "antigravity@test.com",
};

export const MOCK_GAMES = [
  {
    _id: "g1",
    name: "Carcassonne",
    emoji: "🏰",
    listName: "Popüler",
    settings: {
      gameplay: "herkes-tek",
      calculationMode: "NoPoints",
      roundWinner: "Highest",
    },
  },
  {
    _id: "g2",
    name: "Catan",
    emoji: "🎲",
    listName: "Klasikler",
    settings: {
      gameplay: "herkes-tek",
      calculationMode: "Points",
      roundWinner: "Highest",
    },
  },
  {
    _id: "g3",
    name: "Munchkin",
    emoji: "⚔️",
    listName: "Klasikler",
    settings: {
      gameplay: "herkes-tek",
      calculationMode: "Points",
      roundWinner: "Highest",
    },
  }
];

export const MOCK_PLAYERS = [
  { _id: "p1", name: "Sen (Antigravity)", initial: "S", userId: "u1" },
  { _id: "p2", name: "Mehmet Yılmaz", initial: "M" },
  { _id: "p3", name: "Selin Can", initial: "S" },
  { _id: "p4", name: "Elif Demir", initial: "E", groupId: "group1" },
  { _id: "p5", name: "Burak Kaya", initial: "B", groupId: "group1" },
  { _id: "p6", name: "Derya Çakır", initial: "D", groupId: "group2" },
];

export const MOCK_GROUPS = [
  { _id: "group1", name: "Ev Ekibi", firebaseId: "u1" },
  { _id: "group2", name: "Haftalık Oyun", firebaseId: "u1" },
];

export const MOCK_GAME_LISTS = [
  { _id: "list1", name: "Popüler", gameIds: ["g1", "g2"] },
  { _id: "list2", name: "Klasikler", gameIds: ["g2", "g3"] },
];
