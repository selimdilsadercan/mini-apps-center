import type { Ingredient } from "@/lib/text-to-recipe";

export type TextSegment =
  | { type: "text"; value: string }
  | { type: "ingredient"; value: string; ingredientIndex: number };

function getMatchTerms(name: string): string[] {
  const trimmed = name.trim();
  const terms = new Set<string>([trimmed]);
  const words = trimmed.split(/\s+/).filter((w) => w.length >= 3);
  for (const word of words) {
    terms.add(word);
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function segmentInstructionText(text: string, ingredients: Ingredient[]): TextSegment[] {
  if (!text || ingredients.length === 0) {
    return [{ type: "text", value: text }];
  }

  type Match = { start: number; end: number; ingredientIndex: number; matchedText: string };

  const candidates: Match[] = [];

  for (let i = 0; i < ingredients.length; i++) {
    for (const term of getMatchTerms(ingredients[i].name)) {
      const termLower = term.toLocaleLowerCase("tr-TR");
      const regex = new RegExp(`(?<![\\p{L}])(${escapeRegex(termLower)}[\\p{L}]*)`, "giu");
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        candidates.push({
          start: match.index,
          end: match.index + match[0].length,
          ingredientIndex: i,
          matchedText: text.slice(match.index, match.index + match[0].length),
        });
      }
    }
  }

  const used = new Array<boolean>(text.length).fill(false);
  const selected: Match[] = [];

  const sorted = [...candidates].sort(
    (a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start
  );

  for (const candidate of sorted) {
    let overlaps = false;
    for (let i = candidate.start; i < candidate.end; i++) {
      if (used[i]) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    selected.push(candidate);
    for (let i = candidate.start; i < candidate.end; i++) {
      used[i] = true;
    }
  }

  selected.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let pos = 0;

  for (const match of selected) {
    if (match.start > pos) {
      segments.push({ type: "text", value: text.slice(pos, match.start) });
    }
    segments.push({
      type: "ingredient",
      value: match.matchedText,
      ingredientIndex: match.ingredientIndex,
    });
    pos = match.end;
  }

  if (pos < text.length) {
    segments.push({ type: "text", value: text.slice(pos) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}
