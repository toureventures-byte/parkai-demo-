import type { Cell, Dataset } from "./types";
import { FIELDS } from "./detect";
import { dayKey, toNumber, toText, toTimestamp } from "./values";
import { supabase } from "./supabase";
import { BALANCE_ON_FILE } from "./analyze";

export interface ParkerRow {
  id: string;
  property: string;
  parker_code: string | null;
  name: string;
  company: string | null;
  email: string | null;
  vehicle: string | null;
  plate: string | null;
  space_type: string | null;
  rate: number | null;
  start_date: string | null;
  end_date: string | null;
  card: string | null;
  card_status: string | null;
  status: string;
}

export interface InvoiceRow {
  id: string;
  parker_id: string;
  period: string | null;
  amount_due: number;
  due_date: string;
  paid_date: string | null;
  amount_paid: number;
  method: string | null;
}

export type NewParker = Omit<ParkerRow, "id">;

interface Store {
  load(): Promise<{ parkers: ParkerRow[]; invoices: InvoiceRow[] }>;
  replaceProperty(property: string, parkers: NewParker[], invoices: (Omit<InvoiceRow, "id" | "parker_id"> & { parkerKey: string })[]): Promise<void>;
  addParker(p: NewParker): Promise<ParkerRow>;
  removeParker(id: string): Promise<void>;
  markPaid(parkerId: string, paidDate: string): Promise<void>;
}

/* ---------------- Supabase (real accounts) ---------------- */

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

const supabaseStore: Store = {
  async load() {
    const sb = supabase!;
    const page = async <T,>(table: string): Promise<T[]> => {
      const out: T[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await sb.from(table).select("*").order("created_at").range(from, from + 999);
        if (error) throw error;
        out.push(...((data ?? []) as T[]));
        if (!data || data.length < 1000) break;
      }
      return out;
    };
    const [parkers, invoices] = await Promise.all([page<ParkerRow>("parkers"), page<InvoiceRow>("invoices")]);
    return {
      parkers: parkers.map((p) => ({ ...p, rate: num(p.rate) })),
      invoices: invoices.map((i) => ({ ...i, amount_due: Number(i.amount_due), amount_paid: Number(i.amount_paid) })),
    };
  },
  async replaceProperty(property, parkers, invoices) {
    const sb = supabase!;
    const { error: delErr } = await sb.from("parkers").delete().eq("property", property);
    if (delErr) throw delErr;
    const idByKey = new Map<string, string>();
    for (let i = 0; i < parkers.length; i += 500) {
      const { data, error } = await sb.from("parkers").insert(parkers.slice(i, i + 500)).select("id, parker_code, name");
      if (error) throw error;
      for (const r of data ?? []) idByKey.set(keyOf(r.parker_code, r.name), r.id);
    }
    const rows = invoices
      .map(({ parkerKey, ...inv }) => ({ ...inv, parker_id: idByKey.get(parkerKey) }))
      .filter((r): r is typeof r & { parker_id: string } => !!r.parker_id);
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from("invoices").insert(rows.slice(i, i + 500));
      if (error) throw error;
    }
  },
  async addParker(p) {
    const { data, error } = await supabase!.from("parkers").insert(p).select("*").single();
    if (error) throw error;
    return { ...(data as ParkerRow), rate: num((data as ParkerRow).rate) };
  },
  async removeParker(id) {
    const { error } = await supabase!.from("parkers").delete().eq("id", id);
    if (error) throw error;
  },
  async markPaid(parkerId, paidDate) {
    const { data, error } = await supabase!.from("invoices").select("id, amount_due").eq("parker_id", parkerId).is("paid_date", null);
    if (error) throw error;
    for (const inv of data ?? []) {
      const { error: e2 } = await supabase!.from("invoices").update({ paid_date: paidDate, amount_paid: inv.amount_due, method: "Recorded in ParkGrid" }).eq("id", inv.id);
      if (e2) throw e2;
    }
  },
};

/* ---------------- Browser storage (demo mode, no backend) ---------------- */

