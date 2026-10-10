import { loadPack } from "./load-pack";
import { analyzeAll } from "../src/lib/analyze";
const ds = await loadPack(process.argv[2]);
const t0 = Date.now();
const reps = analyzeAll(ds, new Date(2026, 9, 9));
console.log("analysis ms", Date.now() - t0);
for (const r of reps) {
  console.log(`\n=== ${r.property}  ${r.period?.start}..${r.period?.end} asOf ${r.asOf}`);
  console.log("KPIs:", r.kpis.map((k) => `${k.label}=${k.format === "pct" ? (k.value * 100).toFixed(1) + "%" : Math.round(k.value * 100) / 100}${k.sub ? " (" + k.sub + ")" : ""}`).join(" | "));
  for (const b of r.breakdowns) console.log(" ", b.title, b.rows.slice(0, 6).map((x) => `${x.label}:$${x.revenue}${x.note ? "/" + x.note : ""}`).join(", "));
  for (const f of r.findings) console.log(`  [${f.severity}] ${f.category}: ${f.title}${f.amount ? " ($" + f.amount + ")" : ""}\n      ${f.detail}`);
}
