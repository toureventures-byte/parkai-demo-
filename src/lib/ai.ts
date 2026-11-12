import type { Finding, PropertyReport } from "./types";
import { money } from "./values";

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
