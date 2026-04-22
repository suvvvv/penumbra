"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof window === "undefined") return null;

  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
  }[size];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-2xl border border-white/10 bg-[var(--color-bg-elevated)] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col",
          sizeClass,
        )}
      >
        <div className="px-6 py-5 border-b border-white/5 flex items-start justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-[var(--color-text-muted)] leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-faint)] hover:text-[var(--color-text)] transition-colors p-1 -m-1 rounded"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer ? (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
