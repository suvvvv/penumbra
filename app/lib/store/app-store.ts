import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ComplianceGrant,
  Contributor,
  Disbursement,
  Investor,
  Role,
  Stream,
  UmbraSessionState,
  VestAttestation,
  VestSchedule,
  VestTranche,
} from "../types";
import { SEED_INITIAL_STATE } from "../umbra/seed";
import { SEED_VEST_INITIAL_STATE } from "../umbra/vest-seed";

interface TreasuryState {
  publicBalance: bigint;
  encryptedBalance: bigint;
}

interface AppState {
  role: Role;
  walletAddress?: string;
  currentContributorId?: string;
  demoMode: boolean;
  onboardedRoles: Role[];
  session: UmbraSessionState;

  streams: Stream[];
  contributors: Contributor[];
  disbursements: Disbursement[];
  grants: ComplianceGrant[];
  treasury: TreasuryState;

  investors: Investor[];
  vestSchedules: VestSchedule[];
  vestTranches: VestTranche[];
  vestAttestations: VestAttestation[];
  currentInvestorId?: string;

  setRole: (role: Role) => void;
  setWalletAddress: (addr?: string) => void;
  setCurrentContributorId: (id?: string) => void;
  setDemoMode: (on: boolean) => void;
  markOnboarded: (role: Role) => void;
  setSession: (s: UmbraSessionState) => void;

  addStream: (stream: Stream) => void;
  updateStreamStatus: (id: string, status: Stream["status"]) => void;
  addDisbursement: (d: Disbursement) => void;
  claimDisbursement: (
    id: string,
    target: "encrypted" | "public",
    sig: string,
  ) => Disbursement | undefined;
  addGrant: (g: ComplianceGrant) => void;
  revokeGrant: (id: string) => void;
  adjustTreasury: (delta: {
    publicBalance?: bigint;
    encryptedBalance?: bigint;
  }) => void;

  setCurrentInvestorId: (id?: string) => void;
  tickVestTranche: (trancheId: string, utxoCommitment: string) => VestTranche | undefined;
  claimVestTranche: (trancheId: string, sig: string) => VestTranche | undefined;
  addAttestation: (att: VestAttestation) => void;
  addVestSchedule: (schedule: VestSchedule, tranches: VestTranche[]) => void;
  markAttestationAccessed: (id: string) => void;

  resetToSeed: () => void;
}

/**
 * localStorage doesn't support bigint — the SDK's branded U64 type
 * is a bigint, so the store uses a replacer/reviver pair that tags
 * bigints as `{__bigint__: "..."}` on serialize and rehydrates them.
 */
function replacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return { __bigint__: value.toString() };
  }
  return value;
}

function reviver(_key: string, value: unknown): unknown {
  if (
    value &&
    typeof value === "object" &&
    "__bigint__" in value &&
    typeof (value as { __bigint__: string }).__bigint__ === "string"
  ) {
    return BigInt((value as { __bigint__: string }).__bigint__);
  }
  return value;
}

const bigintStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    } as Storage;
  }
  return window.localStorage;
}, {
  replacer,
  reviver,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: "employer",
      walletAddress: undefined,
      currentContributorId: "c_mira",
      demoMode: true,
      onboardedRoles: [],
      session: { registered: false },

      streams: SEED_INITIAL_STATE.streams,
      contributors: SEED_INITIAL_STATE.contributors,
      disbursements: SEED_INITIAL_STATE.disbursements,
      grants: SEED_INITIAL_STATE.grants,
      treasury: SEED_INITIAL_STATE.treasury,

      investors: SEED_VEST_INITIAL_STATE.investors,
      vestSchedules: SEED_VEST_INITIAL_STATE.vestSchedules,
      vestTranches: SEED_VEST_INITIAL_STATE.vestTranches,
      vestAttestations: SEED_VEST_INITIAL_STATE.vestAttestations,
      currentInvestorId: "i_ashoka",

      setRole: (role) => set({ role }),
      setWalletAddress: (walletAddress) => set({ walletAddress }),
      setCurrentContributorId: (currentContributorId) =>
        set({ currentContributorId }),
      setDemoMode: (demoMode) => set({ demoMode }),
      markOnboarded: (role) => {
        const roles = get().onboardedRoles;
        if (roles.includes(role)) return;
        set({ onboardedRoles: [...roles, role] });
      },
      setSession: (session) => set({ session }),

      addStream: (stream) => set({ streams: [stream, ...get().streams] }),
      updateStreamStatus: (id, status) =>
        set({
          streams: get().streams.map((s) =>
            s.id === id ? { ...s, status } : s,
          ),
        }),
      addDisbursement: (d) =>
        set({ disbursements: [d, ...get().disbursements] }),
      claimDisbursement: (id, target, sig) => {
        let updated: Disbursement | undefined;
        set({
          disbursements: get().disbursements.map((d) => {
            if (d.id !== id) return d;
            updated = {
              ...d,
              claimStatus:
                target === "encrypted" ? "claimed-encrypted" : "claimed-public",
              claimedAt: new Date().toISOString(),
              claimTxSig: sig,
            };
            return updated;
          }),
        });
        return updated;
      },
      addGrant: (g) => set({ grants: [g, ...get().grants] }),
      revokeGrant: (id) =>
        set({
          grants: get().grants.map((g) =>
            g.id === id ? { ...g, revoked: true } : g,
          ),
        }),
      adjustTreasury: (delta) => {
        const t = get().treasury;
        set({
          treasury: {
            publicBalance:
              t.publicBalance + (delta.publicBalance ?? 0n),
            encryptedBalance:
              t.encryptedBalance + (delta.encryptedBalance ?? 0n),
          },
        });
      },

      setCurrentInvestorId: (currentInvestorId) => set({ currentInvestorId }),
      tickVestTranche: (trancheId, utxoCommitment) => {
        let updated: VestTranche | undefined;
        set({
          vestTranches: get().vestTranches.map((t) => {
            if (t.id !== trancheId) return t;
            updated = {
              ...t,
              status: "utxo-posted",
              executedAt: new Date().toISOString(),
              utxoCommitment,
            };
            return updated;
          }),
        });
        if (updated) {
          const schedule = get().vestSchedules.find(
            (s) => s.id === updated!.scheduleId,
          );
          if (schedule) {
            set({
              vestSchedules: get().vestSchedules.map((s) =>
                s.id === schedule.id
                  ? { ...s, tranchesDisbursed: s.tranchesDisbursed + 1 }
                  : s,
              ),
            });
          }
        }
        return updated;
      },
      claimVestTranche: (trancheId, sig) => {
        let updated: VestTranche | undefined;
        set({
          vestTranches: get().vestTranches.map((t) => {
            if (t.id !== trancheId) return t;
            updated = {
              ...t,
              status: "claimed",
              claimedAt: new Date().toISOString(),
              claimTxSig: sig,
            };
            return updated;
          }),
        });
        return updated;
      },
      addAttestation: (att) =>
        set({ vestAttestations: [att, ...get().vestAttestations] }),
      addVestSchedule: (schedule, tranches) =>
        set({
          vestSchedules: [schedule, ...get().vestSchedules],
          vestTranches: [...tranches, ...get().vestTranches],
        }),
      markAttestationAccessed: (id) =>
        set({
          vestAttestations: get().vestAttestations.map((a) =>
            a.id === id ? { ...a, lastAccessedAt: new Date().toISOString() } : a,
          ),
        }),

      resetToSeed: () =>
        set({
          streams: SEED_INITIAL_STATE.streams,
          contributors: SEED_INITIAL_STATE.contributors,
          disbursements: SEED_INITIAL_STATE.disbursements,
          grants: SEED_INITIAL_STATE.grants,
          treasury: SEED_INITIAL_STATE.treasury,

          investors: SEED_VEST_INITIAL_STATE.investors,
          vestSchedules: SEED_VEST_INITIAL_STATE.vestSchedules,
          vestTranches: SEED_VEST_INITIAL_STATE.vestTranches,
          vestAttestations: SEED_VEST_INITIAL_STATE.vestAttestations,

          session: { registered: false },
        }),
    }),
    {
      name: "stipend-store",
      storage: bigintStorage,
      version: 1,
    },
  ),
);
