import { useState } from "react";
import { ParkingSquare, DollarSign, TicketPercent, AlertOctagon, Wifi, UploadCloud, Download } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import {
  transientTransactions,
  exceptions,
  validations,
  occupancyByGarage,
  occupancyTrend,
  selfParkingKpis,
  gateSystems,
} from "../data/selfParking";

const tabs = ["Transactions", "Validations", "Exceptions", "Gate Systems"] as const;

export default function SelfParkingDashboard() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Transactions");

  return (
    <div>
      <PageHeader
        eyebrow="ParkAI Self Parking"
        title="Self Parking Operations"
        description="Transient revenue, validations, occupancy, and exceptions from gate & CSV data."
        actions={
          <>
            <Button variant="secondary" size="sm"><UploadCloud className="h-3.5 w-3.5" /> Upload CSV</Button>
            <Button size="sm"><Download className="h-3.5 w-3.5" /> Generate DCR</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vehicles On-Site" value={`${selfParkingKpis.vehiclesOnSite}`} icon={ParkingSquare} delta="+21" deltaLabel="vs. yesterday" accent="emerald" />
        <StatCard label="Revenue Today" value={`$${selfParkingKpis.revenueToday.toLocaleString()}`} icon={DollarSign} delta="+7.8%" deltaLabel="vs. yesterday" accent="electric" />
        <StatCard label="Validations Today" value={`${selfParkingKpis.validationsToday}`} icon={TicketPercent} delta="+14%" deltaLabel="week over week" accent="violet" />
        <StatCard label="Open Exceptions" value={`${selfParkingKpis.openExceptions}`} icon={AlertOctagon} delta="-2" deltaLabel="vs. yesterday" trend="down" accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Occupancy Trend" subtitle="Today, all garages combined" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => `${v}%`} />
                <Area type="monotone" dataKey="occ" stroke="#34d399" fill="url(#occGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Occupancy by Garage" subtitle="Live" />
          <div className="space-y-4">
            {occupancyByGarage.map((g) => (
              <div key={g.garage}>
                <ProgressBar
                  value={g.occupied}
                  max={g.capacity}
                  tone={g.occupied / g.capacity > 0.85 ? "amber" : "emerald"}
                  label={`${g.garage} · ${g.occupied}/${g.capacity}`}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex items-center gap-1 border-b border-white/[0.06] px-5 pt-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 pb-3 text-sm font-medium transition-colors ${
                tab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
              {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-electric-500" />}
            </button>
          ))}
        </div>

        {tab === "Transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Ticket</th>
                  <th className="px-5 py-3 font-medium">Gate</th>
                  <th className="px-5 py-3 font-medium">Entry</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Validation</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {transientTransactions.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{t.ticketNo}</td>
                    <td className="px-5 py-3 text-slate-300">{t.gate}</td>
                    <td className="px-5 py-3 text-slate-400">{t.entryTime}</td>
                    <td className="px-5 py-3 text-slate-400">{t.duration}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{t.validation ?? "—"}</td>
                    <td className="px-5 py-3 font-medium text-slate-200">{t.amount > 0 ? `$${t.amount}` : "—"}</td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={t.status === "completed" ? "success" : t.status === "active" ? "electric" : "critical"}
                        dot
                      >
                        {t.status === "completed" ? "Completed" : t.status === "active" ? "Active" : "Exception"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Validations" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Merchant</th>
                  <th className="px-5 py-3 font-medium">Issued Today</th>
                  <th className="px-5 py-3 font-medium">Avg. Discount</th>
                  <th className="px-5 py-3 font-medium">Cost Today</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {validations.map((v) => (
                  <tr key={v.merchant} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-slate-100">{v.merchant}</td>
                    <td className="px-5 py-3 text-slate-300">{v.issuedToday}</td>
                    <td className="px-5 py-3 text-slate-400">{v.avgDiscount}</td>
                    <td className="px-5 py-3 text-slate-200">${v.costToday}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Exceptions" && (
          <div className="divide-y divide-white/[0.05]">
            {exceptions.map((e) => (
              <div key={e.id} className="flex items-start gap-4 p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <AlertOctagon className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{e.type}</p>
                    <Badge tone={e.status === "resolved" ? "success" : "warning"}>{e.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {e.id} · Ticket {e.ticketNo} · {e.gate}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {e.time} · {e.staff}
                    {e.amountWaived > 0 && ` · $${e.amountWaived} waived`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Gate Systems" && (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {gateSystems.map((g) => (
              <div key={g.name} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Wifi className="h-4.5 w-4.5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{g.name}</p>
                  <p className="text-xs text-slate-500">{g.type} · pinged {g.lastPing}</p>
                </div>
                <Badge tone="success" dot>Online</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