const LS = "parkgrid-monthly-v1";
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
function readLocal(): { parkers: ParkerRow[]; invoices: InvoiceRow[] } {
  try {
    return JSON.parse(localStorage.getItem(LS) || "") as { parkers: ParkerRow[]; invoices: InvoiceRow[] };
  } catch {
    return { parkers: [], invoices: [] };
  }
}
function writeLocal(d: { parkers: ParkerRow[]; invoices: InvoiceRow[] }) {
  try {
    localStorage.setItem(LS, JSON.stringify(d));
  } catch {
    /* storage full or blocked: changes last until refresh */
  }
}

const localStore: Store = {
  async load() {
    return readLocal();
  },
  async replaceProperty(property, parkers, invoices) {
    const d = readLocal();
    const gone = new Set(d.parkers.filter((p) => p.property === property).map((p) => p.id));
    d.parkers = d.parkers.filter((p) => !gone.has(p.id));
    d.invoices = d.invoices.filter((i) => !gone.has(i.parker_id));
    const idByKey = new Map<string, string>();
    for (const p of parkers) {
      const row = { ...p, id: uid() };
      idByKey.set(keyOf(p.parker_code, p.name), row.id);
      d.parkers.push(row);
    }
    for (const { parkerKey, ...inv } of invoices) {
      const pid = idByKey.get(parkerKey);
      if (pid) d.invoices.push({ ...inv, id: uid(), parker_id: pid });
    }
    writeLocal(d);
  },
  async addParker(p) {
    const d = readLocal();
    const row = { ...p, id: uid() };
    d.parkers.push(row);
    writeLocal(d);
    return row;
  },
  async removeParker(id) {
    const d = readLocal();
    d.parkers = d.parkers.filter((p) => p.id !== id);
    d.invoices = d.invoices.filter((i) => i.parker_id !== id);
    writeLocal(d);
  },
  async markPaid(parkerId, paidDate) {
    const d = readLocal();
    for (const i of d.invoices) if (i.parker_id === parkerId && !i.paid_date) Object.assign(i, { paid_date: paidDate, amount_paid: i.amount_due, method: "Recorded in ParkGrid" });
    writeLocal(d);
  },
};

export const monthlyStore: Store = supabase ? supabaseStore : localStore;

/* ---------------- Conversions ---------------- */

function keyOf(code: string | null | undefined, name: string | null | undefined): string {
  return (code || name || "").trim().toLowerCase();
}

const day = (v: Cell): string | null => {
  const ts = toTimestamp(v);
  return ts === null ? null : dayKey(ts);
};

