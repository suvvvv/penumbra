import { cn } from "@/lib/utils";

type BadgeTone =
  | "default"
  | "accent"
  | "mint"
  | "amber"
  | "rose"
  | "muted"
  | "outline";

const toneClass: Record<BadgeTone, string> = {
  default: "bg-white/5 text-[var(--color-text)] border border-white/10",
  accent:
    "bg-[var(--color-accent-strong)]/15 text-[var(--color-accent)] border border-[var(--color-accent-strong)]/30",
  mint:
    "bg-[var(--color-mint)]/10 text-[var(--color-mint)] border border-[var(--color-mint)]/30",
  amber:
    "bg-[var(--color-amber)]/10 text-[var(--color-amber)] border border-[var(--color-amber)]/30",
  rose:
    "bg-[var(--color-rose)]/10 text-[var(--color-rose)] border border-[var(--color-rose)]/30",
  muted:
    "bg-white/3 text-[var(--color-text-faint)] border border-white/5",
  outline:
    "bg-transparent text-[var(--color-text-muted)] border border-white/15",
};

export function Badge({
  tone = "default",
  dot,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
    >
      {dot ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "mint" && "bg-[var(--color-mint)]",
            tone === "amber" && "bg-[var(--color-amber)]",
            tone === "rose" && "bg-[var(--color-rose)]",
            tone === "accent" && "bg-[var(--color-accent)]",
            tone === "default" && "bg-white/40",
            tone === "muted" && "bg-white/20",
            tone === "outline" && "bg-white/30",
          )}
        />
      ) : null}
      {children}
    </span>
  );
}
