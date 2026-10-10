import type { Kpi, Severity } from "./types";
import { money } from "./values";

export function fmtKpi(k: Kpi): string {
  switch (k.format) {
    case "money":
      return money(k.value, Math.abs(k.value) < 100 && k.value % 1 !== 0);
    case "pct":
      return `${(k.value * 100).toFixed(1)}%`;
    case "int":
      return Math.round(k.value).toLocaleString("en-US");
    default:
      return k.value.toFixed(1);
  }
}

export const SEVERITY_TONE: Record<Severity, "critical" | "warning" | "neutral"> = {
  high: "critical",
  medium: "warning",
  low: "neutral",
};

export const SEVERITY_LABEL: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low" };

export function fmtPeriod(p: { start: string; end: string } | null): string {
  if (!p) return "";
  const f = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const days = Math.round((Date.parse(p.end) - Date.parse(p.start)) / 86400000) + 1;
  return `${f(p.start)} – ${f(p.end)} · ${days} days`;
}
