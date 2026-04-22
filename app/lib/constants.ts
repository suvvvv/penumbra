import type { Cadence, TokenMeta, Network } from "./types";

export const NETWORK: Network =
  (process.env.NEXT_PUBLIC_UMBRA_NETWORK as Network) ?? "devnet";

export const UMBRA_ENDPOINTS = {
  devnet: {
    indexer: "https://utxo-indexer.api-devnet.umbraprivacy.com",
    relayer: "https://relayer.api-devnet.umbraprivacy.com",
    rpcUrl:
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    rpcSubscriptionsUrl:
      process.env.NEXT_PUBLIC_SOLANA_RPC_WS ?? "wss://api.devnet.solana.com",
  },
  "mainnet-beta": {
    indexer: "https://utxo-indexer.api.umbraprivacy.com",
    relayer: "https://relayer.api.umbraprivacy.com",
    rpcUrl:
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
      "https://api.mainnet-beta.solana.com",
    rpcSubscriptionsUrl:
      process.env.NEXT_PUBLIC_SOLANA_RPC_WS ??
      "wss://api.mainnet-beta.solana.com",
  },
} as const;

export const TOKENS: Record<string, TokenMeta> = {
  USDC: {
    symbol: "USDC",
    mint:
      NETWORK === "mainnet-beta"
        ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        : "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    decimals: 6,
    network: NETWORK,
  },
  USDT: {
    symbol: "USDT",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    network: NETWORK,
  },
};

export const DEFAULT_TOKEN = TOKENS.USDC;

export const CADENCE_LABELS: Record<Cadence, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  "one-time": "One-time",
};

export const CADENCE_DAYS: Record<Cadence, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  "one-time": 0,
};

export const DEMO_MODE_DEFAULT = true;
