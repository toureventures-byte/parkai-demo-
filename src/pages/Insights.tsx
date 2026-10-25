import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Download, Sparkles, UploadCloud, Loader2, AlertTriangle, MessageSquare, FileSpreadsheet } from "lucide-react";
import clsx from "clsx";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { useData } from "../context/DataContext";
import { fmtKpi, fmtPeriod, SEVERITY_LABEL, SEVERITY_TONE } from "../lib/format";
import { fmtDay, money, sum } from "../lib/values";
import type { PropertyReport } from "../lib/types";

const BAR = "#7cdda9";
const FLAG = "#fb7185";

function RevenueChart({ report }: { report: PropertyReport }) {
  const flagged = useMemo(() => new Set(report.findings.flatMap((f) => (f.severity !== "low" ? f.dates ?? [] : []))), [report]);
  const hasRev = report.daily.filter((d) => d.revenue !== undefined).length >= 3;
  const key = hasRev ? "revenue" : report.daily.some((d) => d.entries !== undefined) ? "entries" : "exits";
  const name = key === "revenue" ? "Revenue" : key === "entries" ? "Entries" : "Exits";
  const fmt = (v: number) => (key === "revenue" ? money(v) : `${v.toLocaleString()} cars`);
  const data = report.daily.filter((d) => d[key] !== undefined).map((d) => ({ ...d, value: d[key]!, label: fmtDay(d.date), flagged: flagged.has(d.date) }));
  if (data.length < 3) return null;
  return (
    <Card>
      <CardHeader
        title={key === "revenue" ? "Daily revenue" : `Daily ${name.toLowerCase()}`}
        subtitle={`${data.length} days`}
        action={
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAR }} /> {name}</span>
            {flagged.size > 0 && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: FLAG }} /> Flagged by audit</span>}
          </div>
        }
      />
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" stroke="#7d9a8b" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis stroke="#7d9a8b" fontSize={11} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => { const p = key === "revenue" ? "$" : ""; return v >= 1000 ? `${p}${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${p}${v}`; }} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{ background: "#0b2a20", border: "1px solid #254238", borderRadius: 6, fontSize: 12, color: "#e7f6ee" }}
              labelStyle={{ color: "#a2b8ad" }}
              formatter={(v, _n, p) => [fmt(Number(v)) + ((p?.payload as { flagged?: boolean })?.flagged ? "  · flagged" : ""), name]}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((d) => <Cell key={d.date} fill={d.flagged ? FLAG : BAR} fillOpacity={d.flagged ? 0.95 : 0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function SiteSettings({ property }: { property: string }) {
  const { sites, setSite } = useData();
  const site = sites[property] ?? {};
  const [spaces, setSpaces] = useState(site.spaces ? String(site.spaces) : "");
  const [overnight, setOvernight] = useState(site.overnight ? String(site.overnight) : "");
  useEffect(() => {
    setSpaces(site.spaces ? String(site.spaces) : "");
    setOvernight(site.overnight ? String(site.overnight) : "");
  }, [property, site.spaces, site.overnight]);
  const num = (v: string) => { const n = parseInt(v.replace(/[^\d]/g, ""), 10); return Number.isFinite(n) && n > 0 ? n : undefined; };
  const save = () => setSite(property, { spaces: num(spaces), overnight: num(overnight) });
  const input = "w-24 rounded border border-white/10 bg-navy-900 px-2 py-1 text-sm text-slate-100 focus:border-electric-500/50 focus:outline-none";
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs text-slate-400">
      <label className="flex items-center gap-2">
        Spaces
        <input inputMode="numeric" className={input} value={spaces} placeholder="e.g. 1,500" onChange={(e) => setSpaces(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} />
      </label>
      <label className="flex items-center gap-2">
        Cars parked overnight
        <input inputMode="numeric" className={input} value={overnight} placeholder="optional" onChange={(e) => setOvernight(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && save()} />
      </label>
      <span className="text-slate-500">Used for occupancy. Entry and exit counts can't see cars that never moved, so add your usual overnight count.</span>
    </div>
  );
}

function SummaryCard({ property }: { property: string }) {
  const { summaries, ensureSummary } = useData();
  useEffect(() => ensureSummary(property), [property, ensureSummary]);
  const s = summaries[property];
  const lines = (s?.text ?? "").split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
  return (
    <Card className="border-electric-500/20 bg-electric-500/[0.04]">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-electric-400" />
        <h3 className="text-sm font-semibold text-white">3 things to look at this week</h3>
        {s?.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        {s && !s.loading && <span className="ml-auto text-[11px] text-slate-500">{s.by === "ai" ? "Written by ParkGrid AI" : "From the audit"}</span>}
      </div>
      <ol className="space-y-2">
        {lines.slice(0, 3).map((l, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-200">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-electric-500/15 text-[11px] font-semibold text-electric-300">{i + 1}</span>
            <span>{l}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Findings({ report }: { report: PropertyReport }) {
  const atStake = sum(report.findings.filter((f) => f.severity !== "low").map((f) => f.amount ?? 0));
  return (
    <Card>
      <CardHeader
        title="Audit findings"
        subtitle={report.findings.length ? `${report.findings.length} found${atStake > 0 ? ` · ${money(atStake)} at stake` : ""}` : "Nothing unusual found"}
      />
      {report.findings.length === 0 ? (
        <p className="text-sm text-slate-400">Cash, tickets, lanes and payments look consistent for this period.</p>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {report.findings.map((f) => (
            <li key={f.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                <Badge tone={SEVERITY_TONE[f.severity]} dot>{SEVERITY_LABEL[f.severity]}</Badge>
                <span className="mt-1 text-xs uppercase tracking-wide text-slate-500">{f.category}</span>
                {f.amount ? <span className="ml-auto mt-0.5 text-sm font-semibold text-white">{money(f.amount)}</span> : null}
              </div>
              <p className="mt-2 text-sm font-medium text-white">{f.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{f.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MonthlyFlags({ report }: { report: PropertyReport }) {
  if (!report.monthly) return null;
  const flagged = report.monthly.parkers.filter((p) => p.flags.length).sort((a, b) => {
    const r = (x: typeof a) => Math.min(...x.flags.map((f) => ({ high: 0, medium: 1, low: 2 })[f.severity]));
    return r(a) - r(b) || b.balance - a.balance;
  });
  return (
    <Card padded={false}>
      <div className="p-5 pb-0">
        <CardHeader title="Monthly parkers flagged by AI" subtitle={`${flagged.length} of ${report.monthly.activeCount} active parkers · billing period ${report.monthly.currentPeriod}`} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-y border-white/[0.06] text-xs text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-medium">Parker</th>
              <th className="px-3 py-2.5 font-medium">Flags</th>
              <th className="px-3 py-2.5 font-medium">Why</th>
              <th className="px-5 py-2.5 text-right font-medium">Owed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {flagged.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-5 py-3">
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.id}{p.company ? ` · ${p.company}` : ""}</p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">{p.flags.map((f) => <Badge key={f.code} tone={SEVERITY_TONE[f.severity]}>{f.label}</Badge>)}</div>
                </td>
                <td className="px-3 py-3 text-xs leading-relaxed text-slate-400">{p.flags.map((f) => f.reason).join(" ")}</td>
                <td className="px-5 py-3 text-right font-medium text-white">{p.balance ? money(p.balance) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function Insights() {
  const { reports, datasets, aiStatus, summaries } = useData();
  const [params, setParams] = useSearchParams();
  const [downloading, setDownloading] = useState(false);
  const current = reports.find((r) => r.property === params.get("p")) ?? reports[0];

  if (!current) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <FileSpreadsheet className="mx-auto h-10 w-10 text-electric-400" />
        <h1 className="mt-4 text-xl font-semibold text-white">No data yet</h1>
        <p className="mt-2 text-sm text-slate-400">Upload a ticket export, PARCS file, daily report or monthly roster, and ParkGrid builds the dashboard and audit here.</p>
        <Link to="/app/data" className="mt-6 inline-flex items-center gap-2 rounded bg-electric-200 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-electric-100">
          <UploadCloud className="h-4 w-4" /> Upload data
        </Link>
      </div>
    );
  }

  const download = async () => {
    setDownloading(true);
    try {
      const { downloadReport } = await import("../lib/report");
      await downloadReport(current, summaries[current.property]?.text);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={current.sources.length === 1 ? "1 file" : `${current.sources.length} files`}
        title={current.property}
        description={[fmtPeriod(current.period), current.monthly ? `as of ${fmtDay(current.asOf)}` : ""].filter(Boolean).join(" · ")}
        actions={
          <>
            <Link to="/app/assistant" className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-slate-100 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1]">
              <MessageSquare className="h-3.5 w-3.5" /> Ask ParkGrid
            </Link>
            <Button size="sm" onClick={() => void download()} disabled={downloading}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Download report
            </Button>
          </>
        }
      />

      {reports.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {reports.map((r) => (
            <button
              key={r.property}
              onClick={() => setParams({ p: r.property })}
              className={clsx(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                r.property === current.property ? "bg-electric-200 font-medium text-ink" : "bg-white/[0.04] text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/[0.08]",
              )}
            >
              {r.property}
              {r.findings.some((f) => f.severity === "high") && <span className={clsx("ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle", r.property === current.property ? "bg-rose-600" : "bg-rose-400")} />}
            </button>
          ))}
        </div>
      )}

      {aiStatus === "offline" && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200">
          <AlertTriangle className="h-3.5 w-3.5" /> ParkGrid AI isn't connected, so summaries come straight from the audit. Dashboards and findings are unaffected.
        </div>
      )}

      {current.kinds.includes("traffic") && <SiteSettings property={current.property} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {current.kpis.slice(0, 12).map((k) => (
              <Card key={k.key + k.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{k.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{fmtKpi(k)}</p>
                {k.sub && <p className="mt-1 text-xs text-slate-500">{k.sub}</p>}
              </Card>
            ))}
          </div>
          <RevenueChart report={current} />
          <Findings report={current} />
          <MonthlyFlags report={current} />
        </div>
        <div className="space-y-6">
          <SummaryCard property={current.property} />
          {current.breakdowns.map((b) => (
            <Card key={b.title}>
              <CardHeader title={b.title} />
              <table className="w-full text-sm">
                <tbody className="divide-y divide-white/[0.04]">
                  {(b.countLabel ? b.rows : b.rows.slice(0, 8)).map((r) => (
                    <tr key={r.label}>
                      <td className="py-2 pr-2 text-slate-200">
                        {r.label}
                        {r.note && <span className="block text-xs text-slate-500">{r.note}</span>}
                      </td>
                      {b.countLabel ? (
                        <td className="py-2 text-right font-medium text-white">{r.transactions.toLocaleString()} <span className="text-xs font-normal text-slate-500">{b.countLabel}</span></td>
                      ) : (
                        <>
                          <td className="py-2 pr-2 text-right text-xs text-slate-500">{r.transactions.toLocaleString()} tx</td>
                          <td className="py-2 text-right font-medium text-white">{money(r.revenue)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
          <Card>
            <CardHeader title="Source files" />
            <ul className="space-y-1.5 text-xs text-slate-400">
              {datasets.filter((d) => d.property === current.property).map((d) => (
                <li key={d.id} className="truncate">{d.source}{d.sheet !== "CSV" ? ` · ${d.sheet}` : ""}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
