import { useState } from "react";
import { Building2, Users, DollarSign, AlertCircle, Check, X, Power, Search } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { monthlyAccounts, monthlyKpis, monthlyGrowth, billingEvents, type MonthlyAccount } from "../data/monthly";

const statusTone: Record<MonthlyAccount["status"], "success" | "warning" | "critical" | "neutral"> = {
  active: "success",
  pending: "warning",
  suspended: "critical",
  cancelled: "neutral",
};

const tabs = ["Accounts", "Approvals", "Billing"] as const;

export default function MonthlyManager() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Accounts");
  const [query, setQuery] = useState("");

  const filtered = monthlyAccounts.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.plate.toLowerCase().includes(query.toLowerCase()),
  );
  const pending = monthlyAccounts.filter((a) => a.status === "pending");

  return (
    <div>
      <PageHeader
        eyebrow="ParkAI Monthly — Manager App"
        title="Monthly Parking Management"
        description="Approve users, manage billing, and control gate access for monthly accounts."
        actions={<Button size="sm">+ Add Account</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Accounts" value={`${monthlyKpis.activeAccounts}`} icon={Building2} delta="+5" deltaLabel="this month" accent="violet" />
        <StatCard label="Monthly Recurring Revenue" value={`$${monthlyKpis.mrr.toLocaleString()}`} icon={DollarSign} delta="+3.7%" deltaLabel="month over month" accent="electric" />
        <StatCard label="Pending Approvals" value={`${monthlyKpis.pendingApprovals}`} icon={Users} delta="+2" deltaLabel="since yesterday" accent="amber" />
        <StatCard label="Past Due Accounts" value={`${monthlyKpis.pastDue}`} icon={AlertCircle} delta="-1" deltaLabel="vs. last week" trend="down" accent="rose" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Account & Revenue Growth" subtitle="Last 6 months" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyGrowth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="accounts" name="Accounts" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Spot Utilization" subtitle="Reserved & unreserved monthly" />
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full" style={{
              background: `conic-gradient(#a78bfa ${(monthlyKpis.occupiedSpots / monthlyKpis.totalMonthlySpots) * 360}deg, rgba(255,255,255,0.06) 0deg)`
            }}>
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-navy-800">
                <p className="text-xl font-semibold text-white">{Math.round((monthlyKpis.occupiedSpots / monthlyKpis.totalMonthlySpots) * 100)}%</p>
                <p className="text-[10px] text-slate-500">Filled</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">{monthlyKpis.occupiedSpots} of {monthlyKpis.totalMonthlySpots} monthly spots assigned</p>
          </div>
        </Card>
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 pt-4">
          <div className="flex items-center gap-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-3 pb-3 text-sm font-medium transition-colors ${
                  tab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {t}
                {t === "Approvals" && pending.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    {pending.length}
                  </span>
                )}
                {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-electric-500" />}
              </button>
            ))}
          </div>
          {tab === "Accounts" && (
            <div className="relative mb-3 flex items-center">
              <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or plate…"
                className="w-56 rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-electric-500/50 focus:outline-none"
              />
            </div>
          )}
        </div>

        {tab === "Accounts" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Account</th>
                  <th className="px-5 py-3 font-medium">Plan</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Rate</th>
                  <th className="px-5 py-3 font-medium">Billing</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={a.name} colorClass={a.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100">{a.name}</p>
                          <p className="truncate text-xs text-slate-500">{a.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{a.plan}</td>
                    <td className="px-5 py-3">
                      <p className="text-slate-300">{a.vehicle}</p>
                      <p className="text-xs text-slate-500">{a.plate}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-200">${a.monthlyRate}/mo</td>
                    <td className="px-5 py-3">
                      <Badge tone={a.billing === "past due" ? "critical" : "success"}>{a.billing}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[a.status]} dot>{a.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white" title="Toggle access">
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Approvals" && (
          <div className="divide-y divide-white/[0.05]">
            {pending.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={a.name} colorClass={a.avatarColor} />
                  <div>
                    <p className="text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.unit} · {a.vehicle} ({a.plate})</p>
                    <p className="mt-0.5 text-xs text-slate-600">Requested plan: {a.plan} · ${a.monthlyRate}/mo · {a.since}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm"><X className="h-3.5 w-3.5" /> Decline</Button>
                  <Button size="sm"><Check className="h-3.5 w-3.5" /> Approve</Button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="p-8 text-center text-sm text-slate-500">No pending approvals.</p>
            )}
          </div>
        )}

        {tab === "Billing" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Account</th>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {billingEvents.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-slate-100">{b.account}</td>
                    <td className="px-5 py-3">
                      <Badge tone={b.type.includes("Failed") ? "critical" : b.type.includes("Cancelled") ? "neutral" : "success"}>
                        {b.type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-200">{b.amount > 0 ? `$${b.amount}` : "—"}</td>
                    <td className="px-5 py-3 text-slate-400">{b.method}</td>
                    <td className="px-5 py-3 text-slate-500">{b.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
