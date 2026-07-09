import { useState } from "react";
import { Car, Clock, DollarSign, Users, KeyRound, AlertTriangle, Crown, Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { valetTickets, attendants, valetIncidents, valetHourly, valetKpis, type ValetStatus } from "../data/valet";

const statusMeta: Record<ValetStatus, { label: string; tone: "neutral" | "electric" | "success" | "warning" | "critical" }> = {
  parked: { label: "Parked", tone: "success" },
  requested: { label: "Requested", tone: "warning" },
  retrieving: { label: "Retrieving", tone: "electric" },
  delivered: { label: "Delivered", tone: "neutral" },
  flagged: { label: "Flagged", tone: "critical" },
};

const tabs = ["Live Queue", "Attendants", "Incidents"] as const;

export default function ValetDashboard() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Live Queue");

  return (
    <div>
      <PageHeader
        eyebrow="ParkAI Valet"
        title="Valet Operations"
        description="Live check-ins, tickets, keys, attendants, and revenue for Two Rodeo valet."
        actions={
          <>
            <Button variant="secondary" size="sm"><Download className="h-3.5 w-3.5" /> Export</Button>
            <Button size="sm">New Ticket</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vehicles On-Site" value={`${valetKpis.vehiclesOnSite}`} icon={Car} delta="+8" deltaLabel="vs. yesterday" accent="electric" />
        <StatCard label="Avg Wait Time" value={`${valetKpis.avgWaitMin} min`} icon={Clock} delta="+0.9 min" deltaLabel="vs. avg" trend="down" accent="amber" />
        <StatCard label="Revenue Today" value={`$${valetKpis.revenueToday.toLocaleString()}`} icon={DollarSign} delta="+9.2%" deltaLabel="vs. yesterday" accent="emerald" />
        <StatCard label="VIP Guests Today" value={`${valetKpis.vipGuestsToday}`} icon={Crown} delta="+4" deltaLabel="vs. avg" accent="violet" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Check-ins vs. Check-outs" subtitle="Today, hourly" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valetHourly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="checkIns" name="Check-ins" fill="#2483ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="checkOuts" name="Check-outs" fill="#3b4863" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-electric-500" /> Check-ins</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-navy-500" /> Check-outs</span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Avg. Wait Time" subtitle="Minutes, hourly trend" />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={valetHourly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="avgWait" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
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

        {tab === "Live Queue" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Ticket</th>
                  <th className="px-5 py-3 font-medium">Guest</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Attendant</th>
                  <th className="px-5 py-3 font-medium">Wait</th>
                  <th className="px-5 py-3 font-medium">Spot</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {valetTickets.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">{t.ticket}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-100">{t.guest}</span>
                        {t.vip && <Crown className="h-3.5 w-3.5 text-amber-400" />}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-300">{t.vehicle}</p>
                      <p className="text-xs text-slate-500">{t.plate} · {t.color}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{t.attendant}</td>
                    <td className="px-5 py-3">
                      <span className={t.waitMin > 8 ? "font-medium text-rose-400" : "text-slate-400"}>
                        {t.waitMin > 0 ? `${t.waitMin} min` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{t.spot}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusMeta[t.status].tone} dot>{statusMeta[t.status].label}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Attendants" && (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            {attendants.map((a) => (
              <div key={a.name} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={a.name} colorClass={a.status === "on-shift" ? "bg-electric-500" : "bg-slate-600"} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.role}</p>
                  </div>
                  <Badge tone={a.status === "on-shift" ? "success" : "neutral"} dot className="ml-auto shrink-0">
                    {a.status === "on-shift" ? "On shift" : "Off shift"}
                  </Badge>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-semibold text-white">{a.vehicles}</p>
                    <p className="text-[10px] uppercase text-slate-500">Vehicles</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.avgRetrieval}</p>
                    <p className="text-[10px] uppercase text-slate-500">Avg. Retrieval</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{a.rating}</p>
                    <p className="text-[10px] uppercase text-slate-500">Rating</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Shift: {a.shift}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "Incidents" && (
          <div className="divide-y divide-white/[0.05]">
            {valetIncidents.map((i) => (
              <div key={i.id} className="flex items-start gap-4 p-5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${i.severity === "medium" ? "bg-amber-500/10" : "bg-slate-500/10"}`}>
                  <AlertTriangle className={`h-4.5 w-4.5 ${i.severity === "medium" ? "text-amber-400" : "text-slate-400"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{i.type}</p>
                    <Badge tone={i.status === "resolved" ? "success" : "warning"}>{i.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {i.id} · Ticket {i.ticket} · {i.guest}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Reported {i.reported} · Assigned to {i.assignee}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-navy-800/60 p-4">
          <KeyRound className="h-5 w-5 text-electric-400" />
          <div>
            <p className="text-sm font-medium text-white">Key Wall Status</p>
            <p className="text-xs text-slate-500">47 keys checked out · 3 unassigned</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-navy-800/60 p-4">
          <Users className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-white">Attendants On Shift</p>
            <p className="text-xs text-slate-500">{valetKpis.attendantsOnShift} active · next shift change 3:00 PM</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-navy-800/60 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-white">Open Incidents</p>
            <p className="text-xs text-slate-500">{valetKpis.openIncidents} requires attention</p>
          </div>
        </div>
      </div>
    </div>
  );
}
