import { nanoid } from "nanoid";
import type {
  ComplianceGrant,
  Contributor,
  DecryptedDisbursement,
  Disbursement,
  Investor,
  Stream,
  UmbraSessionState,
  VestAttestation,
  VestSchedule,
  VestTranche,
} from "../types";
import { TOKENS } from "../constants";
import { maskCiphertext } from "../utils";
import type {
  CreateDisbursementParams,
  DecryptedAttestation,
  IssueAttestationParams,
  IssueGrantParams,
  TickVestResult,
  TreasuryBalance,
  UmbraService,
} from "./service";
import { useAppStore } from "../store/app-store";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mkCommitment(): string {
  return (
    "0x" +
    Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("")
  );
}

function mkSig(prefix = "5UmbrA"): string {
  return (
    prefix +
    Array.from({ length: 80 - prefix.length }, () =>
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
        Math.floor(Math.random() * 62),
      ),
    ).join("")
  );
}

/**
 * Deterministic demo shim. All operations mutate the zustand store
 * so the UI reflects the flows exactly as the real SDK would.
 *
 * Intentional latency is added to every call so demo recordings
 * feel authentic (ZK proof generation + indexer lookups really do
 * take ~1.5s in production).
 */
export class DemoUmbraService implements UmbraService {
  readonly mode = "demo" as const;

  async ensureRegistered(): Promise<UmbraSessionState> {
    await wait(400);
    const walletAddress = useAppStore.getState().walletAddress;
    const mvkFingerprint =
      "mvk:" + maskCiphertext(4) + "…" + maskCiphertext(4);
    useAppStore
      .getState()
      .setSession({ registered: true, walletAddress, mvkFingerprint });
    return {
      registered: true,
      walletAddress,
      mvkFingerprint,
    };
  }

  async getTreasuryBalance(tokenMint: string): Promise<TreasuryBalance> {
    await wait(180);
    const treasury = useAppStore.getState().treasury;
    return {
      tokenMint,
      publicBalance: treasury.publicBalance,
      encryptedBalance: treasury.encryptedBalance,
    };
  }

  async fundEncryptedTreasury(
    _tokenMint: string,
    amount: bigint,
  ): Promise<string> {
    await wait(1400);
    useAppStore.getState().adjustTreasury({
      publicBalance: -amount,
      encryptedBalance: amount,
    });
    return mkSig("5DepoSit");
  }

  async withdrawTreasury(
    _tokenMint: string,
    amount: bigint,
  ): Promise<string> {
    await wait(1400);
    useAppStore.getState().adjustTreasury({
      publicBalance: amount,
      encryptedBalance: -amount,
    });
    return mkSig("5WithDraw");
  }

  async createDisbursement(
    params: CreateDisbursementParams,
  ): Promise<Disbursement> {
    await wait(1800);
    const disbursement: Disbursement = {
      id: "d_" + nanoid(8),
      streamId: params.streamId,
      amount: params.amount,
      tokenMint: params.tokenMint,
      utxoCommitment: mkCommitment(),
      encryptedPayloadPreview: maskCiphertext(24),
      memo: params.memo,
      createdAt: new Date().toISOString(),
      claimStatus: "pending",
      txSig: mkSig("5MixerUtxO"),
    };
    useAppStore.getState().addDisbursement(disbursement);
    useAppStore.getState().adjustTreasury({
      encryptedBalance: -params.amount,
    });
    return disbursement;
  }

  async scanClaimable(contributorId: string): Promise<Disbursement[]> {
    await wait(600);
    const streamIds = useAppStore
      .getState()
      .streams.filter((s) => s.contributorId === contributorId)
      .map((s) => s.id);
    return useAppStore
      .getState()
      .disbursements.filter(
        (d) => streamIds.includes(d.streamId) && d.claimStatus === "pending",
      );
  }

  async claimDisbursement(
    disbursementId: string,
    target: "encrypted" | "public",
  ): Promise<Disbursement> {
    await wait(1700);
    const sig = mkSig(
      target === "encrypted" ? "5ClaimEnc" : "5ClaimPub",
    );
    const updated = useAppStore.getState().claimDisbursement(
      disbursementId,
      target,
      sig,
    );
    if (!updated) throw new Error("Disbursement not found");
    return updated;
  }

