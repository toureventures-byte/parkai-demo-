import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";
import { property } from "../../data/property";

export function Topbar() {
  const { userName, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-white/[0.06] bg-navy-900/80 px-6 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative hidden w-72 items-center sm:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search tickets, accounts, plates…"
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500/50 focus:outline-none focus:ring-1 focus:ring-electric-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 md:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {property.name} — Live
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-electric-400" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.06]"
          >
            <Avatar name={userName} size="sm" />
            <div className="hidden text-left leading-tight lg:block">
              <p className="text-xs font-medium text-white">{userName}</p>
              <p className="text-[11px] text-slate-500">{userRole}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-white/[0.08] bg-navy-800 shadow-xl">
                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
