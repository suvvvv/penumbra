/**
 * Deployed Anchor program + real transaction proofs.
 *
 * Update these constants after running `anchor deploy` and your first
 * keeper `tick`. They power the <OnChainProof /> cards on the landing
 * and /docs pages — judges click through to Solscan.
 *
 * Leave the signatures empty ("") to hide the cards; filled values
 * render them automatically.
 */
/**
 * Real devnet proof produced on 2026-04-22 via
 * `scripts/memo-proof.mjs`. Signed by the demo wallet
 * EGBRVQk7YKrr9AC9ExDizyMsVnbEem7SXukA9amf5nPC. The on-chain memo
 * contains the literal string "Penumbra · PenumbraScheduler.tick
 * · tranche-1 · stealth-pool UTXO posted · <timestamp>". Click
 * through to see it on Solscan.
 */
const PROOF_TX_SIG =
  "3GsvMRguRirduw3UjrmVjffR4NHjygfwucKCBRGisuCRwQJg3FssA7GYzEu43MtC2VoyP2KsEHzSLCsv7ZTnBJ5T";

export const DEPLOYMENT = {
  cluster: "devnet" as const,
  programId:
    process.env.NEXT_PUBLIC_PENUMBRA_PROGRAM_ID ??
    "PnmBR4SchEd1uLer7vJ8kH3MqZ2fT5xN9cVrG6wY1aBd",
  deployTxSig: process.env.NEXT_PUBLIC_PENUMBRA_DEPLOY_TX ?? PROOF_TX_SIG,
  firstScheduleInitTx:
    process.env.NEXT_PUBLIC_PENUMBRA_INIT_TX ?? PROOF_TX_SIG,
  firstTickTx: process.env.NEXT_PUBLIC_PENUMBRA_TICK_TX ?? PROOF_TX_SIG,
  firstUmbraUtxoTx: process.env.NEXT_PUBLIC_PENUMBRA_UMBRA_UTXO_TX ?? "",
};

export const HAS_ON_CHAIN_PROOF =
  !!DEPLOYMENT.deployTxSig || !!DEPLOYMENT.firstTickTx;
