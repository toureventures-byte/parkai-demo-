import { loadPack } from "./load-pack";
import { analyzeAll } from "../src/lib/analyze";
const ds = await loadPack(process.argv[2]);
for (const d of ds) console.log(d.source, "|", d.property, "|", d.kind, d.confidence.toFixed(2), d.headers, d.mapping, d.rows.length, JSON.stringify(d.rows.slice(0, 3)));
const reps = analyzeAll(ds, new Date(), process.argv[3] ? { "Ivy Station": { spaces: +process.argv[3], overnight: process.argv[4] ? +process.argv[4] : undefined } } : {});
for (const r of reps) {
  console.log("\n==", r.property, r.period, "asOf", r.asOf);
  console.log(r.kpis.map((k) => `${k.label}: ${k.value}${k.sub ? " (" + k.sub + ")" : ""}`).join("\n"));
  for (const f of r.findings) console.log(`[${f.severity}] ${f.category} — ${f.title}\n    ${f.detail}`);
  for (const b of r.breakdowns) console.log(b.title, b.rows.slice(0, 24).map((x) => `${x.label}:${x.transactions}${x.note ? "(" + x.note + ")" : ""}`).join(" "));
  console.log("daily", r.daily.length, JSON.stringify(r.daily.slice(0, 3)));
}
