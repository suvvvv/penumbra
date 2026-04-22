# PenumbraScheduler

Minimal Anchor program that custodies private token-vesting schedules and
CPIs into Umbra's stealth-pool UTXO creator on each tranche tick.

## Why it exists

Umbra decouples *spending* keys from *viewing* keys. A PDA can own an
Encrypted Token Account (ETA), decide *when* to disburse, and hand the
viewing keys to investors — without any single key ever being able to both
move funds and reveal balances to outsiders.

PenumbraScheduler is the thinnest possible program that makes this useful
for real-world vesting:

1. `initialize_schedule` — foundation records cadence (cliff, slope,
   tranche count) on-chain. **Never amounts, never recipients.**
2. `tick` — anyone can call. If a tranche is due, CPIs into Umbra's
   `create_receiver_claimable_utxo_from_encrypted_balance` entrypoint.
   Commitment lands in the stealth pool; amount + recipient + sender
   linkage all encrypted.
3. `cancel` — authority-only safety hatch.
4. `attest` — authority-only. Emits an event pointing at an Umbra
   compliance grant scoped to an investor's X25519 key for a fiscal-year
   window.

## Deploy

```bash
# at repo root
anchor build
anchor deploy --provider.cluster devnet
```

The IDL lands in `target/idl/penumbra_scheduler.json` — the Next.js app
imports it at build time (see `app/lib/anchor/`).

## Program ID

- **Devnet:** `PnmBR4SchEd1uLer7vJ8kH3MqZ2fT5xN9cVrG6wY1aBd`
- **Umbra program (CPI target):** `uMBr4PrivAcySol4n4Pr0gr4mId1234567890abcdef`
  (resolved at build time from `@umbra-privacy/sdk/constants`).

## Layout

```
programs/penumbra-scheduler/
├── Cargo.toml
├── Xargo.toml
├── src/
│   └── lib.rs    # whole program in one file — <400 lines
└── tests/
    └── penumbra-scheduler.ts
```

## Security model

- **Funds at rest** — live in an Umbra ETA owned by the schedule PDA.
  Only the Umbra program can move them. This program can only *ask* Umbra
  to post a UTXO for a tranche-sized amount.
- **Viewing rights** — held by the schedule authority's MVK. Investors
  each receive a Poseidon-derived TVK scoped to their fiscal year via
  the attestation event.
- **Keeper permissions** — `tick` is permissionless. Anyone can pay the
  gas, including the investor themselves. Relayer reimbursement lives
  on the Umbra side.

## Integration points

- `umbra_cpi` module (generated from Umbra IDL at build time) provides
  typed CPI builders for `create_receiver_claimable_utxo_from_encrypted_balance`
  and `issue_compliance_grant`.
- The web app calls `initialize_schedule` + `attest` directly; `tick`
  is typically invoked by a keeper worker (example in
  `workers/keeper.ts`).
