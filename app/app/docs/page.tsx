import Link from "next/link";
import { ArrowUpRight, BookOpen, Cpu, KeyRound, Terminal } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mono, PageShell } from "@/components/ui/primitives";

const recipes: {
  title: string;
  when: string;
  code: string;
  sdkFn: string[];
}[] = [
  {
    title: "1 · Client bootstrap & user registration",
    when: "Run once on wallet connect. Idempotent on-chain.",
    sdkFn: ["getUmbraClient", "getUserRegistrationFunction"],
    code: `import {
  getUmbraClient,
  getUserRegistrationFunction,
} from "@umbra-privacy/sdk";

const client = await getUmbraClient({
  signer,                         // wallet-adapter or in-memory
  network: "devnet",
  rpcUrl: "https://api.devnet.solana.com",
  rpcSubscriptionsUrl: "wss://api.devnet.solana.com",
  indexerApiEndpoint:
    "https://utxo-indexer.api-devnet.umbraprivacy.com",
});

const register = getUserRegistrationFunction({ client });
await register({ confidential: true, anonymous: true });`,
  },
  {
    title: "2 · Employer shields treasury",
    when: "Employer deposits USDC into the encrypted treasury ETA.",
    sdkFn: ["getPublicBalanceToEncryptedBalanceDirectDepositorFunction"],
    code: `import { getPublicBalanceToEncryptedBalanceDirectDepositorFunction }
  from "@umbra-privacy/sdk";

const deposit =
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });

// Stipend calls this when the employer clicks "Shield into ETA".
await deposit(employerAddress, USDC_MINT, 25_000_000_000n);`,
  },
  {
    title: "3 · Scheduler fires a private disbursement",
    when: "Cron fires on each stream's cadence. Umbra mints a receiver-claimable UTXO.",
    sdkFn: [
      "getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction",
      "@umbra-privacy/web-zk-prover",
    ],
    code: `import { getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction }
  from "@umbra-privacy/sdk";
import { getCreateReceiverClaimableUtxoFromEncryptedBalanceProver }
  from "@umbra-privacy/web-zk-prover";

const zkProver =
  getCreateReceiverClaimableUtxoFromEncryptedBalanceProver();

const disburse =
  getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction(
    { client },
    { zkProver },
  );

// For each stream that is due:
await disburse({
  mint: stream.tokenMint,
  amount: stream.amountPerPeriod,
  recipientStealthAddress: contributor.stealthAddress,
  memo: stream.memo,                 // encrypted payload
});
// → a single UTXO leaf added to the Umbra mixer Merkle tree.`,
  },
  {
    title: "4 · Contributor scans & claims",
    when: "Contributor opens Stipend. We scan the stealth pool and claim pending UTXOs.",
    sdkFn: [
      "getClaimableUtxoScannerFunction",
      "getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction",
    ],
    code: `import {
  getClaimableUtxoScannerFunction,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
} from "@umbra-privacy/sdk";

const scan = getClaimableUtxoScannerFunction({ client });
const pending = await scan(contributor.stealthAddress);

const claim =
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction({ client });

for (const utxo of pending) {
  await claim(utxo, {
    // Umbra relayer covers the network fee — contributor
    // does NOT need to hold SOL.
    useRelayer: true,
  });
}`,
  },
  {
    title: "5 · Contributor issues a compliance grant",
    when: "Contributor hands their accountant a scoped viewing key.",
    sdkFn: ["getComplianceGrantIssuerFunction", "getMasterViewingKeyDeriver"],
    code: `import {
  getComplianceGrantIssuerFunction,
} from "@umbra-privacy/sdk";
import { getMasterViewingKeyDeriver }
  from "@umbra-privacy/sdk/crypto";

const mvkDeriver = getMasterViewingKeyDeriver({ client });
const mvk = await mvkDeriver();

// Poseidon-hash chain → fiscal-year Transaction Viewing Key
const fy2026Tvk = mvk.deriveYear(2026);

const issueGrant = getComplianceGrantIssuerFunction({ client });
await issueGrant({
  scopeTvk: fy2026Tvk,
  grantee: accountantX25519PubKey,
  windowFrom: "2026-01-01",
  windowTo:   "2026-12-31",
});`,
  },
  {
    title: "6 · Accountant decrypts the authorized window",
    when: "Accountant opens Stipend and clicks ‘Decrypt grant’.",
    sdkFn: ["getSharedCiphertextReencryptorForUserGrantFunction"],
    code: `import { getSharedCiphertextReencryptorForUserGrantFunction }
  from "@umbra-privacy/sdk";

const reencrypt =
  getSharedCiphertextReencryptorForUserGrantFunction({ client });

const reencryptedRows = await reencrypt({
  grantId,
  granteeX25519: accountantX25519PubKey,
});
// Rows now decrypt locally with the accountant's X25519 private
// key and are rendered + exported as CSV (see /accountant).`,
  },
];