  async issueComplianceGrant(
    params: IssueGrantParams,
  ): Promise<ComplianceGrant> {
    await wait(900);
    const grant: ComplianceGrant = {
      id: "g_" + nanoid(8),
      issuerContributorId: params.issuerContributorId,
      granteeLabel: params.granteeLabel,
      granteeX25519PubKey: params.granteeX25519PubKey,
      scope: params.scope,
      scopeFrom: params.scopeFrom,
      scopeTo: params.scopeTo,
      scopeDisbursementIds: params.scopeDisbursementIds,
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    useAppStore.getState().addGrant(grant);
    return grant;
  }

  async revokeComplianceGrant(grantId: string): Promise<void> {
    await wait(400);
    useAppStore.getState().revokeGrant(grantId);
  }

  async decryptForGrantee(
    grantId: string,
  ): Promise<DecryptedDisbursement[]> {
    await wait(1100);
    const state = useAppStore.getState();
    const grant = state.grants.find((g) => g.id === grantId);
    if (!grant || grant.revoked) return [];

    const contributor = state.contributors.find(
      (c) => c.id === grant.issuerContributorId,
    );
    if (!contributor) return [];

    const streams = state.streams.filter(
      (s) => s.contributorId === contributor.id,
    );
    const streamMap = new Map(streams.map((s) => [s.id, s]));

    const disbursements = state.disbursements
      .filter((d) => streamMap.has(d.streamId))
      .filter((d) => d.claimStatus !== "pending")
      .filter((d) => {
        if (grant.scope === "single-tx") {
          return grant.scopeDisbursementIds?.includes(d.id) ?? false;
        }
        if (grant.scopeFrom && new Date(d.createdAt) < new Date(grant.scopeFrom))
          return false;
        if (grant.scopeTo && new Date(d.createdAt) > new Date(grant.scopeTo))
          return false;
        return true;
      });

    return disbursements.map<DecryptedDisbursement>((d) => {
      const stream = streamMap.get(d.streamId)!;
      const tokenSymbol =
        Object.values(TOKENS).find((t) => t.mint === d.tokenMint)?.symbol ??
        "TOKEN";
      return {
        disbursementId: d.id,
        streamLabel: stream.label,
        employerOrg: stream.employerOrg,
        contributorHandle: contributor.handle,
        amount: d.amount,
        tokenSymbol,
        timestamp: d.createdAt,
        memo: d.memo,
        txSig: d.txSig,
      };
    });
  }

  async listStreams(employerOrg?: string): Promise<Stream[]> {
    await wait(120);
    const streams = useAppStore.getState().streams;
    if (!employerOrg) return streams;
    return streams.filter((s) => s.employerOrg === employerOrg);
  }

  async listContributors(): Promise<Contributor[]> {
    await wait(80);
    return useAppStore.getState().contributors;
  }

  async tickVestTranche(trancheId: string): Promise<TickVestResult> {
    await wait(1900);
    const utxo = mkCommitment();
    const tranche = useAppStore.getState().tickVestTranche(trancheId, utxo);
    if (!tranche) throw new Error("Tranche not found");
    return {
      tranche,
      schedulerTxSig: mkSig("5PnmBRSched"),
      umbraUtxoTxSig: mkSig("5UmbrAUtxO"),
    };
  }

  async scanInvestorClaims(investorId: string): Promise<VestTranche[]> {
    await wait(500);
    const state = useAppStore.getState();
    const scheduleIds = state.vestSchedules
      .filter((s) => s.investorId === investorId)
      .map((s) => s.id);
    return state.vestTranches.filter(
      (t) => scheduleIds.includes(t.scheduleId) && t.status === "utxo-posted",
    );
  }

  async claimVestTranche(
    trancheId: string,
    target: "encrypted" | "public",
  ): Promise<VestTranche> {
    await wait(1600);
    const sig = mkSig(target === "encrypted" ? "5VestClaimE" : "5VestClaimP");
    const updated = useAppStore.getState().claimVestTranche(trancheId, sig);
    if (!updated) throw new Error("Tranche not found");
    return updated;
  }

  async issueVestAttestation(
    params: IssueAttestationParams,
  ): Promise<VestAttestation> {
    await wait(1000);
    const att: VestAttestation = {
      id: "att_" + Math.random().toString(36).slice(2, 10),
      scheduleId: params.scheduleId,
      investorId: params.investorId,
      granteeX25519PubKey: params.granteeX25519PubKey,
      fiscalYearStart: params.fiscalYearStart,
      fiscalYearEnd: params.fiscalYearEnd,
      tvkFingerprint:
        "tvk:" +
        maskCiphertext(4) +
        "…" +
        maskCiphertext(4) +
        " (year=" +
        new Date(params.fiscalYearStart).getUTCFullYear() +
        ")",
      issuedAt: new Date().toISOString(),
    };
    useAppStore.getState().addAttestation(att);
    return att;
  }

  async decryptAttestation(
    attestationId: string,
  ): Promise<DecryptedAttestation> {
    await wait(1400);
    const state = useAppStore.getState();
    const att = state.vestAttestations.find((a) => a.id === attestationId);
    if (!att) throw new Error("Attestation not found");
    const schedule = state.vestSchedules.find((s) => s.id === att.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    const investor = state.investors.find((i) => i.id === att.investorId);
    if (!investor) throw new Error("Investor not found");

    const tranches = state.vestTranches.filter(
      (t) =>
        t.scheduleId === schedule.id &&
        t.status === "claimed" &&
        (!t.claimedAt ||
          (new Date(t.claimedAt) >= new Date(att.fiscalYearStart) &&
            new Date(t.claimedAt) <= new Date(att.fiscalYearEnd))),
    );

    const totalDisbursed = tranches.reduce((sum, t) => sum + t.amount, 0n);

    useAppStore.getState().markAttestationAccessed(attestationId);

    return {
      attestation: att,
      schedule,
      investor,
      tranches,
      totalDisbursed,
    };
  }

  async listVestSchedules(): Promise<VestSchedule[]> {
    await wait(80);
    return useAppStore.getState().vestSchedules;
  }
}

