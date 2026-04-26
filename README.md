# Penumbra — Private Comp Infrastructure on Solana

> **The only Solana unlock that nobody sees coming.**
> Private token vesting, payroll, and grants on the same rails.
> Built on [Umbra Privacy](https://umbraprivacy.com).

🔗 **Live demo:** https://penumbra-three.vercel.app
🎯 **On-chain proof (devnet):** [Solscan — memo tx with "Penumbra" payload](https://solscan.io/tx/3GsvMRguRirduw3UjrmVjffR4NHjygfwucKCBRGisuCRwQJg3FssA7GYzEu43MtC2VoyP2KsEHzSLCsv7ZTnBJ5T?cluster=devnet)
💻 **Source:** https://github.com/suvvvv/penumbra

---

Every Solana token unlock is public. Every cliff gets front-run. Every DAO
contributor has their comp history doxxed by default. Penumbra ends that.

| Module | Who it's for | What it does |
|---|---|---|
| **Vest** (hero) | Token foundations, VC funds | Unobservable vesting. Cliffs complete without a public signal. Investors still get scoped attestations. |
| **Stream** | DAOs, grant programs | Private payroll, retainers, research grants. |
| **Audit** | CPAs, fund admins | Accept a scoped viewing key, decrypt just the authorized window, export an 8949-ready CSV. |

---

## The problem

### Vesting is broken
Every unlock on Solana is public. Analysts and MEV bots short into every
cliff. Median price action after a 4-5% supply unlock: **−14 to −18% within
72 hours.** Foundations "solve" this with OTC sales, delayed vesting, or
silent off-chain distributions — all terrible compromises.

### Comp is worse
Every DAO contributor paid in stablecoins hands any block-explorer user
their full earnings history. Recruiters, competitors, exes, and
adversaries can read it like a CV.

### The missing primitive
Transparency to the right parties (cap table, fund admin, tax authority)
without transparency to everyone else. Public blockchains don't offer this.
Umbra does.

## The solution

Penumbra is three modules on one privacy rail:

### Vest — unobservable token unlocks
1. Foundation shields the full vest supply into an Umbra ETA owned by a
   `VestSchedule` PDA.
2. Our Anchor program (`programs/penumbra-scheduler`) records the cadence
   on-chain. **No amounts, no recipients on-chain.**
3. A keeper calls `tick` on cadence. The program CPIs into Umbra's
   `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction`. A receiver-
   claimable UTXO lands in the stealth pool.
4. Recipients claim privately. Gas paid by the Umbra relayer.
5. Foundation issues per-investor, per-fiscal-year viewing keys via
   `getComplianceGrantIssuerFunction`. Cap-table transparency preserved.

### Stream — private payroll & grants
Same primitives, different cadence. DAOs pay contributors without ever
broadcasting the amount or recipient.

### Audit — scoped decrypt
Accountant loads a grant ID, clicks decrypt, gets a CSV. Umbra's MPC
re-encrypts just the authorized window for the grantee's X25519 key.

## Why this is only possible with Umbra

Each of these matters, and together they don't exist anywhere else:

- **Encrypted Token Accounts (ETAs)** — private-by-default balances, Rescue-
  ciphered, PDA-controllable. Vanilla Solana Confidential Transfer extensions
  can't be held by arbitrary PDAs without losing viewing-key separation.
- **Stealth-pool UTXOs** — Groth16-proof receiver-claimable UTXOs. Sender ↔
  recipient link severed cryptographically, not by heuristic obfuscation.
- **Time-hierarchical MVKs** — a single Poseidon hash chain turns "give me a
  fiscal-year viewing key" into **one SDK call.** This is the compliance
  primitive that nobody else has, and it's the reason Vest can offer
  real cap-table transparency at all.
- **L1/viewing key decoupling** — PDAs hold funds, X25519 keys read balances.
  A vesting PDA can schedule disbursements while the foundation MVK alone
  reads the history.

## How Penumbra uses the Umbra SDK

Eight distinct `@umbra-privacy/sdk` factories plus our own Anchor program
that CPIs into Umbra.

| Lifecycle stage | Umbra SDK factory |
|---|---|
| Session init | `getUmbraClient`, `getUserRegistrationFunction` |
| Treasury shielding | `getPublicBalanceToEncryptedBalanceDirectDepositorFunction` |
| Treasury withdraw | `getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction` |
| **Vest tick (CPI from `PenumbraScheduler`)** | `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction` + `@umbra-privacy/web-zk-prover` |
| Recipient scan | `getClaimableUtxoScannerFunction` |
| Recipient claim (gasless) | `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction` |
| Attestation issue | `getMasterViewingKeyDeriver` → `getComplianceGrantIssuerFunction` |
| Fund admin / CPA decrypt | `getSharedCiphertextReencryptorForUserGrantFunction` |

See [`app/app/docs/page.tsx`](app/app/docs/page.tsx) for the recipes and
[`app/lib/umbra/real.ts`](app/lib/umbra/real.ts) for the live wiring.

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Next.js 16 app (app/)                                     │
│                                                            │
│   /                    overview + unlock narrative         │
│   /vest                foundation dashboard  (HERO)        │
│   /vest/simulator      unlock-FUD chart       (WOW)        │
│   /employer            stream / payroll                    │
│   /contributor         recipient claim + tax preview       │
│   /accountant          scoped decrypt + CSV export         │
│   /docs                six SDK recipes                     │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  app/lib/umbra/                                            │
│   service.ts   shared interface used by every UI           │
│   real.ts      live @umbra-privacy/sdk calls (8 factories) │
│   demo.ts      deterministic shim — reliable demos         │
│   hook.ts      useUmbra() picks impl based on toggle       │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│  programs/penumbra-scheduler (Anchor)                      │
│   · initialize_schedule  · tick                            │
│   · cancel               · attest                          │
│   tick() CPIs into Umbra to post stealth-pool UTXOs.       │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
      Solana devnet · Umbra devnet indexer / relayer / MPC
```

### Data flow — a vesting cliff completes privately

```
t-1d  keeper polls PenumbraScheduler PDAs, finds cliff_ts ≤ now
t+0   keeper.tick(schedule)
      → PenumbraScheduler verifies due tranche index
      → CPI into Umbra getEncryptedBalanceToReceiverClaimableUtxoCreatorFn
      → UTXO lands in stealth pool keyed to recipient stealth addr
      → program emits TrancheTicked (no amount, no recipient)
t+0.1h  recipient wallet scans pool → finds UTXO via
        getClaimableUtxoScannerFunction → claims gasless into ETA
t+quarterly  foundation.attest(investor_x25519, fy_window)
             → Umbra compliance-grant PDA created
             → event emitted; investor dashboard decrypts own history
```

## Deployed artifacts

- `PenumbraScheduler` devnet program id:
  `6ZajuboUT9uBgnY9RBbHdErx1rTg6kMjSFkocT1WLbdr`
  ([Solscan](https://solscan.io/account/6ZajuboUT9uBgnY9RBbHdErx1rTg6kMjSFkocT1WLbdr?cluster=devnet))
- Umbra SDK version: `@umbra-privacy/sdk@4.0.0`
- Umbra devnet endpoints (auto-configured):
  - indexer: `https://utxo-indexer.api-devnet.umbraprivacy.com`
  - relayer: `https://relayer.api-devnet.umbraprivacy.com`

## Setup

Requires **Node ≥ 20**. Anchor + Solana CLI optional (needed only to
rebuild the program).

```bash
# Frontend
cd app
npm install
npm run dev
# → http://localhost:3000

# Program (optional — already deployed to devnet)
cd programs/penumbra-scheduler
anchor build
anchor deploy --provider.cluster devnet
```

Environment variables (optional — defaults work for demo mode):

```bash
# app/.env.local
NEXT_PUBLIC_UMBRA_NETWORK=devnet           # or mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_RPC_WS=wss://api.devnet.solana.com
```

## Demo

See `DEMO_SCRIPT.md` — tight 4:30 walk-through, opens with the unobservable
unlock and closes on the CSV export.

**Demo vs live mode.** The app ships with a demo-mode toggle (top nav).
With it on, every SDK call runs against an in-memory shim with seeded
Neuron Labs + Acme Labs data — so the video never breaks on an RPC flake.
Flip it off and every call in `app/lib/umbra/real.ts` dispatches to
`@umbra-privacy/sdk@4` against Umbra devnet.

## Repo layout

```
Umbra/
├── app/                                # Next.js 16 frontend
│   ├── app/
│   │   ├── page.tsx                    # landing
│   │   ├── vest/                       # foundation vesting dashboard
│   │   │   ├── page.tsx
│   │   │   └── simulator/page.tsx      # unlock-FUD chart (hero wow)
│   │   ├── employer/                   # stream / payroll
│   │   ├── contributor/                # recipient claim
│   │   ├── accountant/                 # scoped decrypt
│   │   ├── docs/                       # six SDK recipes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                         # design system primitives
│   │   ├── layout/                     # top nav, providers
│   │   ├── vest/                       # dashboard + simulator
│   │   ├── employer/
│   │   ├── contributor/
│   │   └── accountant/
│   └── lib/
│       ├── constants.ts
│       ├── types.ts
│       ├── store/                      # Zustand (persisted, bigint-safe)
│       └── umbra/
│           ├── service.ts              # shared interface
│           ├── real.ts                 # live @umbra-privacy/sdk calls
│           ├── demo.ts                 # deterministic shim
│           ├── seed.ts                 # stream seeded data
│           ├── vest-seed.ts            # vesting seeded data
│           ├── hook.ts                 # useUmbra()
│           └── index.ts
├── programs/
│   └── penumbra-scheduler/             # Anchor program
│       ├── Cargo.toml
│       ├── src/lib.rs                  # all 4 instructions
│       ├── tests/
│       └── README.md
├── Anchor.toml
├── Cargo.toml
├── DEMO_SCRIPT.md
└── README.md
```

## Why Penumbra wins the Umbra hackathon track

| Criterion | How Penumbra scores |
|---|---|
| **Core SDK integration** | 8 distinct Umbra factories across ETAs, stealth-pool UTXOs, compliance grants, MPC re-encryption — plus a custom Anchor program that CPIs into Umbra. Not cosmetic. |
| **Innovation** | Private token vesting isn't on Umbra's prompt. It's the only compelling "only possible with Umbra" demo we found — needs PDA+ETA custody, stealth UTXOs, *and* time-hierarchical TVKs together. |
| **Technical execution** | Anchor program + Next.js app + live/demo mode toggle + typed factory wrappers + BigInt-safe persist + deployable program. |
| **Commercial potential** | Every Solana token project with ≥1 vest schedule is a buyer. Every DAO paying in stables is a secondary. |
| **Impact** | Fixes unlock FUD, fixes contributor doxxing, keeps regulators and fund admins happy. |
| **Usability** | Role-switchable, gasless claims, one-click attestations, interactive simulator. |
| **Completeness** | Six working surfaces + Anchor program + docs page + simulator + README + demo script. |

## License

MIT.
