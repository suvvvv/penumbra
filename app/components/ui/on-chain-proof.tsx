import { ExternalLink, ShieldCheck } from "lucide-react";
import { Mono } from "./primitives";
import { truncateAddress } from "@/lib/utils";

/**
 * Renders a first-class on-chain proof card pointing at a real Solana
 * explorer link. Populate PROGRAM_ID / DEPLOY_TX / TICK_TX after
 * `anchor deploy` and your first keeper tick.
 */
export function OnChainProof({
  label,
  txSig,
  cluster = "devnet",
  caption,
}: {
  label: string;
  txSig: string;
  cluster?: "devnet" | "mainnet-beta";
  caption?: string;
}) {
  const explorer = `https://solscan.io/tx/${txSig}?cluster=${cluster}`;
  return (
    <a
      href={explorer}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-[var(--color-mint)]/25 bg-[var(--color-mint)]/5 px-4 py-3 hover:border-[var(--color-mint)]/40 hover:bg-[var(--color-mint)]/10 transition-colors"
    >
      <div className="h-8 w-8 rounded-lg bg-[var(--color-mint)]/15 border border-[var(--color-mint)]/30 flex items-center justify-center shrink-0">
        <ShieldCheck className="h-4 w-4 text-[var(--color-mint)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[var(--color-mint)] font-medium">
            On-chain proof · {cluster}
          </span>
        </div>
        <div className="text-sm">
          {label}{" "}
          <Mono className="text-[var(--color-text-muted)]">
            {truncateAddress(txSig, 10, 8)}
          </Mono>
        </div>
        {caption ? (
          <div className="text-xs text-[var(--color-text-faint)] mt-0.5">
            {caption}
          </div>
        ) : null}
      </div>
      <ExternalLink className="h-4 w-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-mint)] transition-colors shrink-0" />
    </a>
  );
}

export function ProgramIdBadge({
  programId,
  cluster = "devnet",
}: {
  programId: string;
  cluster?: "devnet" | "mainnet-beta";
}) {
  const explorer = `https://solscan.io/account/${programId}?cluster=${cluster}`;
  return (
    <a
      href={explorer}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-[var(--color-text-muted)] hover:border-white/20 hover:text-[var(--color-text)] transition-colors font-mono"
    >
      <span className="text-[var(--color-accent)]">PenumbraScheduler</span>
      {truncateAddress(programId, 6, 6)}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}
