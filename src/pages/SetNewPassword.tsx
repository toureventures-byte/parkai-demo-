import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function SetNewPassword() {
  const { setNewPassword } = useAuth();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setError("Use a password with at least 8 characters.");
    setBusy(true);
    setError("");
    try {
      await setNewPassword(pw);
      window.location.assign("/app/data");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <img src="/parkgrid-logo.png" alt="ParkGrid" className="mb-10 h-7 w-auto" />
        <h1 className="text-2xl font-semibold text-white">Set a new password</h1>
        <p className="mt-2 text-sm text-slate-400">Choose a new password for your ParkGrid account.</p>
        <label htmlFor="newpw" className="mt-6 block text-xs font-medium text-slate-400">New password</label>
        <input id="newpw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-slate-100 focus:border-electric-500/50 focus:outline-none" />
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <button type="submit" disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-electric-200 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-electric-100 disabled:opacity-70">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save password
        </button>
      </form>
    </div>
  );
}
