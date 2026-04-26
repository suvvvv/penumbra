import type {
  Investor,
  VestAttestation,
  VestSchedule,
  VestTranche,
} from "../types";

const now = Date.now();
const day = 86400 * 1000;
const iso = (d: number) => new Date(d).toISOString();

export const SEED_FOUNDATION = {
  name: "Neuron Labs Foundation",
  tokenSymbol: "NRN",
  tokenMint: "NrN4xL8Y9kJmPqR2sT5wVcBaH6fGdX3eZ1oI7uA4Sv9",
  tokenDecimals: 9,
  tgeAt: iso(now - 40 * day),
  circulatingSupply: 225_000_000n * 10n ** 9n,
  publicPriceUsd: 1.42,
  schedulerProgramId: "6ZajuboUT9uBgnY9RBbHdErx1rTg6kMjSFkocT1WLbdr",
};

export const SEED_INVESTORS: Investor[] = [
  {
    id: "i_ashoka",
    orgName: "Ashoka Capital",
    label: "Series A lead",
    stealthAddress: "uMBR4As1hoka2zQpW9x6vT3kH5jR8nF1cE7bA4dY6Lm",
    granteeX25519PubKey: "X25519:a4f2c8d1b9e76034589c1fbd",
    avatarSeed: "ashoka",
    round: "series-a",
  },
  {
    id: "i_parsec",
    orgName: "Parsec Ventures",
    label: "Seed",
    stealthAddress: "uMBR4Pa2rsec8mK3vX9wQ1zT6jR4nH7yF5dL2bE8hGc",
    granteeX25519PubKey: "X25519:b7e3d2f1c8a69047582d0ec4",
    avatarSeed: "parsec",
    round: "seed",
  },
  {
    id: "i_stratus",
    orgName: "Stratus Strategic",
    label: "Strategic",
    stealthAddress: "uMBR4St3ratus5nL7vY2wR8zM4kJ1pH6yT3dF9bA2cE",
    granteeX25519PubKey: "X25519:c1a8e4d7b2f93056418c9fba",
    avatarSeed: "stratus",
    round: "strategic",
  },
];

/** Linear month-by-month vest from cliff to end. */
function generateTranches(
  scheduleId: string,
  total: bigint,
  cliffAt: number,
  endsAt: number,
  tranches: number,
): VestTranche[] {
  const amountEach = total / BigInt(tranches);
  const step = (endsAt - cliffAt) / tranches;
  return Array.from({ length: tranches }).map((_, i) => {
    const dueAt = cliffAt + step * (i + 1);
    const elapsed = dueAt <= now;
    const utxo = elapsed
      ? "0x" +
        Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 16).toString(16),
        ).join("")
      : undefined;
    return {
      id: `${scheduleId}_t${i + 1}`,
      scheduleId,
      tranchIndex: i + 1,
      amount: amountEach,
      dueAt: iso(dueAt),
      executedAt: elapsed ? iso(dueAt + 60 * 1000) : undefined,
      utxoCommitment: utxo,
      claimedAt: elapsed ? iso(dueAt + 2 * 3600 * 1000) : undefined,
      claimTxSig: elapsed
        ? "4ClaimVest" +
          Array.from({ length: 40 }, () =>
            "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
              Math.floor(Math.random() * 36),
            ),
          ).join("")
        : undefined,
      status: elapsed ? "claimed" : "scheduled",
    } satisfies VestTranche;
  });
}

export const SEED_VEST_SCHEDULES: VestSchedule[] = [
  {
    id: "v_ashoka_sa",
    foundationName: SEED_FOUNDATION.name,
    tokenSymbol: SEED_FOUNDATION.tokenSymbol,
    tokenMint: SEED_FOUNDATION.tokenMint,
    tokenDecimals: SEED_FOUNDATION.tokenDecimals,
    totalAllocation: 14_400_000n * 10n ** 9n,
    investorId: "i_ashoka",
    cliffAt: iso(now - 30 * day),
    endsAt: iso(now + (48 - 2) * 30 * day),
    curve: "monthly-step",
    tranches: 48,
    tranchesDisbursed: 2,
    status: "active",
    pdaAddress: "PdA1AshokaVestNrN7kL3vY8wQ2zR4mH9yF6jT5bE3cD",
    createdAt: iso(now - 45 * day),
    publicSupplyPct: 6.4,
  },
  {
    id: "v_parsec_seed",
    foundationName: SEED_FOUNDATION.name,
    tokenSymbol: SEED_FOUNDATION.tokenSymbol,
    tokenMint: SEED_FOUNDATION.tokenMint,
    tokenDecimals: SEED_FOUNDATION.tokenDecimals,
    totalAllocation: 8_000_000n * 10n ** 9n,
    investorId: "i_parsec",
    cliffAt: iso(now - 60 * day),
    endsAt: iso(now + (36 - 4) * 30 * day),
    curve: "monthly-step",
    tranches: 36,
    tranchesDisbursed: 4,
    status: "active",
    pdaAddress: "PdA2ParsecVestNrN9mK3vY6wR8zT4jH1pF5dL7bE2cA",
    createdAt: iso(now - 75 * day),
    publicSupplyPct: 3.5,
  },
  {
    id: "v_stratus_strategic",
    foundationName: SEED_FOUNDATION.name,
    tokenSymbol: SEED_FOUNDATION.tokenSymbol,
    tokenMint: SEED_FOUNDATION.tokenMint,
    tokenDecimals: SEED_FOUNDATION.tokenDecimals,
    totalAllocation: 3_200_000n * 10n ** 9n,
    investorId: "i_stratus",
    cliffAt: iso(now + 5 * day),
    endsAt: iso(now + (24 + 5) * 30 * day),
    curve: "quarterly-step",
    tranches: 8,
    tranchesDisbursed: 0,
    status: "pending",
    pdaAddress: "PdA3StratusVestNrN4nL7vY2wR8zM5kJ9pH6yT3dF1bA",
    createdAt: iso(now - 15 * day),
    publicSupplyPct: 1.4,
  },
];

export const SEED_VEST_TRANCHES: VestTranche[] = SEED_VEST_SCHEDULES.flatMap(
  (s) =>
    generateTranches(
      s.id,
      s.totalAllocation,
      new Date(s.cliffAt).getTime(),
      new Date(s.endsAt).getTime(),
      s.tranches,
    ),
);

export const SEED_VEST_ATTESTATIONS: VestAttestation[] = [
  {
    id: "att_ashoka_fy26",
    scheduleId: "v_ashoka_sa",
    investorId: "i_ashoka",
    granteeX25519PubKey: "X25519:a4f2c8d1b9e76034589c1fbd",
    fiscalYearStart: iso(new Date(2026, 0, 1).getTime()),
    fiscalYearEnd: iso(new Date(2026, 11, 31).getTime()),
    tvkFingerprint: "tvk:8c3a…21ef (year=2026)",
    issuedAt: iso(now - 10 * day),
    lastAccessedAt: iso(now - 2 * day),
  },
];

export const SEED_VEST_INITIAL_STATE = {
  foundation: SEED_FOUNDATION,
  investors: SEED_INVESTORS,
  vestSchedules: SEED_VEST_SCHEDULES,
  vestTranches: SEED_VEST_TRANCHES,
  vestAttestations: SEED_VEST_ATTESTATIONS,
};
