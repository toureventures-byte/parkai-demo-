import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, ShieldCheck, FileSpreadsheet, Sparkles, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Mode = "signin" | "signup" | "reset";

const input =
  "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50";

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated) navigate("/app/data", { replace: true });
  }, [auth.isAuthenticated, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await auth.signIn(email, password);
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        const { needsConfirmation } = await auth.signUp({ email, password, fullName, company });
        if (needsConfirmation) {
          setNotice(`Almost there. We sent a confirmation link to ${email}. Click it, then sign in here.`);
          setMode("signin");
        }
      } else {
        await auth.resetPassword(email);
        setNotice(`If an account exists for ${email}, a password reset link is on its way.`);
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "signin" ? "Sign in" : mode === "signup" ? "Create your account" : "Reset your password";
  const cta = mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";

  return (
    <div className="grid min-h-screen grid-cols-1 bg-navy-900 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-8 py-12 sm:px-16 lg:px-20">
        <Link to="/" className="mb-12 flex items-center">
          <img src="/parkgrid-logo.png" alt="ParkGrid" className="h-7 w-auto" />
        </Link>

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "signup"
              ? "Upload your exports and get dashboards, audits and monthly-parker tracking in minutes."
              : mode === "reset"
                ? "Enter your email and we'll send you a link to set a new password."
                : "Welcome back to your ParkGrid operations console."}
          </p>

          {auth.mode === "demo" && (
            <div className="mt-6 rounded-lg border border-electric-500/20 bg-electric-500/5 px-4 py-3 text-xs text-electric-300">
              Demo mode: accounts aren't connected yet, so any email and password will sign you in.
            </div>
          )}
          {notice && <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
          {error && <div className="mt-6 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">{error}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fullName" className="mb-1.5 block text-xs font-medium text-slate-400">Your name</label>
                  <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="company" className="mb-1.5 block text-xs font-medium text-slate-400">Company</label>
                  <input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className={input} autoComplete="organization" />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-400">Work email</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} autoComplete="email" placeholder="you@company.com" />
            </div>
            {mode !== "reset" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-xs font-medium text-slate-400">Password</label>
                  {mode === "signin" && auth.mode === "supabase" && (
                    <button type="button" onClick={() => { setMode("reset"); setError(""); }} className="text-xs font-medium text-electric-400 hover:text-electric-300">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : ""}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded bg-electric-200 px-4 py-2.5 text-sm font-semibold text-ink shadow-glow transition-colors hover:bg-electric-100 disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {cta}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {mode === "signin" ? (
              <>New to ParkGrid? <button onClick={() => { setMode("signup"); setError(""); }} className="font-medium text-electric-400 hover:text-electric-300">Create an account</button></>
            ) : (
              <>Already have an account? <button onClick={() => { setMode("signin"); setError(""); }} className="font-medium text-electric-400 hover:text-electric-300">Sign in</button></>
            )}
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="absolute inset-0 bg-grid-glow" />
        <div className="relative flex h-full flex-col justify-center px-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-400">Intelligence for every parking asset</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
            Your exports in. Dashboards, audits and monthly billing out.
          </h2>
          <div className="mt-10 space-y-3">
            {[
              { icon: FileSpreadsheet, label: "Works with what you have", value: "CSV, Excel or PDF from any gate, valet or LPR system" },
              { icon: ShieldCheck, label: "Audit on every upload", value: "Missing tickets, cash variance, comps, outages" },
              { icon: Building2, label: "Monthly parkers", value: "Roster, late payments and renewals, flagged by AI" },
              { icon: Sparkles, label: "Ask ParkGrid", value: "Plain-English answers from your own data" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/10">
                  <row.icon className="h-4 w-4 text-electric-400" />
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
