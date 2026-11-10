/* Serialisation helpers: DB rows → plain props for client components. */

export function iso(v: unknown): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** A Postgres `date` as YYYY-MM-DD, whether the driver gave a string or a Date. */
export function ymd(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  return String(v).slice(0, 10);
}

export const txt = (v: unknown) => (v == null ? "" : String(v));
export const num = (v: unknown) => Number(v) || 0;

/** Today's date in the studio's timezone (Tallinn), as YYYY-MM-DD. */
export function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Tallinn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Whole days from today to `due` (negative = overdue). */
export function daysUntil(due: string, today = todayYmd()): number {
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${due}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function dueLabel(due: string): { text: string; tone: "red" | "amber" | "muted" } {
  const n = daysUntil(due);
  if (n < 0) return { text: `Overdue ${-n}d`, tone: "red" };
  if (n === 0) return { text: "Due today", tone: "amber" };
  if (n === 1) return { text: "Due tomorrow", tone: "amber" };
  if (n <= 7) return { text: `Due in ${n}d`, tone: "amber" };
  return {
    text: `Due ${new Date(`${due}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    tone: "muted",
  };
}

export function sourceOf(referrer: string, utmSource: string): string {
  if (utmSource) return `utm: ${utmSource}`;
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return referrer.replace(/^https?:\/\//, "").split("/")[0] || "Direct";
  }
}
