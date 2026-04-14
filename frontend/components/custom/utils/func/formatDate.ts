const TZ = "America/New_York";

/**
 * Format a date value (ISO string or Date) as a short date in EST/EDT.
 * e.g. "Apr 14, 2026"
 */
export function fmtDate(val: string | Date | null | undefined): string {
  if (!val) return "—";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date value with time in EST/EDT.
 * e.g. "Apr 14, 2026, 8:47 PM"
 */
export function fmtDateTime(val: string | Date | null | undefined): string {
  if (!val) return "—";
  const d = typeof val === "string" ? new Date(val) : val;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
