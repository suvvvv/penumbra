"use client";

import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function Mono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("font-mono text-[0.85em]", className)}>{children}</span>
  );
}

/**
 * Renders a value that's "encrypted" by default — the UI shows a
 * ciphertext-ish string and reveals the plaintext when toggled.
 * Used for balance displays and disbursement amounts so reviewers
 * can feel the privacy model directly.
 */
export function CipherField({
  cipher,
  plain,
  revealedDefault = false,
  className,
}: {
  cipher: string;
  plain: string;
  revealedDefault?: boolean;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(revealedDefault);
  return (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      className={cn(
        "group inline-flex items-center gap-2 rounded-md px-2 py-1 -mx-2 hover:bg-white/5 transition-colors text-left",
        className,
      )}
    >
      <span
        className={cn(
          "font-mono cipher-reveal",
          revealed
            ? "text-[var(--color-text)]"
            : "text-[var(--color-text-muted)] blur-[0.3px]",
        )}
      >
        {revealed ? plain : cipher}
      </span>
      {revealed ? (
        <EyeOff className="h-3.5 w-3.5 text-[var(--color-text-faint)] opacity-0 group-hover:opacity-100 transition-opacity" />
      ) : (
        <Eye className="h-3.5 w-3.5 text-[var(--color-text-faint)] opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent", className)}
    />
  );
}

export function StatBlock({
  label,
  value,
  sublabel,
  tone = "default",
  mono,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  tone?: "default" | "accent" | "mint";
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-semibold tracking-tight",
          mono && "font-mono cipher-reveal",
          tone === "accent" && "text-[var(--color-accent)]",
          tone === "mint" && "text-[var(--color-mint)]",
        )}
      >
        {value}
      </div>
      {sublabel ? (
        <div className="text-xs text-[var(--color-text-muted)]">{sublabel}</div>
      ) : null}
    </div>
  );
}

export function Avatar({
  seed,
  size = 32,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const hash = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const h1 = (hash * 37) % 360;
  const h2 = (hash * 89) % 360;
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${h1} 70% 55%), hsl(${h2} 70% 35%))`,
      }}
    >
      {seed.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 w-full mx-auto max-w-7xl px-6 md:px-10 py-8 flex flex-col gap-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
