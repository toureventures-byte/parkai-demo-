import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Trash2, CheckCircle2, Loader2, UploadCloud, X, Users, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { SEVERITY_TONE } from "../lib/format";
import { fmtDay, money } from "../lib/values";
import type { MonthlyParker } from "../lib/types";
import type { NewParker, ParkerRow } from "../lib/monthlyStore";

type Filter = "all" | "flagged" | "pastdue" | "late" | "repeat" | "ending" | "inactive";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "flagged", label: "Flagged" },
  { key: "pastdue", label: "Past due" },
  { key: "late", label: "Late this month" },
  { key: "repeat", label: "Repeat late" },
  { key: "ending", label: "Ending soon" },
  { key: "inactive", label: "Cancelled" },
];

const isInactive = (p: MonthlyParker) => /cancel|inactive|closed|terminat/i.test(p.status);
const field =
  "w-full rounded border border-white/10 bg-navy-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-electric-500/50 focus:outline-none";

function AddParkerDialog({ property, onClose }: { property: string; onClose: () => void }) {
  const { addParker } = useData();
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ name: "", company: "", email: "", vehicle: "", plate: "", space_type: "Standard", rate: "185", start_date: today, end_date: "", card: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const p: NewParker = {
        property, parker_code: null, name: f.name.trim(), company: f.company.trim() || null, email: f.email.trim() || null,
        vehicle: f.vehicle.trim() || null, plate: f.plate.trim().toUpperCase() || null, space_type: f.space_type || null,
        rate: f.rate ? Number(f.rate) : null, start_date: f.start_date || null, end_date: f.end_date || null,
        card: f.card.trim() || null, card_status: "Active", status: "Active",
      };
      await addParker(p);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="add-parker-title">
      <form onSubmit={submit} className="w-full max-w-lg rounded-xl border border-white/10 bg-navy-800 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="add-parker-title" className="text-lg font-semibold text-white">Add a monthly parker</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-slate-400 hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <p className="-mt-3 mb-5 text-xs text-slate-500">Property: {property}</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs text-slate-400">Full name *<input required value={f.name} onChange={set("name")} className={clsx(field, "mt-1")} placeholder="Jane Doe" /></label>
          <label className="text-xs text-slate-400">Company<input value={f.company} onChange={set("company")} className={clsx(field, "mt-1")} /></label>
          <label className="text-xs text-slate-400">Email<input type="email" value={f.email} onChange={set("email")} className={clsx(field, "mt-1")} /></label>
          <label className="text-xs text-slate-400">Vehicle<input value={f.vehicle} onChange={set("vehicle")} className={clsx(field, "mt-1")} placeholder="White Honda Civic" /></label>
          <label className="text-xs text-slate-400">Plate<input value={f.plate} onChange={set("plate")} className={clsx(field, "mt-1")} /></label>
          <label className="text-xs text-slate-400">Space type
            <select value={f.space_type} onChange={set("space_type")} className={clsx(field, "mt-1")}>
              <option>Standard</option><option>Reserved</option><option>Compact</option><option>EV</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">Monthly rate ($) *<input required type="number" min="0" step="0.01" value={f.rate} onChange={set("rate")} className={clsx(field, "mt-1")} /></label>
          <label className="text-xs text-slate-400">Start date<input type="date" value={f.start_date} onChange={set("start_date")} className={clsx(field, "mt-1")} /></label>
          <label className="text-xs text-slate-400">Contract end<input type="date" value={f.end_date} onChange={set("end_date")} className={clsx(field, "mt-1")} /></label>
          <label className="col-span-2 text-xs text-slate-400">Access card #<input value={f.card} onChange={set("card")} className={clsx(field, "mt-1")} /></label>
        </div>
        {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add parker</Button>
        </div>
      </form>
    </div>
  );
}

