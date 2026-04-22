# scripts/

## `deploy-and-tick.ts`

After you run `anchor deploy`, run this once to:

1. Create a vest schedule via `initialize_schedule`
2. Wait 35s for the cliff
3. Call `tick` — producing your first real tx sig
4. Print an `.env.local` block to paste into the app

```bash
# Prereqs
solana config set --url devnet
solana airdrop 2
anchor build
anchor deploy
# then:
npx tsx scripts/deploy-and-tick.ts
```

Copy the printed `NEXT_PUBLIC_PENUMBRA_*` lines into
`app/.env.local` and restart `npm run dev`. The landing page's
on-chain proof card will light up with a Solscan link.
