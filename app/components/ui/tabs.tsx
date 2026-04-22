"use client";

import { cn } from "@/lib/utils";

export function TabPills<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 h-8 text-sm transition-all",
              active
                ? "bg-white/10 text-[var(--color-text)] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 rounded",
                  active
                    ? "bg-[var(--color-accent-strong)]/30 text-[var(--color-accent)]"
                    : "bg-white/5 text-[var(--color-text-faint)]",
                )}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