function ConfirmRemove({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="alertdialog" aria-modal="true" aria-labelledby="remove-title">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-navy-800 p-6 shadow-2xl">
        <h2 id="remove-title" className="text-lg font-semibold text-white">Remove {name}?</h2>
        <p className="mt-2 text-sm text-slate-400">This deletes the parker and their invoice history from your roster. It can't be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Keep</Button>
          <Button variant="danger" disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MonthlyParkers() {
  const { reports, monthly, monthlyStatus, monthlyError, removeParker, markPaid } = useData();
  const { mode } = useAuth();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<{ row: ParkerRow; name: string } | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const properties = useMemo(() => reports.filter((r) => r.monthly).map((r) => r.property), [reports]);
  const property = properties.includes(params.get("p") ?? "") ? params.get("p")! : properties[0];
  const report = reports.find((r) => r.property === property);
  const rowsByCode = useMemo(() => {
    const m = new Map<string, ParkerRow>();
    for (const r of monthly.parkers.filter((p) => p.property === property)) m.set(r.parker_code || r.id.slice(0, 8), r);
    return m;
  }, [monthly.parkers, property]);

  const parkers = report?.monthly?.parkers ?? [];
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, flagged: 0, pastdue: 0, late: 0, repeat: 0, ending: 0, inactive: 0 };
    for (const p of parkers) {
      if (isInactive(p)) { c.inactive++; continue; }
      c.all++;
      if (p.flags.length) c.flagged++;
      for (const f of p.flags) if (f.code in c) c[f.code as Filter]++;
    }
    return c;
  }, [parkers]);

  const shown = parkers
    .filter((p) => {
      if (filter === "inactive") return isInactive(p);
      if (isInactive(p)) return false;
      if (filter === "flagged") return p.flags.length > 0;
      if (filter !== "all") return p.flags.some((f) => f.code === filter);
      return true;
    })
    .filter((p) => !q || `${p.name} ${p.id} ${p.company ?? ""} ${p.plate ?? ""} ${p.vehicle ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const rank = (x: MonthlyParker) => (x.flags.length ? Math.min(...x.flags.map((f) => ({ high: 0, medium: 1, low: 2 })[f.severity])) : 3);
      return rank(a) - rank(b) || b.balance - a.balance || a.name.localeCompare(b.name);
    });

  const owed = parkers.reduce((s, p) => s + p.balance, 0);
  const busy = monthlyStatus === "loading" || monthlyStatus === "saving";

  if (!report?.monthly) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Users className="mx-auto h-10 w-10 text-electric-400" />
        <h1 className="mt-4 text-xl font-semibold text-white">No monthly parkers yet</h1>
        <p className="mt-2 text-sm text-slate-400">
          Upload your monthly roster (and payment history, if you have it) as Excel or CSV. ParkGrid imports it here and flags late payments, past-due accounts and renewals.
        </p>
        {monthlyStatus === "loading" && <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading your roster…</p>}
        {monthlyError && <p className="mt-4 text-sm text-rose-300">{monthlyError}</p>}
        <Link to="/app/data" className="mt-6 inline-flex items-center gap-2 rounded bg-electric-200 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-electric-100">
          <UploadCloud className="h-4 w-4" /> Upload a roster
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Monthly parkers"
        title={property}
        description={`${report.monthly.activeCount} active parkers · billing period ${report.monthly.currentPeriod || "—"} · as of ${fmtDay(report.asOf)}${mode === "demo" ? " · saved in this browser" : ""}`}
        actions={
          <>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Saving" />}
            <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add parker</Button>
          </>
        }
      />

      {properties.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {properties.map((p) => (
            <button key={p} onClick={() => setParams({ p })} className={clsx("rounded-full px-4 py-1.5 text-sm", p === property ? "bg-electric-200 font-medium text-ink" : "bg-white/[0.04] text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08]")}>{p}</button>
          ))}
        </div>
      )}

      {monthlyError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-sm text-rose-200">
          <AlertTriangle className="h-4 w-4" /> Couldn't save that change: {monthlyError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Active parkers", value: report.monthly.activeCount.toLocaleString() },
          { label: "Monthly recurring revenue", value: money(report.monthly.mrr) },
          { label: "Flagged by AI", value: counts.flagged.toLocaleString(), sub: `${counts.pastdue} past due · ${counts.late} late` },
          { label: "Outstanding balance", value: money(owed) },
        ].map((k) => (
          <Card key={k.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{k.value}</p>
            {k.sub && <p className="mt-1 text-xs text-slate-500">{k.sub}</p>}
          </Card>
        ))}
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] p-4">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={clsx("rounded-full px-3 py-1 text-xs", filter === f.key ? "bg-electric-200 font-medium text-ink" : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]")}
              >
                {f.label} <span className={filter === f.key ? "text-ink/70" : "text-slate-500"}>{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, plate, company…" aria-label="Search parkers" className={clsx(field, "pl-8 text-xs")} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-2.5 font-medium">Parker</th>
                <th className="px-3 py-2.5 font-medium">Vehicle</th>
                <th className="px-3 py-2.5 font-medium">Space · rate</th>
                <th className="px-3 py-2.5 font-medium">AI flags</th>
                <th className="px-3 py-2.5 text-right font-medium">Owed</th>
                <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {shown.map((p) => {
                const row = rowsByCode.get(p.id);
                return (
                  <tr key={p.id} className="align-top hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.name}</p>
                      <p className="text-xs text-slate-500">{[row?.parker_code, p.company].filter(Boolean).join(" · ")}</p>
                      {isInactive(p) && <Badge className="mt-1" tone="neutral">{p.status}</Badge>}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">{p.vehicle ?? "—"}<span className="block text-slate-500">{p.plate ?? ""}</span></td>
                    <td className="px-3 py-3 text-xs text-slate-300">{p.spaceType ?? "—"}<span className="block text-slate-500">{p.rate ? `${money(p.rate)}/mo` : ""}{p.end ? ` · ends ${fmtDay(p.end)}` : ""}</span></td>
                    <td className="max-w-md px-3 py-3">
                      {p.flags.length ? (
                        <div className="space-y-1.5">
                          {p.flags.map((f) => (
                            <div key={f.code}>
                              <Badge tone={SEVERITY_TONE[f.severity]}>{f.label}</Badge>
                              <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.reason}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-emerald-300/80"><CheckCircle2 className="h-3.5 w-3.5" /> In good standing</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-white">{p.balance ? money(p.balance) : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {p.balance > 0 && row && (
                          <button
                            onClick={async () => { setPaying(row.id); try { await markPaid(row.id, report.asOf); } finally { setPaying(null); } }}
                            disabled={paying === row.id}
                            className="whitespace-nowrap rounded px-2 py-1 text-xs text-electric-300 ring-1 ring-inset ring-electric-500/30 hover:bg-electric-500/10 disabled:opacity-50"
                          >
                            {paying === row.id ? "Saving…" : "Mark paid"}
                          </button>
                        )}
                        {row && (
                          <button onClick={() => setRemoving({ row, name: p.name })} aria-label={`Remove ${p.name}`} className="rounded p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-rose-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!shown.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No parkers match this view.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {adding && property && <AddParkerDialog property={property} onClose={() => setAdding(false)} />}
      {removing && (
        <ConfirmRemove
          name={removing.name}
          onCancel={() => setRemoving(null)}
          onConfirm={async () => { await removeParker(removing.row.id); setRemoving(null); }}
        />
      )}
    </div>
  );
}
