import { Link } from "react-router-dom";
import {
  ArrowRight,
  Car,
  ParkingSquare,
  Building2,
  CheckCircle2,
  Sparkles,
  Gauge,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { property } from "../data/property";

const products = [
  {
    icon: Car,
    name: "ParkAI Valet",
    color: "text-electric-400",
    bg: "bg-electric-500/10",
    ring: "ring-electric-500/20",
    description:
      "AI-powered valet operations dashboard. Track check-ins, tickets, keys, attendants, VIPs, incidents, and revenue reconciliation — all in real time.",
    points: ["Live vehicle queue & ticket tracking", "Revenue reconciliation & leakage detection", "VIP recognition and incident logging"],
  },
  {
    icon: ParkingSquare,
    name: "ParkAI Self Parking",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    description:
      "Connects directly to gate/arm systems or CSV uploads to automate transient revenue, validations, occupancy, and exception reporting.",
    points: ["Direct gate & arm system integration", "Automated DCRs and revenue summaries", "Validation tracking & exception logs"],
  },
  {
    icon: Building2,
    name: "ParkAI Monthly",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    description:
      "Monthly parking automation with a Manager app and a Parker app, wired directly into gate access control for subscriptions.",
    points: ["Manager app for approvals & billing", "Parker app for self-service accounts", "Automated access control at the gate"],
  },
];

const trustLogos = ["Meridian Plaza", "Related Companies", "Brookfield Properties", "Irvine Company", "Simon Property Group", "Hudson Pacific"];

const stats = [
  { value: "312+", label: "Properties running ParkAI" },
  { value: "4.6M", label: "Vehicles processed / year" },
  { value: "$2.4M+", label: "Revenue leakage flagged annually" },
  { value: "99.98%", label: "Gate system uptime" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-navy-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center">
            <img src="/parkai-wordmark.svg" alt="ParkAI" className="h-6 w-auto" />
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#products" className="transition-colors hover:text-white">Products</a>
            <a href="#platform" className="transition-colors hover:text-white">Platform</a>
            <a href="#stats" className="transition-colors hover:text-white">Results</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Sign in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-electric-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-colors hover:bg-electric-500"
            >
              View Live Demo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-grid-glow">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-electric-500/20 bg-electric-500/10 px-3 py-1 text-xs font-medium text-electric-300">
            <Sparkles className="h-3.5 w-3.5" />
            Now with ParkAI Assistant — ask your parking data anything
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            The AI operating system for <span className="text-electric-400">modern parking</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            ParkAI unifies valet operations, self-parking automation, and monthly subscription
            management into one platform — built for premium properties like Meridian Plaza.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-electric-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-electric-500"
            >
              Explore the Demo Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.06]"
            >
              See how it works
            </a>
          </div>

          {/* Product preview mock */}
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-x-10 -top-10 h-72 bg-electric-500/10 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-navy-800/80 p-3 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                <span className="ml-3 text-xs text-slate-500">app.parkai.io/meridian-plaza</span>
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
                {[
                  { label: "Vehicles On-Site", value: "353", tone: "text-electric-400" },
                  { label: "Revenue Today", value: "$2,145", tone: "text-emerald-400" },
                  { label: "Occupancy", value: "79%", tone: "text-violet-400" },
                  { label: "Active Alerts", value: "2", tone: "text-amber-400" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">{s.label}</p>
                    <p className={`mt-2 text-xl font-semibold ${s.tone}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust logos */}
      <section className="border-y border-white/[0.06] bg-navy-950/60 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <p className="mb-5 text-center text-xs font-medium uppercase tracking-widest text-slate-600">
            Trusted by premier properties and operators
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {trustLogos.map((logo) => (
              <span key={logo} className="text-sm font-semibold text-slate-500">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-400">Three products, one platform</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything a parking operation needs
          </h2>
          <p className="mt-4 text-slate-400">
            Whether it's valet, transient self-parking, or monthly subscribers — ParkAI automates
            the operational grind so your team can focus on the guest experience.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.name}
              className="group rounded-2xl border border-white/[0.06] bg-navy-800/50 p-7 transition-colors hover:border-white/[0.12]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${p.bg} ring-1 ring-inset ${p.ring}`}>
                <p.icon className={`h-5 w-5 ${p.color}`} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{p.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{p.description}</p>
              <ul className="mt-5 space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Platform features */}
      <section id="platform" className="border-t border-white/[0.06] bg-navy-950/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-electric-400">The platform</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                One AI layer across every parking workflow
              </h2>
              <p className="mt-4 text-slate-400">
                ParkAI Assistant sits on top of every product — surfacing insights, drafting reports,
                and answering operational questions in plain English.
              </p>
              <div className="mt-8 space-y-6">
                {[
                  { icon: Gauge, title: "Real-time operations", body: "Live dashboards for valet queues, gate transactions, and monthly account health." },
                  { icon: Zap, title: "Automated reporting", body: "DCRs, revenue summaries, validation reports, and exception logs generate themselves." },
                  { icon: ShieldCheck, title: "Access control built in", body: "Gate and arm integrations keep monthly access, validations, and exceptions in sync automatically." },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 ring-1 ring-inset ring-electric-500/20">
                      <f.icon className="h-4.5 w-4.5 text-electric-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                      <p className="mt-1 text-sm text-slate-400">{f.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-electric-400" />
                ParkAI Assistant
              </div>
              <div className="space-y-3">
                <div className="ml-auto max-w-[80%] rounded-xl rounded-tr-sm bg-electric-600/90 px-4 py-2.5 text-sm text-white">
                  Why is $151 in valet revenue flagged today?
                </div>
                <div className="max-w-[85%] rounded-xl rounded-tl-sm border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300">
                  An $18 cash drawer shortage and a comp ticket issued without manager
                  override — both still pending sign-off. Reconciliation rate today is
                  93.4%, in line with your 30-day average.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-semibold tracking-tight text-white">{s.value}</p>
              <p className="mt-2 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] bg-navy-950/60 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            See ParkAI running Meridian Plaza
          </h2>
          <p className="mt-4 text-slate-400">
            Explore a fully interactive demo of the valet, self-parking, and monthly parking
            dashboards — populated with realistic operations data.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-electric-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-electric-500"
          >
            Launch the Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-600 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/parkai-mark.svg" alt="ParkAI" className="h-5 w-5" />
            ParkAI © 2026 — Demo environment
          </div>
          <p>{property.fullName}</p>
        </div>
      </footer>
    </div>
  );
}
