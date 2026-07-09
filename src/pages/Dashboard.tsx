import { Car, ParkingSquare, Building2, DollarSign, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { valetKpis, valetRevenue7d } from "../data/valet";
import { selfParkingKpis } from "../data/selfParking";
import { monthlyKpis } from "../data/monthly";
import { activityFeed } from "../data/activity";
import { aiInsights } from "../data/activity";
import { property } from "../data/property";

const combinedRevenue = valetRevenue7d.map((d, i) => ({
  day: d.day,
  valet: d.revenue,
  selfParking: [6210, 5840, 6510, 7120, 9430, 12680, 10920][i],
}));

const severityTone: Record<string, "info" | "success" | "warning" | "critical"> = {
  info: "info",
  success: "success",
  warning: "warning",
  critical: "critical",
};

const badgeTone = {
  info: "electric",
  success: "success",
  warning: "warning",
  critical: "critical",
} as const;

export default function Dashboard() {
  const totalRevenueToday = valetKpis.revenueToday + selfParkingKpis.revenueToday;

  return (
    <div>
      <PageHeader
        eyebrow={property.name}
        title="Property Overview"
        description={`Real-time operations across Valet, Self Parking, and Monthly — ${property.fullName}`}
        actions={
          <Link
            to="/app/assistant"
            className="inline-flex items-center gap-1.5 rounded-lg border border-electric-500/20 bg-electric-500/10 px-3.5 py-2 text-xs font-medium text-electric-300 hover:bg-electric-500/15"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask ParkAI Assistant
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue Today" value={`$${totalRevenueToday.toLocaleString()}`} icon={DollarSign} delta="+12.4%" deltaLabel="vs. yesterday" accent="electric" />
        <StatCard label="Vehicles On-Site" value={`${valetKpis.vehiclesOnSite + selfParkingKpis.vehiclesOnSite}`} icon={Car} delta="+6.1%" deltaLabel="vs. avg" accent="emerald" />
        <StatCard label="Monthly MRR" value={`$${monthlyKpis.mrr.toLocaleString()}`} icon={Building2} delta="+3.7%" deltaLabel="month over month" accent="violet" />
        <StatCard label="Overall Occupancy" value={`${selfParkingKpis.occupancyPct}%`} icon={ParkingSquare} delta="-2.1%" deltaLabel="vs. yesterday" trend="down" accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue — Valet vs. Self Parking" subtitle="Last 7 days" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedRevenue} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="valetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2483ff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2483ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="spGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v: any) => `$${Number(v).toLocaleString()}`}
                />
                <Area type="monotone" dataKey="valet" name="Valet" stroke="#2483ff" fill="url(#valetGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="selfParking" name="Self Parking" stroke="#34d399" fill="url(#spGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-electric-500" /> Valet</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Self Parking</span>
          </div>
        </Card>

        <Card>
          <CardHeader title="ParkAI Assistant Insights" subtitle="Auto-generated from live ops data" />
          <div className="space-y-3">
            {aiInsights.map((insight) => (
              <div key={insight.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{insight.title}</p>
                  <Badge tone="electric">{insight.tag}</Badge>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{insight.description}</p>
              </div>
            ))}
          </div>
          <Link to="/app/assistant" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-electric-400 hover:text-electric-300">
            Open full assistant <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Link to="/app/valet" className="block rounded-xl border border-white/[0.06] bg-navy-800/60 p-5 shadow-card transition-colors hover:border-electric-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/10"><Car className="h-4.5 w-4.5 text-electric-400" /></div>
            <Badge tone="success" dot>Live</Badge>
          </div>
          <p className="mt-4 text-sm font-semibold text-white">ParkAI Valet</p>
          <p className="mt-1 text-xs text-slate-400">{valetKpis.vehiclesOnSite} vehicles on-site · {valetKpis.attendantsOnShift} attendants on shift</p>
          <p className="mt-3 text-2xl font-semibold text-white">${valetKpis.revenueToday.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Revenue today</p>
        </Link>

        <Link to="/app/self-parking" className="block rounded-xl border border-white/[0.06] bg-navy-800/60 p-5 shadow-card transition-colors hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><ParkingSquare className="h-4.5 w-4.5 text-emerald-400" /></div>
            <Badge tone="success" dot>{selfParkingKpis.gatesOnline}/{selfParkingKpis.gatesTotal} gates online</Badge>
          </div>
          <p className="mt-4 text-sm font-semibold text-white">ParkAI Self Parking</p>
          <p className="mt-1 text-xs text-slate-400">{selfParkingKpis.occupancyPct}% occupancy · {selfParkingKpis.transactionsToday} transactions today</p>
          <p className="mt-3 text-2xl font-semibold text-white">${selfParkingKpis.revenueToday.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Revenue today</p>
        </Link>

        <Link to="/app/monthly/manager" className="block rounded-xl border border-white/[0.06] bg-navy-800/60 p-5 shadow-card transition-colors hover:border-violet-500/30">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10"><Building2 className="h-4.5 w-4.5 text-violet-400" /></div>
            <Badge tone="warning" dot>{monthlyKpis.pendingApprovals} pending</Badge>
          </div>
          <p className="mt-4 text-sm font-semibold text-white">ParkAI Monthly</p>
          <p className="mt-1 text-xs text-slate-400">{monthlyKpis.activeAccounts} active accounts · {monthlyKpis.occupiedSpots}/{monthlyKpis.totalMonthlySpots} spots filled</p>
          <p className="mt-3 text-2xl font-semibold text-white">${monthlyKpis.mrr.toLocaleString()}</p>
          <p className="text-xs text-slate-500">Monthly recurring revenue</p>
        </Link>
      </div>

      <Card className="mt-6">
        <CardHeader title="Property Activity" subtitle="Cross-product live feed" />
        <div className="divide-y divide-white/[0.05]">
          {activityFeed.slice(0, 7).map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <Badge tone={badgeTone[severityTone[item.severity]]} className="mt-0.5 shrink-0">{item.product}</Badge>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-200">{item.message}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
