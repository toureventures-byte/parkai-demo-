import { useState } from "react";
import { Wifi, UploadCloud, Users, CreditCard, Bell, Building2, Check, Plus } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { gateSystems } from "../data/selfParking";
import { property } from "../data/property";

const tabs = ["Integrations", "Team", "Billing", "Notifications"] as const;

const teamMembers = [
  { name: "Dana Whitfield", role: "Director of Parking Operations", email: "dana.whitfield@parkai.io", access: "Owner", color: "bg-electric-500" },
  { name: "Marco Delgado", role: "Lead Valet Attendant", email: "marco.d@parkai.io", access: "Valet Manager", color: "bg-emerald-500" },
  { name: "Kevin Munoz", role: "Self Parking Supervisor", email: "kevin.m@parkai.io", access: "Self Parking Manager", color: "bg-violet-500" },
  { name: "Rachel Ito", role: "Finance Lead", email: "rachel.ito@parkai.io", access: "Billing Admin", color: "bg-amber-500" },
];

export default function Settings() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Integrations");

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Settings & Integrations"
        description={`Manage gate systems, team access, billing, and notification preferences for ${property.fullName}.`}
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-white/[0.06] pb-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 pb-3 text-sm font-medium transition-colors ${
              tab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-electric-500" />}
          </button>
        ))}
      </div>

      {tab === "Integrations" && (
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Gate & Arm Systems"
              subtitle="Connected hardware for ParkAI Self Parking & Monthly access control"
              action={<Button size="sm" variant="secondary"><Plus className="h-3.5 w-3.5" /> Add Gate</Button>}
            />
            <div className="space-y-2.5">
              {gateSystems.map((g) => (
                <div key={g.name} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Wifi className="h-4.5 w-4.5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">{g.name}</p>
                    <p className="text-xs text-slate-500">{g.type} gate · Ping {g.lastPing}</p>
                  </div>
                  <Badge tone="success" dot>Online</Badge>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="CSV Data Import" subtitle="Self Parking transactions" />
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-8 text-center">
                <UploadCloud className="h-6 w-6 text-slate-500" />
                <p className="mt-2 text-xs font-medium text-slate-300">Drop CSV file or browse</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Supports Amano, T2, Flash, WPS formats</p>
                <Button size="sm" variant="secondary" className="mt-3">Browse Files</Button>
              </div>
              <p className="mt-3 text-xs text-slate-500">Last import: Jul 8, 6:00 AM — 412 transactions</p>
            </Card>

            <Card>
              <CardHeader title="Connected Apps" />
              <div className="space-y-2">
                {["Stripe Billing", "Twilio SMS Alerts", "Slack Notifications"].map((app) => (
                  <div key={app} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
                    <span className="text-sm text-slate-300">{app}</span>
                    <Badge tone="success"><Check className="h-3 w-3" /> Connected</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "Team" && (
        <Card className="mt-6" padded={false}>
          <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-white">Team Access</p>
            </div>
            <Button size="sm"><Plus className="h-3.5 w-3.5" /> Invite Member</Button>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {teamMembers.map((m) => (
              <div key={m.name} className="flex items-center gap-4 p-4">
                <Avatar name={m.name} colorClass={m.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.email} · {m.role}</p>
                </div>
                <Badge tone="electric">{m.access}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Billing" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Subscription Plan" subtitle="ParkAI Enterprise" />
            <div className="flex items-center justify-between rounded-lg border border-electric-500/20 bg-electric-500/5 p-4">
              <div>
                <p className="text-sm font-semibold text-white">Enterprise — All 3 Products</p>
                <p className="text-xs text-slate-400">Valet + Self Parking + Monthly · Unlimited seats</p>
              </div>
              <p className="text-lg font-semibold text-white">$4,200<span className="text-xs text-slate-500">/mo</span></p>
            </div>
            <Button variant="secondary" size="sm" className="mt-4">Manage Subscription</Button>
          </Card>
          <Card>
            <CardHeader title="Payment Method" />
            <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <CreditCard className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-200">Visa ending in 2210</p>
                <p className="text-xs text-slate-500">Billing contact: Rachel Ito · rachel.ito@parkai.io</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "Notifications" && (
        <Card className="mt-6">
          <CardHeader title="Notification Preferences" subtitle="Choose what triggers an alert" />
          <div className="divide-y divide-white/[0.05]">
            {[
              { icon: Building2, label: "Incident reported (Valet)", enabled: true },
              { icon: Wifi, label: "Gate system offline (Self Parking)", enabled: true },
              { icon: CreditCard, label: "Payment failed (Monthly)", enabled: true },
              { icon: Bell, label: "Wait time exceeds 8 minutes", enabled: false },
              { icon: Bell, label: "Weekly report ready", enabled: true },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <n.icon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-300">{n.label}</span>
                </div>
                <button
                  className={`relative h-5 w-9 rounded-full transition-colors ${n.enabled ? "bg-electric-600" : "bg-white/10"}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${n.enabled ? "left-4" : "left-0.5"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
