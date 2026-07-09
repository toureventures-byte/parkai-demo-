import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Car,
  ParkingSquare,
  Building2,
  UserRound,
  Sparkles,
  FileBarChart,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { property } from "../../data/property";

const navSections = [
  {
    label: "Overview",
    items: [{ to: "/app", label: "Dashboard", icon: LayoutGrid, end: true }],
  },
  {
    label: "Products",
    items: [
      { to: "/app/valet", label: "Valet", icon: Car },
      { to: "/app/self-parking", label: "Self Parking", icon: ParkingSquare },
      { to: "/app/monthly/manager", label: "Monthly — Manager", icon: Building2 },
      { to: "/app/monthly/user", label: "Monthly — Parker App", icon: UserRound },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/app/assistant", label: "AI Assistant", icon: Sparkles },
      { to: "/app/reports", label: "Reports", icon: FileBarChart },
      { to: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-white/[0.06] bg-navy-950/80 transition-all duration-200",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <img src="/parkai-mark.svg" alt="ParkAI" className="h-8 w-8 shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">ParkAI</p>
            <p className="truncate text-[11px] text-slate-500">{property.name}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-none px-3 py-2">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : false}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-electric-500/10 text-electric-300 ring-1 ring-inset ring-electric-500/20"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
