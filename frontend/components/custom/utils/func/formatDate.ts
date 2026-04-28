const TZ = "America/New_York";

function toDate(val: string | Date | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  // Strip trailing zone annotations like "[America/New_York]" that the
  // backend appends (JSR-310 ZonedDateTime toString format).
  const cleaned = val.replace(/\[[^\]]+\]$/, "");
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date value (ISO string or Date) as a short date in EST/EDT.
 * e.g. "Apr 14, 2026"
 */
export function fmtDate(val: string | Date | null | undefined): string {
  const d = toDate(val);
  if (!d) return "—";
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
  const d = toDate(val);
  if (!d) return "—";
  return d.toLocaleString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
