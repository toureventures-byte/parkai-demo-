import type { Cell } from "./types";

/** Turn "$1,234.50", "(12.00)", "45%", 12 into a number. Returns null when not numeric. */
export function toNumber(v: Cell): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean" || v instanceof Date) return null;
  let s = String(v).trim();
  if (!s) return null;
  let neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$€£,\s%]/g, "");
  if (s.startsWith("-")) {
    neg = !neg;
    s = s.slice(1);
  }
  if (!/^\d*\.?\d+$/.test(s)) return null;
  const n = parseFloat(s);
  return neg ? -n : n;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Parse a date or date-time into a "naive" timestamp (ms, as if UTC) so that
 * the day shown in the file is the day we report — no time-zone shifts.
 */
export function toTimestamp(v: Cell): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v === "number") {
    // Excel serial date (roughly years 1990–2100)
    if (v > 32000 && v < 75000) return Math.round((v - 25569) * 86400000);
    return null;
  }
  if (typeof v === "boolean") return null;
  const s = String(v).trim();
  let y: number, mo: number, d: number;
  let rest = "";
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](.*))?$/))) {
    y = +m[1]; mo = +m[2]; d = +m[3]; rest = m[4] ?? "";
  } else if ((m = s.match(/^(?:[A-Za-z]{3,9},?\s+)?(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:\s+(.*))?$/))) {
    mo = +m[1]; d = +m[2]; y = +m[3]; rest = m[4] ?? "";
    if (y < 100) y += 2000;
  } else if ((m = s.match(/^(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})(?:\s+(.*))?$/))) {
    mo = MONTHS[m[1].toLowerCase()] ?? 0; d = +m[2]; y = +m[3]; rest = m[4] ?? "";
  } else {
    return null;
  }
  if (!mo || mo > 12 || !d || d > 31) return null;
  const t = rest ? parseTime(rest) : 0;
  if (t === null) return null;
  return Date.UTC(y, mo - 1, d) + t;
}

/** "07:01 PM", "19:01", "19:01:30" -> ms since midnight */
export function parseTime(v: Cell): number | null {
  if (v instanceof Date) {
    return (v.getUTCHours() * 3600 + v.getUTCMinutes() * 60 + v.getUTCSeconds()) * 1000;
  }
  if (typeof v === "number" && v >= 0 && v < 1) return Math.round(v * 86400000);
  if (typeof v !== "string") return null;
  const m = v.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*([AaPp][Mm])?(?:\s*Z)?$/);
  if (!m) return null;
  let h = +m[1];
  const ap = m[4]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return (h * 3600 + +m[2] * 60 + (m[3] ? +m[3] : 0)) * 1000;
}

export function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function toText(v: Cell): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return dayKey(v.getTime());
  return String(v).trim();
}

export function weekday(day: string): number {
  return new Date(day + "T00:00:00Z").getUTCDay();
}

export function addDays(day: string, n: number): string {
  return dayKey(Date.parse(day + "T00:00:00Z") + n * 86400000);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtDay(day: string, withWeekday = false): string {
  const mo = MONTH_NAMES[+day.slice(5, 7) - 1];
  const s = `${mo} ${+day.slice(8, 10)}`;
  return withWeekday ? `${DOW[weekday(day)]} ${s}` : s;
}

export function fmtRange(days: string[]): string {
  if (!days.length) return "";
  if (days.length === 1) return fmtDay(days[0], true);
  const a = days[0], b = days[days.length - 1];
  const contiguous = daysBetween(a, b) === days.length - 1;
  if (contiguous) {
    return a.slice(0, 7) === b.slice(0, 7)
      ? `${fmtDay(a)}–${+b.slice(8, 10)}`
      : `${fmtDay(a)}–${fmtDay(b)}`;
  }
  return days.map((d) => fmtDay(d)).join(", ");
}

export function money(n: number, cents = false): string {
  const sign = n < 0 ? "-" : "";
  return sign + "$" + Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });
}

export function pct(n: number, digits = 1): string {
  return (n * 100).toFixed(digits) + "%";
}

export function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function sum(xs: number[]): number {
  let t = 0;
  for (const x of xs) t += x;
  return t;
}

/** Split consecutive days into runs. Input must be sorted. */
export function runsOfDays(days: string[]): string[][] {
  const out: string[][] = [];
  for (const d of days) {
    const last = out[out.length - 1];
    if (last && daysBetween(last[last.length - 1], d) === 1) last.push(d);
    else out.push([d]);
  }
  return out;
}
