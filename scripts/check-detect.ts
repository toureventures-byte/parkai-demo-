import { loadPack } from "./load-pack";
const ds = await loadPack(process.argv[2]);
for (const d of ds) {
  const m = Object.entries(d.mapping).filter(([, v]) => v !== null).map(([k, v]) => `${k}=${d.headers[v as number]}`);
  console.log(`\n${d.source} [${d.sheet}] -> ${d.kind} (${d.property}) conf=${d.confidence.toFixed(2)} rows=${d.rows.length}\n  ${m.join(" | ")}\n  unmapped: ${d.headers.filter((_, i) => !Object.values(d.mapping).includes(i)).join(", ")}`);
  console.log("  sample:", JSON.stringify(d.rows[0]));
}
