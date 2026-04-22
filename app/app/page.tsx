import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  EyeOff,
  FileLock2,
  LockKeyhole,
  Receipt,
  Scan,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Workflow,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mono } from "@/components/ui/primitives";
import { OnChainProof } from "@/components/ui/on-chain-proof";
import { DEPLOYMENT, HAS_ON_CHAIN_PROOF } from "@/lib/deployment";
import { cn } from "@/lib/utils";

const primitives = [
  {
    name: "Encrypted Token Accounts",
    detail:
      "Every recipient holds an on-chain ETA — amounts Rescue-ciphered, shielded from public indexers.",
  },
  {
    name: "Stealth Pool UTXOs",
    detail:
      "Scheduled unlocks land in Umbra's mixer as receiver-claimable UTXOs. Groth16 ZK proofs sever every sender ↔ recipient link.",
  },
  {
    name: "Hierarchical Viewing Keys",
    detail:
      "Foundations derive per-investor, per-fiscal-year TVKs from one MVK via a Poseidon hash chain. Transparency for the cap table, invisibility for the market.",
  },
  {
    name: "PDA-custodied ETAs",
    detail:
      "Umbra separates spending from decryption — so a vesting PDA can hold funds, the Anchor program can disburse on schedule, and no single key ever sees both.",
  },
];

const modules = [
  {
    tag: "Vest",
    title: "Unobservable token unlocks",
    body: "Vesting cliffs that complete without a single public observer knowing the size, timing, or recipient. Foundations ship quarterly attestations to investors over scoped viewing keys.",
    href: "/vest",
    icon: LockKeyhole,
    accent: "from-[#a78bfa] to-[#5b21b6]",
    badge: "Hero",
  },
  {
    tag: "Stream",
    title: "Private payroll & grants",
    body: "Monthly stipends, research grants, contractor retainers — streamed privately on the same rails. Employers fund once, recipients claim gasless.",
    href: "/employer",
    icon: Banknote,
    accent: "from-[#4ade80] to-[#166534]",
  },
  {
    tag: "Audit",
    title: "Scoped disclosure & tax prep",
    body: "Contributors issue fiscal-year grants to their accountant. Umbra's MPC re-encrypts just that window. 8949-ready CSVs, nothing more.",
    href: "/accountant",
    icon: Receipt,
    accent: "from-[#fbbf24] to-[#b45309]",
  },
];

function HeroBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--color-text-muted)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] pulse-dot" />
      Built on Umbra Privacy · Solana mainnet & devnet
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 md:px-10 pt-20 pb-24 md:pt-28 md:pb-32 flex flex-col items-center text-center gap-8">
          <HeroBadge />
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight max-w-4xl leading-[1.05]">
            The only Solana unlock that{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-br from-[#c4b5fd] via-[#a78bfa] to-[#7c3aed] bg-clip-text text-transparent">
                nobody sees coming
              </span>
            </span>
            .
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Penumbra is private comp infrastructure for Solana. Token vesting,
            payroll, and grants all run through one set of rails — unlocks
            become unobservable, investors still get attestations, contributors
            never get doxxed. Built on Umbra.
          </p>
          <div className="flex flex-wrap items-center gap-3 justify-center">
            <Link
              href="/vest/simulator"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              See an unlock disappear
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/vest"
              className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}
            >
              Open vesting dashboard
            </Link>
            <Link
              href="/docs"
              className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
            >
              How it uses Umbra
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--color-text-faint)] mt-2 flex-wrap justify-center">
            <Badge tone="muted">
              <Sparkles className="h-3 w-3" />
              demo mode — seeded Neuron Labs & Acme Labs DAO
            </Badge>
            <span>•</span>
            <span>
              flip to live SDK (<Mono>@umbra-privacy/sdk@4</Mono>) anytime
            </span>
          </div>
          {HAS_ON_CHAIN_PROOF ? (
            <div className="w-full max-w-2xl mx-auto mt-4">
              <OnChainProof
                label={
                  DEPLOYMENT.firstTickTx
                    ? "First keeper tick posted a stealth-pool UTXO"
                    : "PenumbraScheduler deployed to devnet"
                }
                txSig={DEPLOYMENT.firstTickTx || DEPLOYMENT.deployTxSig}
                caption={`PenumbraScheduler ${DEPLOYMENT.programId.slice(0, 10)}…${DEPLOYMENT.programId.slice(-6)}`}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* PROBLEM CALLOUT */}
      <section className="mx-auto max-w-7xl w-full px-6 md:px-10 pb-20">
        <Card>
          <CardBody className="p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="h-12 w-12 rounded-xl bg-[var(--color-rose)]/10 border border-[var(--color-rose)]/30 flex items-center justify-center shrink-0">
              <TrendingDown className="h-6 w-6 text-[var(--color-rose)]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-rose)] mb-1">
                The problem
              </div>
              <h2 className="text-xl font-semibold tracking-tight mb-3">
                Every Solana token unlock is public. Every cliff gets front-run.
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
                Whale-watchers, MEV bots, and analysts stalk every vesting
                schedule on chain. Cliffs crater prices before recipients can
                even claim. Foundations &quot;solve&quot; this by delaying vesting or
                pre-announcing OTC sales — both terrible. Meanwhile every DAO
                contributor paid in stablecoins hands a block-explorer their
                full comp history.
              </p>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCallout
                  label="Avg price drop after public unlock"
                  value="−17%"
                  tone="rose"
                  sub="within 48h"
                />
                <StatCallout
                  label="Solana DAO contributor comp"
                  value="100%"
                  tone="rose"
                  sub="visible on any explorer"
                />
                <StatCallout
                  label="Projects dodging transparency"
                  value="81%"
                  tone="amber"
                  sub="via OTC / no-vest tricks"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* MODULES */}
      <section className="mx-auto max-w-7xl w-full px-6 md:px-10 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <EyeOff className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">
            Three modules, one rail
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {modules.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.tag}
                href={r.href}
                className="group relative rounded-2xl border border-white/10 bg-[var(--color-bg-card)]/70 p-6 transition-all hover:border-white/20 hover:bg-[var(--color-bg-card)]"
              >
                {r.badge ? (
                  <div className="absolute top-4 right-4">
                    <Badge tone="accent" dot>
                      {r.badge}
                    </Badge>
                  </div>
                ) : null}
                <div
                  className={`inline-flex h-10 w-10 rounded-xl bg-gradient-to-br ${r.accent} items-center justify-center mb-5 shadow-[0_0_30px_-8px_var(--color-accent-glow)]`}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.4} />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
                  {r.tag}
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">
                  {r.title}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {r.body}
                </p>
                <div className="mt-5 inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] opacity-70 group-hover:opacity-100 transition-opacity">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FLOW */}
      <section className="mx-auto max-w-7xl w-full px-6 md:px-10 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Workflow className="h-4 w-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">
            How an unobservable unlock flows
          </h2>
        </div>
        <Card>
          <CardBody className="p-8">
            <ol className="grid md:grid-cols-5 gap-4 items-start">
              {[
                {
                  step: "01",
                  title: "Foundation shields tokens",
                  body: "Vesting supply deposited into a PDA-held Encrypted Token Account. Public balance zeroes out.",
                },
                {
                  step: "02",
                  title: "Program schedules tranches",
                  body: "PenumbraScheduler (Anchor) stores cliff + slope, never amounts. Anyone can poke it to tick.",
                },
                {
                  step: "03",
                  title: "Keeper ticks",
                  body: "Program CPIs into Umbra: `…EncryptedBalanceToReceiverClaimableUtxoCreatorFunction`. UTXO drops in the stealth pool.",
                },
                {
                  step: "04",
                  title: "Investor claims",
                  body: "`getClaimableUtxoScannerFunction` + receiver-claimer. Relayer pays gas. Nothing on-chain links to the tranche.",
                },
                {
                  step: "05",
                  title: "Quarterly attestation",
                  body: "Foundation issues year-scoped TVK to each investor via `getComplianceGrantIssuerFunction`. LP reports ready.",
                },
              ].map((s) => (
                <li key={s.step} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--color-accent)]">
                      {s.step}
                    </span>
                    <span className="text-sm font-medium">{s.title}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </section>

      {/* PRIMITIVES */}
      <section className="mx-auto max-w-7xl w-full px-6 md:px-10 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-4 w-4 text-[var(--color-mint)]" />
          <h2 className="text-sm font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">
            Why this is only possible with Umbra
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {primitives.map((p) => (
            <Card key={p.name}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <FileLock2 className="h-4 w-4 text-[var(--color-accent)] mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">{p.name}</h3>
                    <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                      {p.detail}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-faint)] leading-relaxed mt-4 max-w-3xl">
          None of this works on vanilla Solana, on confidential-transfer
          extensions alone, or on a ZK rollup. Penumbra needs the full Umbra
          stack: PDA-controllable encrypted balances, stealth-pool UTXOs, and
          the time-hierarchical viewing-key derivation.
        </p>
      </section>

      <footer className="mt-auto border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 md:px-10 flex items-center justify-between gap-4 flex-wrap text-xs text-[var(--color-text-faint)]">
          <span>
            Penumbra — built on{" "}
            <a
              href="https://docs.umbraprivacy.com"
              className="text-[var(--color-accent)] hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Umbra Privacy
            </a>{" "}
            for the Umbra Hackathon Track.
          </span>
          <span className="font-mono">
            @umbra-privacy/sdk@4.0.0 · Solana devnet
          </span>
        </div>
      </footer>
    </div>
  );
}

function StatCallout({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "rose" | "amber";
}) {
  const color =
    tone === "rose" ? "text-[var(--color-rose)]" : "text-[var(--color-amber)]";
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
        {label}
      </div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1">{sub}</div>
    </div>
  );
}