export default function DocsPage() {
  return (
    <PageShell>
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
          <BookOpen className="h-3.5 w-3.5" />
          <span>SDK integration map</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Every Umbra primitive Stipend uses
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-2xl">
          Six recipes that cover the entire comp lifecycle — from shielding
          the treasury to producing a tax-ready CSV. Every snippet is a
          direct call into <Mono>@umbra-privacy/sdk@4</Mono>.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <Link
            href="https://sdk.umbraprivacy.com/"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
          >
            Full SDK reference <ArrowUpRight className="h-3 w-3" />
          </Link>
          <span className="text-xs text-[var(--color-text-faint)]">·</span>
          <Link
            href="https://docs.umbraprivacy.com/"
            target="_blank"
            className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
          >
            Protocol docs <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Factory pattern
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              <Mono>get[Source]To[Target][Verb]Function({"{"} client {"}"})</Mono>{" "}
              → returns a typed callable. Stipend composes six of these.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="h-3.5 w-3.5 text-[var(--color-amber)]" />
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Viewing keys
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Hierarchical TVKs derived from a single MVK via Poseidon — the
              root unlock for fiscal-year reporting.
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="h-3.5 w-3.5 text-[var(--color-mint)]" />
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Gasless relayer
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Contributors claim without holding SOL — Umbra&apos;s relayer
              pays network fees from the encrypted amount.
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col gap-5">
        {recipes.map((r) => (
          <Card key={r.title}>
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-base font-semibold">{r.title}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                    {r.when}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.sdkFn.map((f) => (
                    <Badge key={f} tone="accent">
                      <Mono>{f}</Mono>
                    </Badge>
                  ))}
                </div>
              </div>
              <pre className="text-xs font-mono text-[var(--color-text)] whitespace-pre overflow-x-auto bg-black/50 border border-white/5 rounded-lg p-4 leading-relaxed">
                {r.code}
              </pre>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold mb-2">
            Where to find the live wiring in the repo
          </h3>
          <ul className="text-sm text-[var(--color-text-muted)] space-y-1.5 leading-relaxed">
            <li>
              <Mono>lib/umbra/service.ts</Mono> — the{" "}
              <Mono>UmbraService</Mono> interface both implementations share.
            </li>
            <li>
              <Mono>lib/umbra/real.ts</Mono> — thin wrappers over the factory
              functions above, used when demo-mode is off.
            </li>
            <li>
              <Mono>lib/umbra/demo.ts</Mono> — deterministic shim so the
              hackathon video doesn&apos;t depend on devnet uptime.
            </li>
            <li>
              <Mono>lib/umbra/hook.ts</Mono> —{" "}
              <Mono>useUmbra()</Mono> picks the right instance based on the
              demo-mode toggle.
            </li>
          </ul>
        </CardBody>
      </Card>
    </PageShell>
  );
}
