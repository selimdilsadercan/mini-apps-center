export const APP_TIMEZONE = "Europe/Istanbul";

export function getDateKeyInTimezone(date: Date, timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function isPostponedUntilFutureDay(
  postponedUntil: string | null | undefined,
  now = new Date(),
  timeZone = APP_TIMEZONE,
): boolean {
  if (!postponedUntil) return false;
  return (
    getDateKeyInTimezone(new Date(postponedUntil), timeZone) >
    getDateKeyInTimezone(now, timeZone)
  );
}

export function getTomorrowMidnightIso(timeZone = APP_TIMEZONE): string {
  const tomorrowKey = addDaysToDateKey(getDateKeyInTimezone(new Date(), timeZone), 1);
  if (timeZone === "Europe/Istanbul") {
    return `${tomorrowKey}T00:00:00+03:00`;
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(0, 0, 0, 0);
  return fallback.toISOString();
}

export interface DateKeyword {
  keywords: string[];
  getDate: () => Date;
  color: string;
  label: string;
}

export const DATE_KEYWORDS: DateKeyword[] = [
  {
    keywords: ["bugün", "today"],
    getDate: () => new Date(),
    color: "#3b82f6", // blue-500
    label: "Bugün",
  },
  {
    keywords: ["yarın", "tomorrow"],
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    },
    color: "#10b981", // emerald-500
    label: "Yarın",
  },
  {
    keywords: ["haftaya", "next week"],
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    },
    color: "#8b5cf6", // violet-500
    label: "Gelecek Hafta",
  },
  {
    keywords: ["pazartesi", "monday"],
    getDate: () => getNextDayOfWeek(1),
    color: "#f59e0b", // amber-500
    label: "Pazartesi",
  },
  {
    keywords: ["salı", "tuesday"],
    getDate: () => getNextDayOfWeek(2),
    color: "#f59e0b",
    label: "Salı",
  },
  {
    keywords: ["çarşamba", "wednesday"],
    getDate: () => getNextDayOfWeek(3),
    color: "#f59e0b",
    label: "Çarşamba",
  },
  {
    keywords: ["perşembe", "thursday"],
    getDate: () => getNextDayOfWeek(4),
    color: "#f59e0b",
    label: "Perşembe",
  },
  {
    keywords: ["cuma", "friday"],
    getDate: () => getNextDayOfWeek(5),
    color: "#f59e0b",
    label: "Cuma",
  },
  {
    keywords: ["cumartesi", "saturday"],
    getDate: () => getNextDayOfWeek(6),
    color: "#f59e0b",
    label: "Cumartesi",
  },
  {
    keywords: ["pazar", "sunday"],
    getDate: () => getNextDayOfWeek(0),
    color: "#f59e0b",
    label: "Pazar",
  }
];

function getNextDayOfWeek(dayOfWeek: number): Date {
  const resultDate = new Date();
  resultDate.setDate(resultDate.getDate() + (7 + dayOfWeek - resultDate.getDay()) % 7);
  if (resultDate <= new Date()) {
    resultDate.setDate(resultDate.getDate() + 7);
  }
  return resultDate;
}

export function parseDateKeyword(text: string): { date: Date; keyword: string } | null {
  const lowerText = text.toLowerCase();
  for (const dk of DATE_KEYWORDS) {
    for (const keyword of dk.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        return { date: dk.getDate(), keyword };
      }
    }
  }
  return null;
}

export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
