import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-accent-strong)] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:bg-[#7c4dfa] active:scale-[0.98] hover:shadow-[0_0_30px_-8px_var(--color-accent-glow)]",
        secondary:
          "bg-white/5 text-[var(--color-text)] border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]",
        ghost:
          "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5",
        outline:
          "border border-[var(--color-accent-strong)]/40 bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-accent-strong)]/10",
        danger:
          "bg-[var(--color-rose)]/10 text-[var(--color-rose)] border border-[var(--color-rose)]/30 hover:bg-[var(--color-rose)]/20",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
