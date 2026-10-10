import { loadPack } from "./load-pack";
import { analyzeAll } from "../src/lib/analyze";
import { buildFacts } from "../src/lib/ai";
const reps = analyzeAll(await loadPack(process.argv[2]), new Date(2026, 9, 9));
const f = buildFacts(reps);
console.log("chars", f.length, "≈tokens", Math.round(f.length / 3.8));
console.log(f.slice(0, 1500));
