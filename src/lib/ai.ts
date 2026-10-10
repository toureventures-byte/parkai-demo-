import type { Dataset, Finding, PropertyReport } from "./types";
import { FIELDS, KIND_LABELS } from "./detect";
import { fmtDay, money, toText } from "./values";

export class AiUnavailableError extends Error {
  reason: "not_configured" | "bad_key" | "offline" | "error";
  constructor(reason: AiUnavailableError["reason"], message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

async function post<T>(body: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new AiUnavailableError("offline");
  }
  const j = await r.json().catch(() => ({}));
  if (r.status === 404 || r.status === 405) throw new AiUnavailableError("offline");
  if (r.status === 503) throw new AiUnavailableError(j.error === "bad_key" ? "bad_key" : "not_configured");
  if (!r.ok) throw new AiUnavailableError("error", j.message);
  return j as T;
}

function fmtKpi(k: PropertyReport["kpis"][number]): string {
  const v = k.format === "money" ? money(k.value) : k.format === "pct" ? `${(k.value * 100).toFixed(1)}%` : k.format === "int" ? Math.round(k.value).toLocaleString() : k.value.toFixed(1);
  return `${k.label}: ${v}${k.sub ? ` (${k.sub})` : ""}`;
}

/** Compact, plain-text description of the analysed data that the AI answers from. */
export function buildFacts(reports: PropertyReport[]): string {
  const out: string[] = [];
  for (const r of reports) {
    out.push(`## Property: ${r.property}`);
    if (r.period) out.push(`Period: ${r.period.start} to ${r.period.end}. As of ${r.asOf}. Files: ${r.sources.join(", ")}.`);
    out.push("KPIs (whole period): " + r.kpis.map(fmtKpi).join("; "));
    if (r.findings.length) {
      out.push("Audit findings:");
      for (const f of r.findings) out.push(`- [${f.severity}] ${f.category}: ${f.title}. ${f.detail}${f.amount ? ` (at stake: ${money(f.amount)})` : ""}`);
    } else out.push("Audit findings: none.");
    for (const b of r.breakdowns) {
      out.push(`${b.title}: ` + b.rows.map((x) => `${x.label} ${money(x.revenue)} / ${x.transactions} tx${x.note ? ` / ${x.note}` : ""}`).join("; "));
    }
    if (r.daily.length) {
      const cols = ["revenue", "transactions", "validations", "occupancy"].filter((c) => r.daily.some((d) => d[c as keyof typeof d] !== undefined));
      out.push(`Daily (date,${cols.join(",")}):`);
      for (const d of r.daily) out.push([fmtDay(d.date, true), ...cols.map((c) => d[c as keyof typeof d] ?? "")].join(","));
    }
    if (r.monthly) {
      out.push(`Monthly parkers: ${r.monthly.activeCount} active, MRR ${money(r.monthly.mrr)}, current billing period ${r.monthly.currentPeriod}.`);
      out.push("Roster (id|name|company|space|rate|status|card|contract end|balance owed|late of last 6|flags):");
      for (const p of r.monthly.parkers) {
        out.push([p.id, p.name, p.company ?? "", p.spaceType ?? "", p.rate ?? "", p.status, p.cardStatus ?? "", p.end ?? "", money(p.balance), p.lateCount, p.flags.map((f) => `${f.label}: ${f.reason}`).join(" / ")].join("|"));
      }
    }
    out.push("");
  }
  return out.join("\n");
}

export async function aiSummary(report: PropertyReport): Promise<string> {
  const j = await post<{ text: string }>({ task: "summary", property: report.property, facts: buildFacts([report]) });
  return j.text;
}

export async function aiAsk(question: string, history: { role: string; content: string }[], reports: PropertyReport[]): Promise<string> {
  const j = await post<{ text: string }>({ task: "ask", question, history, facts: buildFacts(reports), asOf: reports[0]?.asOf ?? "" });
  return j.text;
}

export async function aiMap(ds: Dataset): Promise<{ kind: string; mapping: Record<string, number | null> }> {
  const columns = ds.headers.map((h, i) => `${i}: "${h}" e.g. ${ds.rows.slice(0, 3).map((r) => JSON.stringify(toText(r[i]))).join(", ")}`).join("\n");
  const schema = Object.entries(FIELDS).map(([k, fs]) => `${k} (${KIND_LABELS[k as keyof typeof KIND_LABELS]}): ${fs.map((f) => `${f.key}=${f.label}`).join(", ")}`).join("\n");
  return post({ task: "map", fileName: ds.source, columns, schema });
}

/** Used when the AI isn't connected: the top findings, as plain sentences. */
export function autoSummary(report: PropertyReport): string {
  const top = report.findings.slice(0, 3);
  if (!top.length) return "- No problems found in this data. Revenue, cash and tickets look consistent.";
  return top.map((f) => `- ${f.title}${f.amount ? ` (${money(f.amount)} at stake)` : ""}.`).join("\n");
}

const STOP = new Set("the a an is are was were of for to in on at and or any what which who how why did does do this that there my our me show tell about with from have has".split(" "));

/** Keyword answer from the audit when the AI isn't connected. */
export function offlineAnswer(question: string, reports: PropertyReport[]): string {
  const words = question.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const scored: { f: Finding; p: string; s: number }[] = [];
  for (const r of reports) {
    for (const f of r.findings) {
      const head = `${r.property} ${f.category} ${f.title}`.toLowerCase();
      const body = f.detail.toLowerCase();
      const s = words.reduce((acc, w) => {
        const stem = w.replace(/s$/, "");
        return acc + (head.includes(stem) ? 3 : body.includes(stem) ? 1 : 0);
      }, 0);
      if (s) scored.push({ f, p: r.property, s });
    }
  }
  scored.sort((a, b) => b.s - a.s);
  if (!scored.length) return "ParkGrid's AI isn't connected yet, and I couldn't match that question to an audit finding. Try asking about cash, comps, missing tickets, revenue, validations or late payments.";
  const top = scored.filter((x) => x.s >= scored[0].s * 0.6).slice(0, 2);
  return top.map(({ f, p }) => `${p}: ${f.title}. ${f.detail}`).join("\n\n");
}
