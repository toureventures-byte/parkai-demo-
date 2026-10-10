import { useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, FileSpreadsheet, FileText, Loader2, Trash2, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useData } from "../context/DataContext";
import { FIELDS, KIND_LABELS, REQUIRED, requiredMet } from "../lib/detect";
import type { Dataset, DatasetKind } from "../lib/types";
import { toText } from "../lib/values";

const KINDS = Object.keys(KIND_LABELS) as DatasetKind[];

function MappingTable({ ds }: { ds: Dataset }) {
  const { setMapping } = useData();
  if (ds.kind === "unknown") {
    return <p className="text-xs text-slate-400">Pick what this file is above, and ParkGrid will map its columns.</p>;
  }
  const required = new Set(REQUIRED[ds.kind].flat());
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2 pr-4 font-medium">ParkGrid field</th>
            <th className="py-2 pr-4 font-medium">Your column</th>
            <th className="py-2 font-medium">Sample values</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {FIELDS[ds.kind].map((f) => {
            const idx = ds.mapping[f.key];
            return (
              <tr key={f.key}>
                <td className="py-2 pr-4 text-slate-300">
                  {f.label}
                  {required.has(f.key) && <span className="ml-1 text-electric-400">*</span>}
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={idx ?? ""}
                    onChange={(e) => setMapping(ds.id, f.key, e.target.value === "" ? null : Number(e.target.value))}
                    className="w-full min-w-[160px] rounded border border-white/10 bg-navy-900 px-2 py-1.5 text-slate-100 focus:border-electric-500/50 focus:outline-none"
                  >
                    <option value="">— not in file —</option>
                    {ds.headers.map((h, i) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                </td>
                <td className="py-2 text-slate-400">
                  {idx === null || idx === undefined
                    ? ""
                    : ds.rows.slice(0, 3).map((r) => toText(r[idx]) || "—").join(" · ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DatasetCard({ ds, properties }: { ds: Dataset; properties: string[] }) {
  const { removeDataset, setKind, setProperty } = useData();
  const [open, setOpen] = useState(false);
  const ok = requiredMet(ds.kind, ds.mapping);
  const isPdf = ds.source.toLowerCase().endsWith(".pdf");
  const missing = ds.kind === "unknown" ? [] : REQUIRED[ds.kind].filter((alts) => !alts.some((k) => ds.mapping[k] != null))
    .map((alts) => FIELDS[ds.kind as Exclude<DatasetKind, "unknown">].find((f) => f.key === alts[0])?.label);
  const mappedCount = Object.values(ds.mapping).filter((v) => v !== null).length;
  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-400">
          {isPdf ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{ds.source}</p>
          <p className="text-xs text-slate-500">
            {ds.sheet !== "CSV" && `${ds.sheet} · `}{ds.rows.length.toLocaleString()} rows · {mappedCount} of {ds.headers.length} columns mapped
          </p>
        </div>
        <select
          value={ds.kind}
          onChange={(e) => setKind(ds.id, e.target.value as DatasetKind)}
          className="rounded border border-white/10 bg-navy-900 px-2 py-1.5 text-xs text-slate-100 focus:outline-none"
          aria-label="File type"
        >
          {KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
        </select>
        {ok ? (
          <Badge tone="success" dot>{ds.mappedBy === "ai" ? "AI-mapped" : ds.mappedBy === "user" ? "Edited" : "Auto-mapped"}</Badge>
        ) : (
          <Badge tone="warning" dot>{ds.kind === "unknown" ? "Needs a type" : "Needs a column"}</Badge>
        )}
        <button onClick={() => removeDataset(ds.id)} className="rounded p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-rose-300" aria-label={`Remove ${ds.source}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.05] px-4 py-3 text-xs">
        <label className="flex items-center gap-2 text-slate-400">
          Property
          <input
            list="pg-properties"
            value={ds.property}
            onChange={(e) => setProperty(ds.id, e.target.value)}
            className="w-56 rounded border border-white/10 bg-navy-900 px-2 py-1.5 text-slate-100 focus:border-electric-500/50 focus:outline-none"
          />
          <datalist id="pg-properties">{properties.map((p) => <option key={p} value={p} />)}</datalist>
        </label>
        {!ok && missing.length > 0 && (
          <span className="flex items-center gap-1 text-amber-300"><AlertTriangle className="h-3.5 w-3.5" /> Map: {missing.join(", ")}</span>
        )}
        <button onClick={() => setOpen((o) => !o)} className="ml-auto flex items-center gap-1 text-slate-300 hover:text-white">
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />} Review column mapping
        </button>
      </div>
      {open && <div className="border-t border-white/[0.05] p-4"><MappingTable ds={ds} /></div>}
    </Card>
  );
}

export default function UploadData() {
  const { datasets, reports, reading, errors, addFiles, loadSample, clearAll } = useData();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const properties = [...new Set(datasets.map((d) => d.property))];
  const usable = datasets.filter((d) => requiredMet(d.kind, d.mapping));

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const files = [...e.dataTransfer.files];
    if (files.length) void addFiles(files);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Data"
        title="Upload your exports"
        description="Drop in the files your gate, valet, LPR or billing systems already produce. ParkGrid figures out what each one is."
        actions={datasets.length > 0 && (
          <>
            <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>
            {usable.length > 0 && (
              <Link to="/app/insights" className="inline-flex items-center gap-1.5 rounded bg-electric-200 px-4 py-2 text-sm font-medium text-ink shadow-glow hover:bg-electric-100">
                View insights <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </>
        )}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={clsx(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          drag ? "border-electric-400 bg-electric-500/10" : "border-white/10 bg-navy-800/40",
        )}
      >
        <UploadCloud className="h-9 w-9 text-electric-400" />
        <p className="mt-3 text-base font-medium text-white">Drop CSV, Excel or PDF files here</p>
        <p className="mt-1 text-sm text-slate-400">Ticket exports, PARCS transactions, daily reports, monthly rosters, payment history</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => input.current?.click()}>Browse files</Button>
          <Button variant="secondary" onClick={() => void loadSample()}>
            <Sparkles className="h-3.5 w-3.5" /> Load sample data
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          multiple
          accept=".csv,.tsv,.txt,.xlsx,.xlsm,.xls,.xlsb,.ods,.pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf"
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length) void addFiles(files);
          }}
        />
      </div>

      {(reading.length > 0 || errors.length > 0) && (
        <div className="mt-4 space-y-2">
          {reading.map((n) => (
            <div key={n} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-electric-400" /> Reading {n}…
            </div>
          ))}
          {errors.map((e) => (
            <div key={e.file} className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span><span className="font-medium">{e.file}:</span> {e.message}</span>
            </div>
          ))}
        </div>
      )}

      {datasets.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              {datasets.length} table{datasets.length > 1 ? "s" : ""} found across {properties.length} propert{properties.length > 1 ? "ies" : "y"}
            </h2>
            {usable.length === datasets.length && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Everything recognized</span>
            )}
          </div>
          <div className="space-y-3">
            {datasets.map((d) => <DatasetCard key={d.id} ds={d} properties={properties} />)}
          </div>
          {reports.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Link to="/app/insights" className="inline-flex items-center gap-2 rounded bg-electric-200 px-6 py-3 text-sm font-semibold text-ink shadow-glow hover:bg-electric-100">
                See dashboards and audit for {reports.length} propert{reports.length > 1 ? "ies" : "y"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
