import Papa from "papaparse";
import type { Cell, RawTable } from "./types";

/** Pick the header row: the first row (in the top 15) with 2+ text cells that is followed by data. */
function splitHeader(source: string, sheet: string, grid: Cell[][]): RawTable | null {
  const rows = grid.filter((r) => r.some((c) => c !== null && c !== ""));
  if (rows.length < 2) return null;
  let hi = 0;
  for (let i = 0; i < Math.min(15, rows.length - 1); i++) {
    const r = rows[i];
    const texts = r.filter((c) => typeof c === "string" && c.trim() && !/^[-$\d.,%/: ]+$/.test(c));
    const nonEmpty = r.filter((c) => c !== null && c !== "").length;
    if (texts.length >= 2 && texts.length >= nonEmpty * 0.6 && rows[i + 1].filter((c) => c !== null && c !== "").length >= Math.min(2, nonEmpty)) {
      hi = i;
      break;
    }
  }
  const width = Math.max(...rows.slice(hi).map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => String(rows[hi][i] ?? "").trim() || `Column ${i + 1}`);
  const body = rows
    .slice(hi + 1)
    .map((r) => Array.from({ length: width }, (_, i) => (r[i] === undefined || r[i] === "" ? null : r[i])))
    // drop repeated header rows (common in PDFs and exports)
    .filter((r) => !r.every((c, i) => c === null || String(c).trim() === headers[i]));
  return { source, sheet, headers, rows: body };
}

export function parseCsvText(source: string, text: string): RawTable[] {
  const res = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: true });
  const t = splitHeader(source, "CSV", res.data as Cell[][]);
  return t ? [t] : [];
}

export async function parseXlsxBuffer(source: string, buf: ArrayBuffer): Promise<RawTable[]> {
  const mod = await import("read-excel-file/universal");
  const readExcelFile = mod.default as unknown as (b: ArrayBuffer) => Promise<{ sheet: string; data: Cell[][] }[]>;
  const sheets = await readExcelFile(buf);
  const out: RawTable[] = [];
  for (const s of sheets) {
    const t = splitHeader(source, s.sheet, s.data);
    if (t && t.rows.length) out.push(t);
  }
  return out;
}

/**
 * Older and other spreadsheet formats (.xls, .xlsb, .ods) via SheetJS.
 * Date cells are rebuilt as UTC dates so the day in the file is the day we report.
 */
export async function parseLegacySheetBuffer(source: string, buf: ArrayBuffer): Promise<RawTable[]> {
  const mod = await import("xlsx");
  const XLSX = ((mod as unknown as { default?: typeof mod }).default?.read ? (mod as unknown as { default: typeof mod }).default : mod) as typeof mod;
  const wb = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: false, cellNF: true });
  const out: RawTable[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws || !ws["!ref"]) continue;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const grid: Cell[][] = [];
    for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 500000); r++) {
      const row: Cell[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        if (!cell || cell.v === undefined || cell.v === null || cell.v === "") {
          row.push(null);
        } else if (cell.t === "n" && cell.z && XLSX.SSF.is_date(String(cell.z))) {
          row.push(new Date(Math.round(((cell.v as number) - 25569) * 86400000)));
        } else if (cell.t === "d" && cell.v instanceof Date) {
          const d = cell.v as Date;
          row.push(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds())));
        } else if (cell.t === "b") {
          row.push(Boolean(cell.v));
        } else if (cell.t === "n") {
          row.push(cell.v as number);
        } else {
          row.push(String(cell.v));
        }
      }
      grid.push(row);
    }
    const t = splitHeader(source, name, grid);
    if (t && t.rows.length) out.push(t);
  }
  return out;
}

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  w: number;
}

/**
 * Rebuild tables from the text positions on PDF pages.
 * Lines are grouped by vertical position; columns are assigned to the nearest header cell.
 */
