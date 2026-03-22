/** ISO date string for the current UTC date (YYYY-MM-DD). */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whether an effective end date is strictly before today (ISO string comparison). */
export function isBeforeDate(effectiveEnd: string, today: string): boolean {
  return effectiveEnd < today;
}
