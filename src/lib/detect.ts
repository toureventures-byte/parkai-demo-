import type { Cell, Dataset, DatasetKind, Mapping, RawTable } from "./types";
import { toNumber, toTimestamp, parseTime } from "./values";

type ValueType = "number" | "date" | "time" | "text" | "any";

export interface FieldDef {
  key: string;
  label: string;
  type: ValueType;
  patterns: RegExp[];
}

const f = (key: string, label: string, type: ValueType, ...patterns: RegExp[]): FieldDef => ({ key, label, type, patterns });

/** ParkGrid's standard fields per kind of file, with the header names we recognize. */
export const FIELDS: Record<Exclude<DatasetKind, "unknown">, FieldDef[]> = {
  transactions: [
    f("ticket", "Ticket / transaction #", "any", /^(ticket|trans(action)?|txn|receipt)\s*(#|no|num|number|id)?$/, /^ticket/, /transid/),
    f("entry", "Entry date/time", "date", /^(date\s*\/?\s*time\s*in|entry\s*(date)?\s*(time)?|in\s*(date)?\s*time|check\s*in|time\s*in\s*date|arriv)/, /^date\s*in$/, /^(entry|start)/, /^date$/),
    f("entryTime", "Entry time (if separate)", "time", /^(time\s*in|entry\s*time|in\s*time)$/),
    f("exit", "Exit date/time", "date", /^(date\s*\/?\s*time\s*out|exit|out\s*(date)?\s*time|check\s*out|departure|date\s*out|end)/),
    f("amount", "Fee / rate charged", "number", /^(rate(\s*charged)?|fee|charge|amount(\s*charged)?|gross|ticket\s*value|price|total)$/),
    f("paid", "Amount paid", "number", /^(paid|amount\s*paid|collected|net(\s*collected)?|payment\s*amount|revenue)$/),
    f("payType", "Payment method", "text", /^(pay(ment)?\s*(type|method)|tender|method)/),
    f("lane", "Lane / location", "text", /^(lane|gate|exit\s*lane|location|station|device|terminal|entrance|zone)$/),
    f("staff", "Attendant / cashier", "text", /^(attendant|cashier|valet|employee|staff|operator|driver|user|runner)/),
    f("status", "Status", "text", /^(status|ticket\s*status|state)$/),
    f("compReason", "Comp reason", "text", /comp\s*reason|reason/),
    f("validation", "Validation code", "text", /validation|validator|merchant/),
    f("guestType", "Customer type", "text", /^(guest|customer|parker|rate)\s*type$/, /^type$/),
    f("duration", "Duration (min)", "number", /^(duration|length\s*of\s*stay|los|minutes|stay)/),
  ],
  daily_summary: [
    f("date", "Date", "date", /^(date|day|business\s*date)$/),
    f("transactions", "Transactions", "number", /^(transactions|count|tickets|volume|cars|txns?)$/),
    f("revenue", "Gross revenue", "number", /^(gross(\s*revenue)?|revenue|total(\s*revenue)?|sales)$/),
    f("cashExpected", "Cash expected", "number", /cash\s*(expected|due|sales)|expected\s*cash/),
    f("cashDeposited", "Cash deposited", "number", /cash\s*(deposit(ed)?|counted|actual)|deposit(ed)?/),
    f("variance", "Variance (over/short)", "number", /variance|over\s*\/?\s*short|short|difference|diff/),
    f("staff", "Closing cashier", "text", /cashier|closer|closing|staff|employee|manager/),
  ],
  daily_activity: [
    f("date", "Date", "date", /^(date|day|business\s*date)$/),
    f("monthlyEntries", "Monthly entries", "number", /monthly\s*(entries|in|count)|contract\s*entries/),
    f("transientEntries", "Transient entries", "number", /transient\s*(entries|in|count)|daily\s*entries|visitor/),
    f("validations", "Validations", "number", /validations?/),
    f("revenue", "Revenue", "number", /revenue|sales|gross|collected/),
    f("occupancy", "Occupancy %", "number", /occ(upancy)?/),
  ],
  traffic: [
    f("date", "Date", "date", /^(date|day|business\s*date)$/),
    f("hour", "Hour", "any", /^(hour|time|interval|time\s*slot|hour\s*of\s*day)$/),
    f("entries", "Entries", "number", /^(entries|entry\s*count|ins?|cars\s*in|total\s*entries|entrances?|vehicles\s*in)$/),
    f("exits", "Exits", "number", /^(exits|exit\s*count|outs?|cars\s*out|total\s*exits|vehicles\s*out)$/),
    f("lane", "Lane / gate", "text", /^(lane|gate|device|terminal)$/),
  ],
  roster: [
    f("parkerId", "Parker ID", "text", /^(parker|account|member|customer|permit)\s*(id|#|no|number)$/, /^id$/),
    f("name", "Name", "text", /^(name|parker(\s*name)?|full\s*name|customer(\s*name)?|tenant)$/),
    f("company", "Company", "text", /company|employer|tenant\s*company|organization|org/),
    f("email", "Email", "text", /e-?mail/),
    f("vehicle", "Vehicle", "text", /vehicle|make|model|car$/),
    f("plate", "Plate", "text", /plate|license|lpn|tag/),
    f("spaceType", "Space type", "text", /space|stall|permit\s*type|type$/),
    f("rate", "Monthly rate", "number", /rate|price|monthly\s*fee|amount/),
    f("start", "Start date", "date", /start|begin|since|effective/),
    f("end", "Contract end", "date", /end|expir|term(ination)?|until/),
    f("card", "Access card", "text", /^(access\s*)?card(\s*(#|no|number|id))?$|credential|fob|tag\s*#/),
    f("cardStatus", "Card status", "text", /card\s*status|access\s*status/),
    f("status", "Account status", "text", /^(account\s*)?status$/),
  ],
  payments: [
    f("invoice", "Invoice #", "text", /invoice|bill\s*(#|no|id)|receipt/),
    f("parkerId", "Parker ID", "text", /^(parker|account|member|customer|permit)\s*(id|#|no|number)$/),
    f("name", "Parker name", "text", /^(parker\s*)?name$|customer\s*name|parker$/),
    f("period", "Billing period", "text", /period|month|billing\s*(month|cycle)/),
    f("due", "Amount due", "number", /amount\s*due|due\s*amount|invoice\s*amount|billed|charge/),
    f("dueDate", "Due date", "date", /due\s*date|^due$/),
    f("paidDate", "Paid date", "date", /paid\s*date|payment\s*date|date\s*paid|received/),
    f("paid", "Amount paid", "number", /amount\s*paid|paid\s*amount|^paid$|payment\s*amount|collected/),
    f("method", "Method", "text", /method|pay(ment)?\s*type|tender/),
  ],
};

export const KIND_LABELS: Record<DatasetKind, string> = {
  transactions: "Parking transactions",
  daily_summary: "Daily revenue / cash summary",
  daily_activity: "Daily activity report",
  traffic: "Entries & exits (car counts)",
  roster: "Monthly parker roster",
  payments: "Monthly payment history",
  unknown: "Not recognized",
};

/** Fields a file must have for its kind to be usable. */
export const REQUIRED: Record<Exclude<DatasetKind, "unknown">, string[][]> = {
  transactions: [["entry"], ["amount", "paid"]],
  daily_summary: [["date"], ["revenue", "cashExpected", "cashDeposited", "variance"]],
  daily_activity: [["date"], ["validations", "occupancy", "transientEntries", "monthlyEntries"]],
  traffic: [["date"], ["entries", "exits"]],
  roster: [["name", "parkerId"], ["rate", "plate", "vehicle", "card"]],
  payments: [["parkerId", "name", "invoice"], ["dueDate", "period"], ["paid", "paidDate"]],
};

const norm = (s: string) => s.toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();

type Sniff = Record<ValueType, number> & { serial: number; dateHeader: boolean };

/** Header words that mean "this column holds dates", used to accept bare Excel date numbers. */
const DATE_HEADER = /date|time|day|\b(in|out)\b|entry|exit|arriv|depart|due|paid\s*on|start|end|expir|since|period/;

function sniff(rows: Cell[][], col: number, header: string): Sniff {
  const sample = rows.slice(0, 200).map((r) => r[col]).filter((v) => v !== null && v !== "");
  const n = sample.length || 1;
  let num = 0, date = 0, time = 0, serial = 0;
  for (const v of sample) {
    if (toNumber(v) !== null && !(v instanceof Date)) num++;
    if (toTimestamp(v) !== null && !(typeof v === "number")) date++;
    if (typeof v === "number" && v > 32000 && v < 75000) serial++;
    if (parseTime(v as Cell) !== null) time++;
  }
  return { number: num / n, date: date / n, time: time / n, text: 1, any: 1, serial: serial / n, dateHeader: DATE_HEADER.test(norm(header)) };
}

function typeOk(t: ValueType, s: Sniff): boolean {
  if (t === "number") return s.number > 0.8 && !(s.dateHeader && s.serial > 0.8);
  if (t === "date") return s.date > 0.8 || (s.dateHeader && s.serial > 0.8);
  if (t === "time") return s.time > 0.8 && s.date < 0.5;
  return true;
}

/** Map headers to fields for one kind. Returns mapping and how many fields matched. */
export function mapColumns(kind: Exclude<DatasetKind, "unknown">, headers: string[], rows: Cell[][]): { mapping: Mapping; score: number } {
  const defs = FIELDS[kind];
  const mapping: Mapping = Object.fromEntries(defs.map((d) => [d.key, null]));
  const used = new Set<number>();
  const sniffs = headers.map((h, i) => sniff(rows, i, h));
  let score = 0;
  // Pass by pattern priority: earlier patterns are stronger.
  for (let p = 0; p < 4; p++) {
    for (const d of defs) {
      if (mapping[d.key] !== null || !d.patterns[p]) continue;
      for (let i = 0; i < headers.length; i++) {
        if (used.has(i)) continue;
        if (d.patterns[p].test(norm(headers[i])) && typeOk(d.type, sniffs[i])) {
          mapping[d.key] = i;
          used.add(i);
          score += p === 0 ? 1 : 0.8;
          break;
        }
      }
    }
  }
  return { mapping, score };
}

export function requiredMet(kind: DatasetKind, mapping: Mapping): boolean {
  if (kind === "unknown") return false;
  return REQUIRED[kind].every((alts) => alts.some((k) => mapping[k] !== null && mapping[k] !== undefined));
}

const KIND_ORDER: Exclude<DatasetKind, "unknown">[] = ["payments", "roster", "daily_summary", "daily_activity", "traffic", "transactions"];

/** Guess the property name from a file name like "2_Harbor-Street-Self-Park_PARCS-Export_Aug10-Oct8.xlsx". */
const REPORT_WORDS = new Set(("ticket tickets activity retrieval retrievals detail details by date dates and time times xls xlsx csv pdf report reports " +
  "export exports summary transaction transactions revenue daily weekly monthly valet parcs data the of for from to period " +
  "roster payments payment history audit log sales list all").split(" "));

export function guessProperty(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  // Names like "Ticket Activity Detail By Date (xls) Two Rodeo 01 May 2025": drop report words, dates and numbers.
  if (!base.includes("_")) {
    const words = base.replace(/[()[\],]/g, " ").split(/\s+/).filter(Boolean);
    const keep = words.filter((w) => {
      const lw = w.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!lw) return false;
      if (REPORT_WORDS.has(lw)) return false;
      if (/^\d+$/.test(lw) || /^\d{1,2}[a-z]{3}\d*$/.test(lw)) return false;
      if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*$/.test(lw)) return false;
      return true;
    });
    if (keep.length && keep.length < words.length) return keep.join(" ");
  }
  const STOP = /\b(valet|tickets?|parcs|export|monthly|daily|activity|report|roster|payments?|transactions?|revenue|summary|data|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;
  const parts = base.split(/_| — | - |\s+-\s+/).map((p) => p.replace(/[-]+/g, " ").trim()).filter(Boolean);
  for (const p of parts) {
    if (/^\d+$/.test(p)) continue;
    const words = p.split(/\s+/);
    const keep: string[] = [];
    for (const w of words) {
      if (STOP.test(w) || /\d{2,}/.test(w)) break;
      keep.push(w);
    }
    if (keep.length) return keep.join(" ");
  }
  return base;
}

let counter = 0;

export function detectDataset(t: RawTable): Dataset {
  let best: { kind: DatasetKind; mapping: Mapping; score: number } = { kind: "unknown", mapping: {}, score: 0 };
  for (const kind of KIND_ORDER) {
    const { mapping, score } = mapColumns(kind, t.headers, t.rows);
    if (!requiredMet(kind, mapping)) continue;
    const coverage = score / FIELDS[kind].length;
    const adj = score + coverage; // prefer kinds where more of the file is explained
    if (adj > best.score) best = { kind, mapping, score: adj };
  }
  const kind = best.kind;
  const nFields = kind === "unknown" ? 1 : FIELDS[kind].length;
  const mapped = Object.values(best.mapping).filter((v) => v !== null).length;
  const confidence = kind === "unknown" ? 0 : Math.min(1, 0.5 + 0.5 * (mapped / Math.min(nFields, t.headers.length)));
  return {
    id: `ds${++counter}-${Date.now().toString(36)}`,
    source: t.source,
    sheet: t.sheet,
    property: t.propertyHint || guessProperty(t.source),
    kind,
    headers: t.headers,
    rows: t.rows,
    mapping: best.mapping,
    confidence,
    mappedBy: "auto",
  };
}

/** Re-map an existing dataset as a different kind (user override). */
export function remapAs(ds: Dataset, kind: DatasetKind): Dataset {
  if (kind === "unknown") return { ...ds, kind, mapping: {}, confidence: 0, mappedBy: "user" };
  const { mapping } = mapColumns(kind, ds.headers, ds.rows);
  return { ...ds, kind, mapping, mappedBy: "user", confidence: requiredMet(kind, mapping) ? 0.7 : 0.3 };
}
