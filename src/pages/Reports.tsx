import { useState } from "react";
import { FileText, Download, Clock, CalendarClock, Loader2 } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { reports, scheduledReports, type ReportItem } from "../data/reports";

const productFilters = ["All", "Valet", "Self Parking", "Monthly", "Cross-Product"] as const;

const productTone: Record<ReportItem["product"], "electric" | "success" | "violet" | "neutral"> = {
  Valet: "electric",
  "Self Parking": "success",
  Monthly: "violet",
  "Cross-Product": "neutral",
};

export default function Reports() {
  const [filter, setFilter] = useState<(typeof productFilters)[number]>("All");

  const filtered = filter === "All" ? reports : reports.filter((r) => r.product === filter);

  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="Report Center"
        description="Automated DCRs, revenue summaries, validation reports, and exception logs across every product."
        actions={<Button size="sm">+ Generate Report</Button>}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" padded={false}>
          <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] px-5 pt-4">
            {productFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`relative px-3 pb-3 text-sm font-medium transition-colors ${
                  filter === f ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f}
                {filter === f && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-electric-500" />}
              </button>
            ))}
          </div>

          <div className="divide-y divide-white/[0.05]">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                  <FileText className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white">{r.name}</p>
                    <Badge tone={productTone[r.product]}>{r.product}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {r.type} · {r.period} · {r.format}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {r.status === "ready" && (
                    <>
                      <p className="mb-1.5 text-xs text-slate-500">{r.generated}</p>
                      <Button size="sm" variant="secondary"><Download className="h-3.5 w-3.5" /> Download</Button>
                    </>
                  )}
                  {r.status === "generating" && (
                    <Badge tone="electric"><Loader2 className="h-3 w-3 animate-spin" /> Generating</Badge>
                  )}
                  {r.status === "scheduled" && (
                    <Badge tone="neutral"><CalendarClock className="h-3 w-3" /> Scheduled</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Scheduled Automations" subtitle="Recurring report deliveries" />
            <div className="space-y-3">
              {scheduledReports.map((s) => (
                <div key={s.name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <Badge tone={productTone[s.product as ReportItem["product"]] ?? "neutral"}>{s.product}</Badge>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3 w-3" /> {s.cadence}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">To: {s.recipients}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-electric-500/20 bg-electric-500/5">
            <p className="text-sm font-medium text-white">Need a custom report?</p>
            <p className="mt-1.5 text-xs text-slate-400">
              Ask ParkAI Assistant to draft any report in plain English — "compare valet revenue
              this week vs last week" or "list all past-due monthly accounts."
            </p>
            <Button size="sm" className="mt-3">Open Assistant</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
