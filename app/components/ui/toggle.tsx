"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  description,
  dot,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  dot?: "mint" | "amber" | "accent";
}) {
  const content = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors",
        checked ? "bg-[var(--color-accent-strong)]" : "bg-white/5",
      )}
    >
      <span
        className={cn(
          "h-3.5 w-3.5 rounded-full bg-white transition-transform mt-[2px]",
          checked ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );

  if (!label) return content;

  return (
    <label className="flex items-start gap-3 cursor-pointer">
      {content}
      <div className="flex flex-col">
        <span className="text-sm text-[var(--color-text)] flex items-center gap-2">
          {label}
          {dot ? (
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                dot === "mint" && "bg-[var(--color-mint)]",
                dot === "amber" && "bg-[var(--color-amber)]",
                dot === "accent" && "bg-[var(--color-accent)]",
              )}
            />
          ) : null}
        </span>
        {description ? (
          <span className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {description}
          </span>
        ) : null}
      </div>
    </label>
  );
}
