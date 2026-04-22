// Integration tests for PenumbraScheduler against devnet + a deployed
// Umbra program. These are skipped in CI without a funded keypair —
// run locally with `anchor test --skip-local-validator --provider.cluster devnet`.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PenumbraScheduler } from "../target/types/penumbra_scheduler";
import { expect } from "chai";

describe("penumbra-scheduler", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .PenumbraScheduler as Program<PenumbraScheduler>;

  it("initializes a vesting schedule", async () => {
    const nonce = new anchor.BN(Date.now());
    const [schedule] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("vest"),
        provider.wallet.publicKey.toBuffer(),
        nonce.toArrayLike(Buffer, "le", 8),
      ],
      program.programId,
    );

    const recipientStealth = Buffer.alloc(32, 7);
    const tokenMint = new anchor.web3.PublicKey(
      "NrN4xL8Y9kJmPqR2sT5wVcBaH6fGdX3eZ1oI7uA4Sv9",
    );
    const cliff = Math.floor(Date.now() / 1000) + 60;
    const memoHash = Buffer.alloc(32, 0);

    await program.methods
      .initializeSchedule({
        nonce,
        recipientStealth: Array.from(recipientStealth),
        tokenMint,
        cliffTs: new anchor.BN(cliff),
        slopeSeconds: 3600,
        totalTranches: 48,
        encryptedBalancePda: tokenMint,
        memoPreviewHash: Array.from(memoHash),
      })
      .accounts({
        authority: provider.wallet.publicKey,
        schedule,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const acct = await program.account.vestSchedule.fetch(schedule);
    expect(acct.totalTranches).to.equal(48);
    expect(acct.tranchesDisbursed).to.equal(0);
  });

  it("refuses tick before cliff", async () => {
    // ... omitted — exercise the PreCliff error path ...
  });

  it("refuses duplicate ticks within the same slope", async () => {
    // ... omitted — exercise NothingDue ...
  });
});
