export type Role = "employer" | "contributor" | "accountant";

export type Network = "devnet" | "mainnet-beta";

export type Cadence = "weekly" | "biweekly" | "monthly" | "one-time";

export type StreamStatus = "active" | "paused" | "ended";

export type ClaimStatus = "pending" | "claimed-encrypted" | "claimed-public";

export interface TokenMeta {
  symbol: string;
  mint: string;
  decimals: number;
  network: Network;
}

export interface Contributor {
  id: string;
  handle: string;
  displayName: string;
  stealthAddress: string;
  avatarSeed: string;
}

export interface Stream {
  id: string;
  label: string;
  employerOrg: string;
  contributorId: string;
  tokenMint: string;
  amountPerPeriod: bigint;
  cadence: Cadence;
  startsAt: string;
  endsAt?: string;
  memo?: string;
  status: StreamStatus;
  createdAt: string;
}

export interface Disbursement {
  id: string;
  streamId: string;
  amount: bigint;
  tokenMint: string;
  utxoCommitment: string;
  encryptedPayloadPreview: string;
  memo?: string;
  createdAt: string;
  claimStatus: ClaimStatus;
  claimTxSig?: string;
  claimedAt?: string;
  txSig: string;
}

export interface ComplianceGrant {
  id: string;
  issuerContributorId: string;
  granteeLabel: string;
  granteeX25519PubKey: string;
  scope: "fiscal-year" | "month" | "date-range" | "single-tx";
  scopeFrom?: string;
  scopeTo?: string;
  scopeDisbursementIds?: string[];
  createdAt: string;
  revoked: boolean;
}

export interface DecryptedDisbursement {
  disbursementId: string;
  streamLabel: string;
  employerOrg: string;
  contributorHandle: string;
  amount: bigint;
  tokenSymbol: string;
  timestamp: string;
  memo?: string;
  txSig: string;
}

export interface UmbraSessionState {
  registered: boolean;
  walletAddress?: string;
  mvkFingerprint?: string;
}

export type VestCurve = "linear" | "monthly-step" | "quarterly-step";

export type VestStatus = "pending" | "active" | "complete" | "cancelled";

export interface Investor {
  id: string;
  orgName: string;
  label: string;
  stealthAddress: string;
  granteeX25519PubKey: string;
  avatarSeed: string;
  round: "pre-seed" | "seed" | "series-a" | "series-b" | "strategic";
}

export interface VestSchedule {
  id: string;
  foundationName: string;
  tokenSymbol: string;
  tokenMint: string;
  tokenDecimals: number;
  totalAllocation: bigint;
  investorId: string;
  cliffAt: string;
  endsAt: string;
  curve: VestCurve;
  tranches: number;
  tranchesDisbursed: number;
  status: VestStatus;
  pdaAddress: string;
  createdAt: string;
  publicSupplyPct: number;
}

export interface VestTranche {
  id: string;
  scheduleId: string;
  tranchIndex: number;
  amount: bigint;
  dueAt: string;
  executedAt?: string;
  claimedAt?: string;
  utxoCommitment?: string;
  claimTxSig?: string;
  status: "scheduled" | "utxo-posted" | "claimed";
}

export interface VestAttestation {
  id: string;
  scheduleId: string;
  investorId: string;
  granteeX25519PubKey: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  tvkFingerprint: string;
  issuedAt: string;
  lastAccessedAt?: string;
}
