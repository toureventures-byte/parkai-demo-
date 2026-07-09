import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Car, ParkingSquare, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("dana.whitfield@parkai.io");
  const [password, setPassword] = useState("••••••••••");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login();
      navigate("/app");
    }, 650);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-navy-900 lg:grid-cols-2">
      {/* Left / form */}
      <div className="flex flex-col justify-center px-8 py-12 sm:px-16 lg:px-20">
        <Link to="/" className="mb-12 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric-400 to-electric-700 text-sm font-bold text-white shadow-glow">
            P
          </div>
          <span className="text-base font-semibold text-white">ParkAI</span>
        </Link>

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to the ParkAI operations console for Two Rodeo.
          </p>

          <div className="mt-6 rounded-lg border border-electric-500/20 bg-electric-500/5 px-4 py-3 text-xs text-electric-300">
            Demo mode — credentials are pre-filled. Just click <span className="font-semibold">Sign in</span>.
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-400">Password</label>
                <a href="#" className="text-xs font-medium text-electric-400 hover:text-electric-300">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-electric-600 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-electric-500 disabled:opacity-70"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-600">
            Protected by ParkAI Identity · SSO available for enterprise accounts
          </p>
        </div>
      </div>

      {/* Right / visual */}
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="absolute inset-0 bg-grid-glow" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-400">Two Rodeo Drive</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
            Valet, self parking, and monthly access — unified in one console.
          </h2>

          <div className="mt-10 space-y-3">
            {[
              { icon: Car, label: "Valet", value: "47 vehicles on-site", tone: "text-electric-400", bg: "bg-electric-500/10" },
              { icon: ParkingSquare, label: "Self Parking", value: "79% occupancy across 3 garages", tone: "text-emerald-400", bg: "bg-emerald-500/10" },
              { icon: Building2, label: "Monthly", value: "214 active accounts, 6 pending", tone: "text-violet-400", bg: "bg-violet-500/10" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 backdrop-blur-sm"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${row.bg}`}>
                  <row.icon className={`h-4.5 w-4.5 ${row.tone}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{row.label}</p>
                  <p className="text-xs text-slate-500">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
