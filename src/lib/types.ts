export type Cell = string | number | boolean | Date | null;

/** A table as read from a file, before ParkGrid understands it. */
export interface RawTable {
  source: string; // file name
  sheet: string; // sheet name, or "Page table" for PDFs
  headers: string[];
  rows: Cell[][];
}

export type DatasetKind =
  | "transactions"
  | "daily_summary"
  | "daily_activity"
  | "roster"
  | "payments"
  | "unknown";

export type Mapping = Record<string, number | null>; // field -> column index

export interface Dataset {
  id: string;
  source: string;
  sheet: string;
  property: string;
  kind: DatasetKind;
  headers: string[];
  rows: Cell[][];
  mapping: Mapping;
  confidence: number; // 0..1
  mappedBy: "auto" | "ai" | "user";
  /** Roster / payment tables are copied into Monthly parkers; this is how many parkers were imported. */
  imported?: number;
  importError?: string;
}

export type Severity = "high" | "medium" | "low";

export interface Finding {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  amount?: number; // dollars at stake, when known
  dates?: string[];
  names?: string[];
}

export type KpiFormat = "money" | "int" | "pct" | "num";

export interface Kpi {
  key: string;
  label: string;
  value: number;
  format: KpiFormat;
  sub?: string;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  revenue?: number;
  transactions?: number;
  validations?: number;
  occupancy?: number;
}

export interface BreakdownRow {
  label: string;
  transactions: number;
  revenue: number;
  share: number; // share of revenue (0..1)
  note?: string;
}

export interface Breakdown {
  title: string;
  dimension: string;
  rows: BreakdownRow[];
}

export interface MonthlyParker {
  id: string;
  name: string;
  company?: string;
  email?: string;
  vehicle?: string;
  plate?: string;
  spaceType?: string;
  rate?: number;
  start?: string;
  end?: string;
  card?: string;
  cardStatus?: string;
  status: string;
  flags: { code: string; label: string; severity: Severity; reason: string }[];
  balance: number;
  lateCount: number;
  monthsBilled: number;
}

export interface PropertyReport {
  property: string;
  period: { start: string; end: string } | null;
  asOf: string;
  sources: string[];
  kinds: DatasetKind[];
  kpis: Kpi[];
  daily: DailyPoint[];
  breakdowns: Breakdown[];
  findings: Finding[];
  monthly?: { parkers: MonthlyParker[]; activeCount: number; mrr: number; currentPeriod: string };
}
