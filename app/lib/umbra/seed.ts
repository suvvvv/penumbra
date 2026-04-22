import type {
  ComplianceGrant,
  Contributor,
  Disbursement,
  Stream,
} from "../types";
import { TOKENS } from "../constants";

const USDC = TOKENS.USDC.mint;

const now = Date.now();
const day = 86400 * 1000;
const iso = (d: number) => new Date(d).toISOString();

export const SEED_EMPLOYER_ORG = "Acme Labs DAO";

export const SEED_CONTRIBUTORS: Contributor[] = [
  {
    id: "c_mira",
    handle: "mira.sol",
    displayName: "Mira Chen",
    stealthAddress: "uMBR4Mi1a9C7eQvHhM2dJpXqK4eNvZrC6PwJzLmx9Kq",
    avatarSeed: "mira",
  },
  {
    id: "c_dev",
    handle: "devak.sol",
    displayName: "Devak Iyer",
    stealthAddress: "uMBR4De4k8L2nV3hQ9fP1xW5rY7pUdH2BgA8TsE6Jm",
    avatarSeed: "devak",
  },
  {
    id: "c_sana",
    handle: "sana.sol",
    displayName: "Sana Park",
    stealthAddress: "uMBR4Sa2naQ6bRt4mX8zC1vN7kL3yP5gH9dWfJ0iR",
    avatarSeed: "sana",
  },
  {
    id: "c_leo",
    handle: "leo.sol",
    displayName: "Leo Okafor",
    stealthAddress: "uMBR4Le0oP3kS8uY2aF6mD4rT9wN1bQ7xH5cJgVo",
    avatarSeed: "leo",
  },
];

export const SEED_STREAMS: Stream[] = [
  {
    id: "s_mira_monthly",
    label: "Design lead — monthly",
    employerOrg: SEED_EMPLOYER_ORG,
    contributorId: "c_mira",
    tokenMint: USDC,
    amountPerPeriod: 8_500_000_000n,
    cadence: "monthly",
    startsAt: iso(now - 90 * day),
    memo: "Salary — design org",
    status: "active",
    createdAt: iso(now - 120 * day),
  },
  {
    id: "s_dev_biweekly",
    label: "Protocol engineer — biweekly",
    employerOrg: SEED_EMPLOYER_ORG,
    contributorId: "c_dev",
    tokenMint: USDC,
    amountPerPeriod: 5_200_000_000n,
    cadence: "biweekly",
    startsAt: iso(now - 84 * day),
    memo: "Salary — core protocol",
    status: "active",
    createdAt: iso(now - 100 * day),
  },
  {
    id: "s_sana_grant",
    label: "Research grant — Q2",
    employerOrg: SEED_EMPLOYER_ORG,
    contributorId: "c_sana",
    tokenMint: USDC,
    amountPerPeriod: 12_000_000_000n,
    cadence: "monthly",
    startsAt: iso(now - 60 * day),
    endsAt: iso(now + 30 * day),
    memo: "Grant — ZK research Q2",
    status: "active",
    createdAt: iso(now - 70 * day),
  },
  {
    id: "s_leo_weekly",
    label: "Contractor — weekly",
    employerOrg: SEED_EMPLOYER_ORG,
    contributorId: "c_leo",
    tokenMint: USDC,
    amountPerPeriod: 1_400_000_000n,
    cadence: "weekly",
    startsAt: iso(now - 28 * day),
    memo: "Contractor — frontend",
    status: "active",
    createdAt: iso(now - 35 * day),
  },
];

