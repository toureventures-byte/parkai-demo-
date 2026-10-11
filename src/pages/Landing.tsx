import { Link } from "react-router-dom";
import {
  ArrowRight,
  UploadCloud,
  ShieldCheck,
  Building2,
  FileText,
  Sparkles,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

const steps = [
  { icon: UploadCloud, title: "Upload the exports you already have", body: "CSV, Excel or PDF from your gate, valet, LPR or billing system. No hardware, no integration project." },
  { icon: ShieldCheck, title: "ParkGrid audits every file", body: "It recognizes each report, maps the columns, and checks for missing tickets, cash shortages, comp abuse, lane outages and more." },
  { icon: FileText, title: "Get answers you can act on", body: "Dashboards, a one-click PDF report, flagged monthly parkers, and plain-English answers from Ask ParkGrid." },
];

const modules = [
  {
    icon: BarChart3,
    name: "Dashboards & audit",
    description: "Revenue, transactions, average ticket, comps, validations and occupancy by day, lane, attendant and customer type.",
    points: ["Missing ticket numbers", "Cash variance by cashier", "Comp, void and lost-ticket outliers", "Lane outages and revenue dips", "Validation spikes"],
  },
  {
    icon: Building2,
    name: "Monthly parkers",
    description: "Import your roster and payment history, or add parkers by hand. ParkGrid flags who needs attention and why.",
    points: ["Past due with access still active", "Late this month and repeat late payers", "Partial payments", "Contracts ending in 30 days", "Mark paid, add and remove"],
  },
  {
    icon: Sparkles,
    name: "Ask ParkGrid",
    description: "Ask questions in plain English and get short, specific answers drawn only from your own data.",
    points: ["\"Is any cash missing?\"", "\"Why was revenue down last weekend?\"", "\"Who hasn't paid this month?\"", "\"Which attendant comps the most?\""],
  },
];

const sampleFindings = [
  { tone: "bg-rose-500/15 text-rose-300", label: "High", text: "Exit 2 recorded no transactions for 3 days", amount: "$5,498" },
  { tone: "bg-rose-500/15 text-rose-300", label: "High", text: "$1,190 cash short across 5 Sundays, same closing cashier", amount: "$1,190" },
  { tone: "bg-rose-500/15 text-rose-300", label: "High", text: "2 monthly parkers 45+ days past due, cards still active", amount: "$1,110" },
  { tone: "bg-amber-500/15 text-amber-300", label: "Medium", text: "Validations tripled for a week at one garage", amount: "$2,116" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-900 text-slate-200">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-navy-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <img src="/parkgrid-logo.png" alt="ParkGrid" className="h-6 w-auto" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-400 md:flex">
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#product" className="transition-colors hover:text-white">What you get</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">Sign in</Link>
            <Link to="/login?mode=signup" className="inline-flex items-center gap-1.5 rounded bg-electric-200 px-4 py-2 text-sm font-medium text-ink shadow-glow transition-colors hover:bg-electric-100">
              Try it free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-grid-glow">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-20 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Run every parking asset from <span className="text-electric-400">one intelligent platform.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Upload the exports your systems already produce. ParkGrid turns them into dashboards, audits every file for
            lost revenue, and keeps your monthly parkers in line. Nothing to install.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login?mode=signup" className="inline-flex items-center gap-2 rounded bg-electric-200 px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-colors hover:bg-electric-100">
              Try it with sample data <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.06]">
              How it works
            </a>
          </div>

          <div className="relative mx-auto mt-16 max-w-3xl text-left">
            <div className="absolute -inset-x-10 -top-10 h-72 bg-electric-500/10 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-navy-800/80 p-5 shadow-2xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Audit findings</p>
                <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-400">Sample data · 3 properties</span>
              </div>
              <ul className="divide-y divide-white/[0.05]">
                {sampleFindings.map((f) => (
                  <li key={f.text} className="flex items-center gap-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${f.tone}`}>{f.label}</span>
                    <span className="flex-1 text-sm text-slate-200">{f.text}</span>
                    <span className="text-sm font-semibold text-white">{f.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-white/[0.06] bg-navy-950/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-electric-400">How it works</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">From export to answer in minutes</h2>
          </div>
          <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-white/[0.06] bg-navy-800/50 p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-500/15 text-sm font-semibold text-electric-300">{i + 1}</span>
                  <s.icon className="h-5 w-5 text-electric-400" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-400">What you get</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Built for valet, self-park and monthly operations</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {modules.map((m) => (
            <div key={m.name} className="rounded-2xl border border-white/[0.06] bg-navy-800/50 p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-electric-500/10 ring-1 ring-inset ring-electric-500/20">
                <m.icon className="h-5 w-5 text-electric-400" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{m.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.description}</p>
              <ul className="mt-5 space-y-2.5">
                {m.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric-500/70" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-navy-950/60 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">See what your own exports are hiding</h2>
          <p className="mt-4 text-slate-400">
            Create a free account, load the sample data in one click, or upload last month's exports from one of your locations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login?mode=signup" className="inline-flex items-center gap-2 rounded bg-electric-200 px-6 py-3 text-sm font-semibold text-ink shadow-glow transition-colors hover:bg-electric-100">
              Create a free account <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="https://getparkgrid.com" className="inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.06]">
              Talk to us
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/parkgrid-mark.png" alt="" className="h-5 w-5 object-contain" />
            ParkGrid © 2026 · Intelligence for every parking asset
          </div>
          <a href="https://getparkgrid.com" className="hover:text-slate-300">getparkgrid.com</a>
        </div>
      </footer>
    </div>
  );
}
