# Penumbra — demo video script (4:30)

Target **4:30**. Hard cap 5:00. Opens with the image that closes the sale:
a split-screen of the same unlock with and without Penumbra.

All jargon is defined the first time it appears. Narration is calm and
declarative — the product is doing the lifting.

---

## 00:00 — 00:22 · Cold open · the image (22s)

**B-roll:** split-screen. Left: real BONK / PYTH unlock chart from Dune,
price cratering visibly at the cliff. Right: the same cliff date, flat
line. Zoom in on the right. Hold for two beats.

> **VO:** Every Solana token unlock is public. Every cliff gets
> front-run. This — on the right — is what an unlock looks like when the
> foundation and its investors are the only people who know it happened.
>
> This is Penumbra.

## 00:22 — 01:15 · `/vest/simulator` ⭐ (53s)

**On screen:** navigate to `/vest/simulator`. The hero chart fills the
screen — red crater on the left, flat green on the right.

> **VO:** Here's the visceral version. I'm Neuron Labs. I'm about to
> unlock 4% of circulating supply to my Series A.

**Action:** drag the *Unlock size* slider from 4 → 10%. The red chart
steepens its crash. The green stays flat.

> **VO:** If I do this publicly — which is what every Solana project
> does today — my token drops eighteen, twenty percent in 72 hours.
> Retail gets dumped on. My community loses faith. Transparency got
> achieved; so did the carnage.
>
> With Penumbra, the same unlock completes inside Umbra's stealth pool.
> **Nobody on Solana has the signal.** Right chart — flat. Down there,
> the market-cap-protected number.

**Action:** point to the "Market cap protected: $39.6M" card.

## 01:15 — 02:15 · `/vest` foundation dashboard (60s)

**On screen:** `/vest`. Show the three active schedules for Neuron Labs.
Point to the encrypted locked-supply number (cipher field).

> **VO:** This is the foundation control room. Each row is a vesting
> schedule — Series A, Seed, Strategic. The supply is held in an
> Encrypted Token Account, custodied by a Program Derived Address on
> our Anchor program. Public ATA balance for this mint? Zero.

**Action:** hover the cipher field, reveal "32M NRN locked".

> **VO:** The authority can reveal; nobody else can.

**Action:** click *Tick now* on the Ashoka Capital schedule. Watch the
loading state, then the success toast showing the scheduler tx sig and
the Umbra UTXO tx sig.

> **VO:** When I press tick, PenumbraScheduler — our Anchor program —
> CPIs into Umbra's `getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction`.
> A Groth16 proof is generated, a UTXO drops in the stealth pool. Two
> transactions land on-chain: our scheduler tick, and the Umbra UTXO
> post. Neither leaks the amount or the recipient.

## 02:15 — 02:55 · Investor claims (40s)

**On screen:** the Investor Portal card on the right side of `/vest`.
Select "Ashoka Capital" in the dropdown (should already be there).

> **VO:** Now I'm Ashoka Capital, the Series A fund. My tranche just
> dropped.

**Action:** click *Claim → ETA* on the pending tranche. Toast confirms
gasless claim.

> **VO:** One click. Gasless via Umbra's relayer — Ashoka never had to
> hold SOL. The tranche lands in their own Encrypted Token Account.
> Still nothing about this unlock is visible to anyone else on Solana.

## 02:55 — 03:45 · Attestation → fund admin decrypt (50s)

**On screen:** scroll to the Ashoka schedule row. Click *Issue
attestation*. Dialog opens. FY 2026 pre-selected. Click *Issue*. Toast
shows the grant ID.

> **VO:** Quarterly report time. Ashoka's fund admin needs to see
> *their* tranches — and nothing else. The foundation issues an
> attestation scoped to Ashoka's X25519 key, for fiscal year 2026. One
> SDK call: `getMasterViewingKeyDeriver` → `getComplianceGrantIssuerFunction`.

**Action:** scroll to *Attestations* card (bottom right). Click
*Decrypt scope* on the freshly issued attestation. Short spinner. Toast
confirms decrypted count and token amount.

> **VO:** From the fund admin's side: one click, and Umbra's MPC
> re-encrypts just Ashoka's tranches in that window. The admin sees
> every distribution, amounts, dates. The foundation's other
> investors — Parsec, Stratus — invisible. That's the trick: time-
> hierarchical viewing keys derived by a Poseidon hash chain. **This is
> only possible because Umbra's viewing keys are a hash tree.**

## 03:45 — 04:10 · Stream & SDK depth (25s)

**On screen:** quickly navigate to `/employer`. Show the same rails
powering monthly payroll. Don't linger — 15 seconds.

> **VO:** Same infrastructure, same primitives — for payroll, grants,
> retainers. Vesting is the hero. Private comp is the tail.

**Action:** navigate to `/docs`. Scroll through the six SDK recipe
cards, slowly.

> **VO:** Under the hood, Penumbra drives eight Umbra SDK factories and
> our own Anchor program. None of it is cosmetic. Every live-mode
> button you see maps to one of these calls.

## 04:10 — 04:30 · Closer (20s)

**On screen:** cut back to the simulator. Hold on the split-screen
chart. Fade in the GitHub URL and `@PenumbraPrivacy` handle.

> **VO:** Every Solana token unlock today tanks a project you believe
> in, without that project ever having the choice to do it differently.
> Penumbra gives them that choice. Transparency for the cap table.
> Invisibility for the market.
>
> Built on Umbra. For the Umbra Hackathon Track.

---

## Production notes

- Record at 1920×1080, 60fps. Downscale in post.
- Demo-mode toggle stays ON the entire video. Every latency in the shim
  was tuned to match real SDK timing (~1.8s UTXO post, ~1.4s decrypt).
- Before recording: click the **Reset demo** arrow in the top nav for
  guaranteed clean seed state.
- Shoot the simulator slider in one take — it's the closer image.
- The foundation *Tick now* → toast → investor *Claim* sequence is
  the cinematic moment. Film it in one take, no cuts.
- Keep the devnet badge visible throughout — subtle credibility.

## Soundtrack

Low-BPM ambient under narration. Nothing dramatic. Product's story is
dry and confident; stingers will cheapen it. Suggested: Max Richter
"Infra 5" or a royalty-free equivalent.
