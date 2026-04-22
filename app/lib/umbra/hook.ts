"use client";

import { useMemo } from "react";
import { useAppStore } from "../store/app-store";
import { getUmbraService } from "./index";
import type { UmbraService } from "./service";

/**
 * Returns the active UmbraService for the current session.
 * Flipping the demo-mode toggle swaps the underlying instance
 * without unmounting anything.
 */
export function useUmbra(): UmbraService {
  const demoMode = useAppStore((s) => s.demoMode);
  return useMemo(() => getUmbraService(demoMode ? "demo" : "live"), [demoMode]);
}
