import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseCsvText, parseXlsxBuffer, extractPdfItems, tablesFromPdfItems } from "../src/lib/parse";
import { detectDataset } from "../src/lib/detect";
import type { Dataset, RawTable } from "../src/lib/types";

export async function loadPack(dir: string): Promise<Dataset[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const out: Dataset[] = [];
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    let tables: RawTable[] = [];
    if (f.endsWith(".csv")) tables = parseCsvText(f, readFileSync(p, "utf8"));
    else if (f.endsWith(".xlsx")) { const b = readFileSync(p); tables = await parseXlsxBuffer(f, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); }
    else if (f.endsWith(".pdf")) { const b = readFileSync(p); tables = tablesFromPdfItems(f, await extractPdfItems(pdfjs as never, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))); }
    else continue;
    for (const t of tables) out.push(detectDataset(t));
  }
  return out;
}