export function tablesFromPdfItems(source: string, pages: PdfTextItem[][]): RawTable[] {
  type Line = { y: number; items: PdfTextItem[] };
  const allLines: Line[] = [];
  for (const items of pages) {
    const lines: Line[] = [];
    const sorted = items.filter((i) => i.str.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
    for (const it of sorted) {
      const line = lines.find((l) => Math.abs(l.y - it.y) < 3);
      if (line) line.items.push(it);
      else lines.push({ y: it.y, items: [it] });
    }
    for (const l of lines) l.items.sort((a, b) => a.x - b.x);
    allLines.push(...lines);
  }
  // Header = a line of 3+ mostly-text items followed by lines with the same item count.
  let header: Line | null = null;
  for (let i = 0; i < allLines.length - 2; i++) {
    const l = allLines[i];
    const n = l.items.length;
    if (n < 3) continue;
    const textish = l.items.filter((it) => !/^[-$\d.,%/: ]+$/.test(it.str)).length;
    if (textish < n * 0.7) continue;
    const next = allLines.slice(i + 1, i + 4).filter((x) => Math.abs(x.items.length - n) <= 1).length;
    if (next >= 2) {
      header = l;
      break;
    }
  }
  if (!header) return [];
  const centers = header.items.map((it) => it.x + it.w / 2);
  const headers = header.items.map((it) => it.str.trim());
  const rows: Cell[][] = [];
  for (const l of allLines) {
    if (l === header || l.items.length < Math.max(2, headers.length * 0.6)) continue;
    if (l.items.map((i) => i.str.trim()).join("|") === headers.join("|")) continue;
    const row: Cell[] = headers.map(() => null);
    for (const it of l.items) {
      const c = it.x + it.w / 2;
      let best = 0;
      for (let k = 1; k < centers.length; k++) if (Math.abs(centers[k] - c) < Math.abs(centers[best] - c)) best = k;
      row[best] = row[best] === null ? it.str.trim() : `${row[best]} ${it.str.trim()}`;
    }
    rows.push(row);
  }
  return rows.length ? [{ source, sheet: "PDF table", headers, rows }] : [];
}

type PdfJs = {
  getDocument: (src: { data: Uint8Array }) => { promise: Promise<PdfDoc> };
};
type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<{ getTextContent: () => Promise<{ items: { str?: string; transform?: number[]; width?: number }[] }> }>;
};

export async function extractPdfItems(pdfjs: PdfJs, buf: ArrayBuffer): Promise<PdfTextItem[][]> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages: PdfTextItem[][] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 60); p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    pages.push(
      tc.items
        .filter((i) => typeof i.str === "string" && i.transform)
        .map((i) => ({ str: i.str as string, x: i.transform![4], y: i.transform![5], w: i.width ?? 0 })),
    );
  }
  return pages;
}

let pdfjsPromise: Promise<PdfJs> | null = null;
async function browserPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs as unknown as PdfJs;
    })();
  }
  return pdfjsPromise;
}

export class UnsupportedFileError extends Error {}

/** Browser entry point: read any supported file into raw tables. */
export async function readFile(file: File): Promise<RawTable[]> {
  const name = file.name;
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "csv" || ext === "txt" || ext === "tsv" || file.type === "text/csv") return parseCsvText(name, await file.text());
  if (ext === "xlsx" || ext === "xlsm") return parseXlsxBuffer(name, await file.arrayBuffer());
  if (ext === "xls" || ext === "xlsb" || ext === "ods") return parseLegacySheetBuffer(name, await file.arrayBuffer());
  if (ext === "pdf") {
    const items = await extractPdfItems(await browserPdfJs(), await file.arrayBuffer());
    return tablesFromPdfItems(name, items);
  }
  if (ext === "numbers") throw new UnsupportedFileError("Apple Numbers files can't be read directly. In Numbers, choose File → Export To → Excel or CSV, then upload that.");
  throw new UnsupportedFileError(`ParkGrid can't read .${ext} files yet. Use CSV, Excel (.xlsx or .xls) or PDF.`);
}
