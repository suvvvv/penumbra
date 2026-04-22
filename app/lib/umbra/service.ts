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

export interface IssueGrantParams {
  issuerContributorId: string;
  granteeLabel: string;
  granteeX25519PubKey: string;
  scope: ComplianceGrant["scope"];
  scopeFrom?: string;
  scopeTo?: string;
  scopeDisbursementIds?: string[];
}

export interface CreateDisbursementParams {
  streamId: string;
  contributorId: string;
  amount: bigint;
  tokenMint: string;
  memo?: string;
}

export interface TreasuryBalance {
  tokenMint: string;
  publicBalance: bigint;
  encryptedBalance: bigint;
}

export interface TickVestResult {
  tranche: VestTranche;
  schedulerTxSig: string;
  umbraUtxoTxSig: string;
}

export interface IssueAttestationParams {
  scheduleId: string;
  investorId: string;
  granteeX25519PubKey: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
}

export interface DecryptedAttestation {
  attestation: VestAttestation;
  schedule: VestSchedule;
  investor: Investor;
  tranches: VestTranche[];
  totalDisbursed: bigint;
}

/**
 * UmbraService is the shared interface used by every UI surface.
 * Two implementations exist: the real @umbra-privacy/sdk wrapper
 * (lib/umbra/real.ts) and a deterministic demo shim (lib/umbra/demo.ts).
 *
 * The shim exists purely so demos and the submission video are
 * reliable — when demo-mode is off, every method dispatches to the
 * real SDK and hits the Umbra indexer + relayer on devnet.
 */
export interface UmbraService {
  mode: "demo" | "live";

  ensureRegistered(): Promise<UmbraSessionState>;

  getTreasuryBalance(tokenMint: string): Promise<TreasuryBalance>;

  fundEncryptedTreasury(tokenMint: string, amount: bigint): Promise<string>;

  withdrawTreasury(tokenMint: string, amount: bigint): Promise<string>;

  createDisbursement(
    params: CreateDisbursementParams,
  ): Promise<Disbursement>;

  scanClaimable(contributorId: string): Promise<Disbursement[]>;

  claimDisbursement(
    disbursementId: string,
    target: "encrypted" | "public",
  ): Promise<Disbursement>;

  issueComplianceGrant(params: IssueGrantParams): Promise<ComplianceGrant>;

  revokeComplianceGrant(grantId: string): Promise<void>;

  decryptForGrantee(grantId: string): Promise<DecryptedDisbursement[]>;

  listStreams(employerOrg?: string): Promise<Stream[]>;

  listContributors(): Promise<Contributor[]>;

  /**
   * Vesting surface (Penumbra Vest module) — the hero flow.
   *
   * tickVestTranche is the call the keeper (or anyone) makes to
   * advance a vest schedule. In live mode it invokes our
   * PenumbraScheduler Anchor program which CPIs into Umbra's
   * `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction`.
   */
  tickVestTranche(trancheId: string): Promise<TickVestResult>;

  scanInvestorClaims(investorId: string): Promise<VestTranche[]>;

  claimVestTranche(
    trancheId: string,
    target: "encrypted" | "public",
  ): Promise<VestTranche>;

  issueVestAttestation(
    params: IssueAttestationParams,
  ): Promise<VestAttestation>;

  decryptAttestation(attestationId: string): Promise<DecryptedAttestation>;

  listVestSchedules(): Promise<VestSchedule[]>;
}
