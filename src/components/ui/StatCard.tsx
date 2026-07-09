import { type LucideIcon, ArrowDownRight, ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  trend = "up",
  accent = "electric",
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  delta?: string;
  deltaLabel?: string;
  trend?: "up" | "down";
  accent?: "electric" | "emerald" | "violet" | "amber" | "rose";
}) {
  const accentClasses: Record<string, string> = {
    electric: "text-electric-400 bg-electric-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    violet: "text-violet-400 bg-violet-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    rose: "text-rose-400 bg-rose-500/10",
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        {Icon && (
          <div className={clsx("flex h-8 w-8 items-center justify-center rounded-lg", accentClasses[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
      {delta && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span
            className={clsx(
              "flex items-center gap-0.5 font-medium",
              trend === "up" ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {delta}
          </span>
          {deltaLabel && <span className="text-slate-500">{deltaLabel}</span>}
        </div>
      )}
    </Card>
  );
}
