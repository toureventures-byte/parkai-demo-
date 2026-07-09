import clsx from "clsx";

export function ProgressBar({
  value,
  max = 100,
  tone = "electric",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: "electric" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const tones = {
    electric: "bg-electric-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  };

  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="font-medium text-slate-300">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={clsx("h-full rounded-full transition-all", tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
