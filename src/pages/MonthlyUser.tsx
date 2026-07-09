import { useState } from "react";
import {
  Car,
  CreditCard,
  ShieldCheck,
  LifeBuoy,
  MapPin,
  ChevronRight,
  Plus,
  MessageSquarePlus,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { currentUser, accessLog, billingHistory, supportRequests } from "../data/monthly";

export default function MonthlyUser() {
  const [tab, setTab] = useState<"Overview" | "Billing" | "Support">("Overview");

  return (
    <div>
      <PageHeader
        eyebrow="ParkAI Monthly — Parker App"
        title={`Welcome back, ${currentUser.name.split(" ")[0]}`}
        description={`${currentUser.unit} · Member since ${currentUser.memberSince}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status card */}
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Access Status</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone="success" dot>Active</Badge>
                <span className="text-sm text-slate-400">Access card {currentUser.accessCard}</span>
              </div>
            </div>
            <div className="rounded-xl border border-electric-500/20 bg-electric-500/5 px-4 py-2.5 text-right">
              <p className="text-xs text-slate-400">Next bill</p>
              <p className="text-lg font-semibold text-white">${currentUser.monthlyRate}</p>
              <p className="text-xs text-slate-500">{currentUser.nextBillDate}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> Assigned Parking
              </div>
              <p className="mt-2 text-sm font-medium text-white">{currentUser.garage}</p>
              <p className="text-xs text-slate-400">{currentUser.assignedSpot}</p>
              <p className="mt-2 text-xs text-slate-500">Plan: {currentUser.plan}</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Car className="h-3.5 w-3.5" /> Vehicle on File
              </div>
              <p className="mt-2 text-sm font-medium text-white">
                {currentUser.vehicle.year} {currentUser.vehicle.make} {currentUser.vehicle.model}
              </p>
              <p className="text-xs text-slate-400">{currentUser.vehicle.color} · {currentUser.vehicle.plate}</p>
              <button className="mt-2 flex items-center gap-1 text-xs font-medium text-electric-400 hover:text-electric-300">
                <Plus className="h-3 w-3" /> Add second vehicle
              </button>
            </div>
          </div>
        </Card>

        {/* Payment method */}
        <Card>
          <CardHeader title="Payment Method" />
          <div className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-navy-700 to-navy-800 p-4">
            <div className="flex items-center justify-between">
              <CreditCard className="h-6 w-6 text-electric-400" />
              <span className="text-xs text-slate-400">{currentUser.paymentMethod.brand}</span>
            </div>
            <p className="mt-4 text-sm tracking-widest text-slate-300">•••• •••• •••• {currentUser.paymentMethod.last4}</p>
            <p className="mt-1 text-xs text-slate-500">Expires {currentUser.paymentMethod.expires}</p>
          </div>
          <Button variant="secondary" size="sm" className="mt-4 w-full justify-center">
            Update Payment Method
          </Button>
        </Card>
      </div>

      <Card className="mt-6" padded={false}>
        <div className="flex items-center gap-1 border-b border-white/[0.06] px-5 pt-4">
          {(["Overview", "Billing", "Support"] as const).map((t) => (
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

        {tab === "Overview" && (
          <div className="p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Recent Gate Activity</p>
            <div className="divide-y divide-white/[0.05]">
              {accessLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{log.event}</p>
                      <p className="text-xs text-slate-500">{log.gate}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "Billing" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {billingHistory.map((b) => (
                  <tr key={b.id}>
                    <td className="px-5 py-3 text-slate-400">{b.date}</td>
                    <td className="px-5 py-3 text-slate-200">{b.description}</td>
                    <td className="px-5 py-3 text-slate-200">${b.amount}</td>
                    <td className="px-5 py-3"><Badge tone="success">{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Support" && (
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Support Requests</p>
              <Button size="sm" variant="secondary"><MessageSquarePlus className="h-3.5 w-3.5" /> New Request</Button>
            </div>
            <div className="space-y-2">
              {supportRequests.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-slate-200">{s.subject}</p>
                      <p className="text-xs text-slate-500">{s.id} · Updated {s.updated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={s.status === "open" ? "warning" : "success"}>{s.status}</Badge>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
