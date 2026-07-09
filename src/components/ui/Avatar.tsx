import clsx from "clsx";

export function Avatar({
  name,
  colorClass = "bg-electric-500",
  size = "md",
}: {
  name: string;
  colorClass?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const sizes = {
    sm: "h-6 w-6 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        colorClass,
        sizes[size],
      )}
    >
      {initials}
    </div>
  );
}
