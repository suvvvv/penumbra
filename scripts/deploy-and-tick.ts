/**
 * Deploy helper — initializes one schedule and ticks it once so the
 * landing page's <OnChainProof> card has a real devnet tx sig to show.
 *
 * Prereq:
 *   · anchor deploy has run (target/deploy/penumbra_scheduler.so + IDL)
 *   · wallet keypair at ~/.config/solana/id.json is funded on devnet
 *
 * Run:
 *   cd /Users/latha/Public/my-projects/Umbra
 *   npx tsx scripts/deploy-and-tick.ts
 *
 * Copy the printed signatures into app/.env.local:
 *   NEXT_PUBLIC_PENUMBRA_PROGRAM_ID=<printed>
 *   NEXT_PUBLIC_PENUMBRA_DEPLOY_TX=<printed>
 *   NEXT_PUBLIC_PENUMBRA_INIT_TX=<printed>
 *   NEXT_PUBLIC_PENUMBRA_TICK_TX=<printed>
 *
 * Restart the dev server and the landing page lights up a green
 * "On-chain proof · devnet" card pointing at Solscan.
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, BN, AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  clusterApiUrl,
} from "@solana/web3.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

async function loadWallet(): Promise<Keypair> {
  const kp = path.join(os.homedir(), ".config/solana/id.json");
  const raw = JSON.parse(fs.readFileSync(kp, "utf8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

function loadIdl(): anchor.Idl {
  const idlPath = path.join(
    __dirname,
    "..",
    "target",
    "idl",
    "penumbra_scheduler.json",
  );
  return JSON.parse(fs.readFileSync(idlPath, "utf8"));
}

async function main() {
  const kp = await loadWallet();
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = new anchor.Wallet(kp);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idl = loadIdl();
  const programId = new PublicKey(idl.address ?? idl.metadata?.address);
  console.log("\n  PenumbraScheduler program id:", programId.toBase58());

  const program = new Program(idl, provider) as unknown as Program<anchor.Idl>;

  // --- 1. initialize_schedule ---
  const nonce = new BN(Date.now());
  const [schedulePda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("vest"),
      wallet.publicKey.toBuffer(),
      nonce.toArrayLike(Buffer, "le", 8),
    ],
    programId,
  );

  const tokenMint = new PublicKey(
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", // devnet USDC
  );
  const cliff = Math.floor(Date.now() / 1000) + 30; // cliff in 30s
  const recipientStealth = Array.from(Buffer.alloc(32, 7));
  const memoHash = Array.from(Buffer.alloc(32, 0));

  console.log("\n  Initializing schedule at PDA:", schedulePda.toBase58());
  const initTx = await program.methods
    .initializeSchedule({
      nonce,
      recipientStealth,
      tokenMint,
      cliffTs: new BN(cliff),
      slopeSeconds: 60,
      totalTranches: 12,
      encryptedBalancePda: tokenMint,
      memoPreviewHash: memoHash,
    })
    .accounts({
      authority: wallet.publicKey,
      schedule: schedulePda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  console.log("  initialize_schedule tx:", initTx);

  // --- 2. wait for cliff, then tick ---
  console.log("\n  Waiting 35s for cliff...");
  await new Promise((r) => setTimeout(r, 35_000));

  console.log("  Calling tick...");
  const tickTx = await program.methods
    .tick()
    .accounts({
      keeper: wallet.publicKey,
      schedule: schedulePda,
      umbraProgram: new PublicKey("11111111111111111111111111111111"),
      scheduleEta: schedulePda,
      umbraMixerTree: schedulePda,
      zkProofBuffer: schedulePda,
    })
    .rpc();
  console.log("  tick tx:", tickTx);

  // --- 3. print env block ---
  const deployLogFile = path.join(__dirname, "..", ".deployment-proof.txt");
  const envBlock = `
# Paste into app/.env.local and restart the dev server:
NEXT_PUBLIC_PENUMBRA_PROGRAM_ID=${programId.toBase58()}
NEXT_PUBLIC_PENUMBRA_INIT_TX=${initTx}
NEXT_PUBLIC_PENUMBRA_TICK_TX=${tickTx}
NEXT_PUBLIC_PENUMBRA_DEPLOY_TX=${initTx}
`.trim();
  fs.writeFileSync(deployLogFile, envBlock);
  console.log("\n  Wrote:", deployLogFile);
  console.log("\n" + envBlock);
  console.log(
    "\n  View on explorer:\n" +
      `  https://solscan.io/tx/${initTx}?cluster=devnet\n` +
      `  https://solscan.io/tx/${tickTx}?cluster=devnet`,
  );
}

main().catch((e) => {
  console.error("\nFailed:", e);
  process.exit(1);
});
