"use client";

import { useEffect, useState } from "react";

/**
 * Zustand's persist middleware rehydrates on the client only.
 * Wrapping state-dependent subtrees in <Hydrated> prevents the
 * SSR vs. client mismatch React otherwise warns about.
 */
export function Hydrated({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
