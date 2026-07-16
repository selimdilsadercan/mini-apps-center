export const APP_TIMEZONE = "Europe/Istanbul";

export function getDateKeyInTimezone(date: Date, timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
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
