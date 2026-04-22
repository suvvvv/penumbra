import { DemoUmbraService } from "./demo";
import { LiveUmbraService } from "./real";
import type { UmbraService } from "./service";
import { SEED_INITIAL_STATE } from "./seed";

let instance: UmbraService | null = null;
let currentMode: "demo" | "live" | null = null;

export function getUmbraService(mode: "demo" | "live"): UmbraService {
  if (!instance || currentMode !== mode) {
    instance = mode === "demo" ? new DemoUmbraService() : new LiveUmbraService();
    currentMode = mode;
  }
  return instance;
}

export { SEED_INITIAL_STATE };
export type { UmbraService } from "./service";
export type {
  CreateDisbursementParams,
  IssueGrantParams,
  TreasuryBalance,
} from "./service";