function gen(
  id: string,
  streamId: string,
  amount: bigint,
  daysAgo: number,
  memo: string | undefined,
  claim: Disbursement["claimStatus"],
): Disbursement {
  return {
    id,
    streamId,
    amount,
    tokenMint: USDC,
    utxoCommitment:
      "0x" +
      Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join(""),
    encryptedPayloadPreview:
      "aGVs" +
      Array.from({ length: 28 }, () =>
        "abcdefghijklmnop".charAt(Math.floor(Math.random() * 16)),
      ).join(""),
    memo,
    createdAt: iso(now - daysAgo * day),
    claimStatus: claim,
    claimedAt: claim !== "pending" ? iso(now - daysAgo * day + 3600_000) : undefined,
    claimTxSig:
      claim !== "pending"
        ? "5sUmbrAcLa1M" +
          Array.from({ length: 40 }, () =>
            "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
              Math.floor(Math.random() * 36),
            ),
          ).join("")
        : undefined,
    txSig:
      "3MixerUtxO" +
      Array.from({ length: 40 }, () =>
        "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
          Math.floor(Math.random() * 36),
        ),
      ).join(""),
  };
}

export const SEED_DISBURSEMENTS: Disbursement[] = [
  // Mira — 3 past months claimed encrypted
  gen("d_mira_1", "s_mira_monthly", 8_500_000_000n, 90, "Salary — Jan", "claimed-encrypted"),
  gen("d_mira_2", "s_mira_monthly", 8_500_000_000n, 60, "Salary — Feb", "claimed-encrypted"),
  gen("d_mira_3", "s_mira_monthly", 8_500_000_000n, 30, "Salary — Mar", "claimed-encrypted"),
  gen("d_mira_4", "s_mira_monthly", 8_500_000_000n, 1, "Salary — Apr", "pending"),
  // Devak — biweekly
  gen("d_dev_1", "s_dev_biweekly", 5_200_000_000n, 84, "Retainer", "claimed-encrypted"),
  gen("d_dev_2", "s_dev_biweekly", 5_200_000_000n, 70, "Retainer", "claimed-public"),
  gen("d_dev_3", "s_dev_biweekly", 5_200_000_000n, 56, "Retainer", "claimed-encrypted"),
  gen("d_dev_4", "s_dev_biweekly", 5_200_000_000n, 42, "Retainer", "claimed-encrypted"),
  gen("d_dev_5", "s_dev_biweekly", 5_200_000_000n, 28, "Retainer", "claimed-encrypted"),
  gen("d_dev_6", "s_dev_biweekly", 5_200_000_000n, 14, "Retainer", "claimed-encrypted"),
  gen("d_dev_7", "s_dev_biweekly", 5_200_000_000n, 0, "Retainer", "pending"),
  // Sana — grant (2 past, 1 pending)
  gen("d_sana_1", "s_sana_grant", 12_000_000_000n, 60, "Grant — Apr", "claimed-encrypted"),
  gen("d_sana_2", "s_sana_grant", 12_000_000_000n, 30, "Grant — May", "claimed-encrypted"),
  gen("d_sana_3", "s_sana_grant", 12_000_000_000n, 2, "Grant — Jun", "pending"),
  // Leo — weekly (4 past claimed, 1 pending)
  gen("d_leo_1", "s_leo_weekly", 1_400_000_000n, 28, undefined, "claimed-encrypted"),
  gen("d_leo_2", "s_leo_weekly", 1_400_000_000n, 21, undefined, "claimed-encrypted"),
  gen("d_leo_3", "s_leo_weekly", 1_400_000_000n, 14, undefined, "claimed-encrypted"),
  gen("d_leo_4", "s_leo_weekly", 1_400_000_000n, 7, undefined, "claimed-public"),
  gen("d_leo_5", "s_leo_weekly", 1_400_000_000n, 0, undefined, "pending"),
];

export const SEED_GRANTS: ComplianceGrant[] = [];

export const SEED_TREASURY = {
  publicBalance: 450_000_000_000n,
  encryptedBalance: 310_000_000_000n,
};

export const SEED_INITIAL_STATE = {
  streams: SEED_STREAMS,
  contributors: SEED_CONTRIBUTORS,
  disbursements: SEED_DISBURSEMENTS,
  grants: SEED_GRANTS,
  treasury: SEED_TREASURY,
};
