import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { resetPassword as apiResetPassword } from "../lib/backendApi";

export default function SetNewPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token.trim()) {
      setError("Missing or invalid password reset token. Please request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await apiResetPassword(token.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login?mode=signin", { replace: true });
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50";

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 py-8 sm:px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center">
          <img src="/parkgrid-logo.png" alt="ParkGrid" className="h-7 w-auto" />
        </Link>

        {success ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">Password Updated</h2>
            <p className="mt-2 text-sm text-slate-400">
              Your password has been successfully reset. Redirecting you to sign in...
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
              >
                Go to Sign In
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Set a new password
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Choose a secure password with at least 8 characters for your ParkGrid account.
            </p>

            {!token && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 text-sm text-amber-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-medium">Missing Reset Token</p>
                  <p className="mt-0.5 text-xs text-amber-200/80">
                    No token found in this URL. Please open the link directly from your email.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-pw" className="mb-1.5 block text-xs font-medium text-slate-400">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-pw"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-pw" className="mb-1.5 block text-xs font-medium text-slate-400">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-pw"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || !token}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-electric-200 px-4 py-2.5 text-sm font-semibold text-ink shadow-glow transition-colors hover:bg-electric-100 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save New Password
              </button>

              <div className="pt-2 text-center text-xs text-slate-500">
                Remember your password?{" "}
                <Link to="/login" className="font-medium text-electric-400 hover:text-electric-300">
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
