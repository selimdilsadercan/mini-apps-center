/**
 * Malzeme miktarını porsiyon sayısına göre ölçekler.
 * Örn: "200 g" × 2 → "400 g", "1 tatlı kaşığı" × 3 → "3 tatlı kaşığı"
 */

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
};

function formatScaledNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return String(Math.round(rounded));
  }
  return String(rounded).replace(".", ",");
}

function parseLeadingAmount(amount: string): { value: number; rest: string } | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLocaleLowerCase("tr-TR");
  if (lower.startsWith("yarım ")) {
    return { value: 0.5, rest: trimmed.slice(6).trim() };
  }
  if (lower.startsWith("çeyrek ")) {
    return { value: 0.25, rest: trimmed.slice(7).trim() };
  }

  const unicodeMatch = trimmed.match(/^([½¼¾])\s*(.*)$/);
  if (unicodeMatch) {
    return {
      value: UNICODE_FRACTIONS[unicodeMatch[1]],
      rest: unicodeMatch[2].trim(),
    };
  }

  const slashMatch = trimmed.match(/^(\d+)\s*\/\s*(\d+)\s+(.+)$/);
  if (slashMatch) {
    return {
      value: parseInt(slashMatch[1], 10) / parseInt(slashMatch[2], 10),
      rest: slashMatch[3].trim(),
    };
  }

  const decimalMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (decimalMatch) {
    return {
      value: parseFloat(decimalMatch[1].replace(",", ".")),
      rest: decimalMatch[2].trim(),
    };
  }

  return null;
}

export function scaleIngredientAmount(amount: string, servings: number): string {
  if (!amount || servings <= 1) return amount;

  const parsed = parseLeadingAmount(amount);
  if (!parsed) return amount;

  const scaled = parsed.value * servings;
  return `${formatScaledNumber(scaled)} ${parsed.rest}`;
}