/** Turn uploaded roster / payment tables into rows for the database. */
export function rowsFromDatasets(property: string, roster?: Dataset, payments?: Dataset) {
  const get = (ds: Dataset, f: string) => {
    const i = ds.mapping[f];
    return (r: Cell[]) => (i === null || i === undefined ? null : r[i] ?? null);
  };
  const parkers = new Map<string, NewParker>();
  const balances: { key: string; bal: number }[] = [];
  if (roster) {
    const g = Object.fromEntries(FIELDS.roster.map((f) => [f.key, get(roster, f.key)]));
    for (const r of roster.rows) {
      const name = toText(g.name(r)), code = toText(g.parkerId(r));
      if (!name && !code) continue;
      parkers.set(keyOf(code, name), {
        property, parker_code: code || null, name: name || code, company: toText(g.company(r)) || null,
        email: toText(g.email(r)) || null, vehicle: toText(g.vehicle(r)) || null, plate: toText(g.plate(r)) || null,
        space_type: toText(g.spaceType(r)) || null, rate: toNumber(g.rate(r)), start_date: day(g.start(r)), end_date: day(g.end(r)),
        card: toText(g.card(r)) || null, card_status: toText(g.cardStatus(r)) || null, status: toText(g.status(r)) || "Active",
      });
      const bal = toNumber(g.balance(r));
      if (bal !== null && bal > 0.5) balances.push({ key: keyOf(code, name), bal });
    }
  }
  const invoices: (Omit<InvoiceRow, "id" | "parker_id"> & { parkerKey: string })[] = [];
  // An account balance with no invoice history is saved as one open "Balance on file" invoice,
  // so it shows as owed and "Mark paid" clears it.
  const today = dayKey(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  for (const { key, bal } of balances) {
    invoices.push({ parkerKey: key, period: BALANCE_ON_FILE, amount_due: bal, due_date: today, paid_date: null, amount_paid: 0, method: null });
  }
  if (payments) {
    const g = Object.fromEntries(FIELDS.payments.map((f) => [f.key, get(payments, f.key)]));
    for (const r of payments.rows) {
      const name = toText(g.name(r)), code = toText(g.parkerId(r));
      const due = day(g.dueDate(r));
      if ((!name && !code) || !due) continue;
      let k = keyOf(code, name);
      if (!parkers.has(k)) {
        // match by name when the roster has codes but payments don't (or vice versa)
        const byName = [...parkers.entries()].find(([, p]) => p.name.toLowerCase() === name.toLowerCase());
        if (byName) k = byName[0];
        else parkers.set(k, { property, parker_code: code || null, name: name || code, company: null, email: null, vehicle: null, plate: null, space_type: null, rate: null, start_date: null, end_date: null, card: null, card_status: null, status: "Active" });
      }
      const paidDate = day(g.paidDate(r));
      const amountDue = toNumber(g.due(r)) ?? parkers.get(k)!.rate ?? 0;
      const amountPaid = toNumber(g.paid(r)) ?? (paidDate ? amountDue : 0);
      invoices.push({
        parkerKey: k, period: toText(g.period(r)) || due.slice(0, 7), amount_due: amountDue, due_date: due,
        paid_date: amountPaid > 0 ? paidDate : null, amount_paid: amountPaid, method: toText(g.method(r)) || null,
      });
    }
  }
  return { parkers: [...parkers.values()], invoices };
}

const utc = (d: string | null): Date | null => (d ? new Date(d + "T00:00:00Z") : null);

/** Turn database rows back into datasets the analysis engine understands. */
export function datasetsFromRows(parkers: ParkerRow[], invoices: InvoiceRow[]): Dataset[] {
  const out: Dataset[] = [];
  const props = [...new Set(parkers.map((p) => p.property))];
  const rKeys = FIELDS.roster.map((f) => f.key);
  const pKeys = FIELDS.payments.map((f) => f.key);
  const identity = (keys: string[]) => Object.fromEntries(keys.map((k, i) => [k, i]));
  for (const property of props) {
    const ps = parkers.filter((p) => p.property === property);
    const byId = new Map(ps.map((p) => [p.id, p]));
    const rosterRows: Cell[][] = ps.map((p) => {
      const v: Record<string, Cell> = {
        parkerId: p.parker_code || p.id.slice(0, 8), name: p.name, company: p.company, email: p.email, vehicle: p.vehicle,
        plate: p.plate, spaceType: p.space_type, rate: p.rate, start: utc(p.start_date), end: utc(p.end_date),
        card: p.card, cardStatus: p.card_status, status: p.status,
      };
      return rKeys.map((k) => v[k] ?? null);
    });
    const invRows: Cell[][] = invoices.filter((i) => byId.has(i.parker_id)).map((i) => {
      const p = byId.get(i.parker_id)!;
      const v: Record<string, Cell> = {
        invoice: i.id.slice(0, 8), parkerId: p.parker_code || p.id.slice(0, 8), name: p.name, period: i.period,
        due: i.amount_due, dueDate: utc(i.due_date), paidDate: utc(i.paid_date), paid: i.amount_paid, method: i.method,
      };
      return pKeys.map((k) => v[k] ?? null);
    });
    const base = { property, source: "Monthly parkers (ParkGrid)", confidence: 1, mappedBy: "auto" as const };
    out.push({ ...base, id: `db-roster-${property}`, sheet: "Roster", kind: "roster", headers: rKeys, rows: rosterRows, mapping: identity(rKeys) });
    if (invRows.length) out.push({ ...base, id: `db-pay-${property}`, sheet: "Invoices", kind: "payments", headers: pKeys, rows: invRows, mapping: identity(pKeys) });
  }
  return out;
}
