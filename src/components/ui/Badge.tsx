import { type ReactNode } from "react";
import clsx from "clsx";

const tones = {
  neutral: "bg-slate-500/10 text-slate-300 ring-1 ring-inset ring-slate-500/20",
  electric: "bg-electric-500/10 text-electric-300 ring-1 ring-inset ring-electric-500/25",
  success: "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/25",
  warning: "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/25",
  critical: "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/25",
  violet: "bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-500/25",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full",
            tone === "success" && "bg-emerald-400",
            tone === "warning" && "bg-amber-400",
            tone === "critical" && "bg-rose-400",
            tone === "electric" && "bg-electric-400",
            tone === "violet" && "bg-violet-400",
            tone === "neutral" && "bg-slate-400",
          )}
        />
      )}
      {children}
    </span>
  );
}
