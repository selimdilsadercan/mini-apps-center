export function iskambilSuitSymbol(categoryTr: string): string {
  switch (categoryTr) {
    case "Tek Kişilik":
      return "♠";
    case "Kozlu / Löf":
      return "♣";
    case "Casino / Bahis":
      return "♦";
    case "Rumi / Okey":
      return "♥";
    default:
      return "♠";
  }
}
