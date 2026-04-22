"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Download,
  KeyRound,
  Lock,
  LockOpen,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { useUmbra } from "@/lib/umbra/hook";
import {
  formatDate,
  formatDateTime,
  formatUsdc,
  maskCiphertext,
  truncateAddress,
} from "@/lib/utils";
import type { ComplianceGrant, DecryptedDisbursement } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import {
  CipherField,
  Divider,
  Mono,
  PageShell,
  Section,
  StatBlock,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

function GrantPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const grants = useAppStore((s) => s.grants);
  const contributors = useAppStore((s) => s.contributors);
  const [pastedId, setPastedId] = useState("");

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--color-amber)]" />
            <h3 className="text-sm font-semibold">Grant inbox</h3>
          </div>
          <Badge tone="muted">{grants.length} received</Badge>
        </div>

        <Field
          label="Paste grant ID"
          hint="Client shares this after calling getComplianceGrantIssuerFunction."
        >
          <div className="flex items-center gap-2">
            <Input
              className="font-mono"
              placeholder="g_xxxxxxxx"
              value={pastedId}
              onChange={(e) => setPastedId(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() => {
                const match = grants.find((g) => g.id === pastedId.trim());
                if (match) onSelect(match.id);
                else toast.error("Grant not found");
              }}
            >
              Load
            </Button>
          </div>
        </Field>

        <Divider />

        <div className="flex flex-col gap-1.5">
          <div className="text-xs text-[var(--color-text-muted)]">
            Or pick a recently issued grant
          </div>
          <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {grants.map((g) => {
              const issuer = contributors.find(
                (c) => c.id === g.issuerContributorId,
              );
              const selected = g.id === selectedId;
              return (
                <li key={g.id}>
                  <button
                    onClick={() => onSelect(g.id)}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
                      selected
                        ? "border-[var(--color-accent-strong)]/50 bg-[var(--color-accent-strong)]/10"
                        : "border-white/5 bg-black/20 hover:border-white/15 hover:bg-black/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {issuer?.displayName ?? g.issuerContributorId}
                      </span>
                      {g.revoked ? (
                        <Badge tone="rose" dot>
                          revoked
                        </Badge>
                      ) : (
                        <Badge tone="amber" dot>
                          {g.scope}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-2">
                      <Mono>{g.id}</Mono>
                      <span>·</span>
                      <span>
                        {g.scopeFrom
                          ? `${formatDate(g.scopeFrom)} → ${
                              g.scopeTo ? formatDate(g.scopeTo) : "open"
                            }`
                          : "full scope"}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
            {grants.length === 0 ? (
              <li className="text-xs text-[var(--color-text-faint)] italic">
                No grants issued yet. Go to{" "}
                <a className="text-[var(--color-accent)]" href="/contributor">
                  Contributor
                </a>{" "}
                and issue one.
              </li>
            ) : null}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

function EncryptedPreview({ grant }: { grant?: ComplianceGrant }) {
  const rows = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      commitment: maskCiphertext(12),
      payload: maskCiphertext(22),
      timestamp: maskCiphertext(8),
    }));
  }, [grant?.id]);

  return (
    <Card>
      <CardBody className="p-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[var(--color-text-muted)]" />
            <h3 className="text-sm font-semibold">Encrypted payloads</h3>
          </div>
          <Badge tone="muted">what the network sees</Badge>
        </div>
        <Divider />
        <ul className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <li
              key={i}
              className="px-6 py-2.5 flex items-center gap-4 font-mono text-xs text-[var(--color-text-faint)]"
            >
              <span>{r.commitment}</span>
              <span className="flex-1 truncate">{r.payload}</span>
              <span>{r.timestamp}</span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function DecryptedTable({
  rows,
  grant,
}: {
  rows: DecryptedDisbursement[];
  grant: ComplianceGrant;
}) {
  const total = rows.reduce((s, r) => s + r.amount, 0n);

  const exportCsv = () => {
    const header = [
      "date",
      "employer",
      "contributor",
      "stream",
      "amount_usdc",
      "currency",
      "memo",
      "tx_signature",
    ];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          new Date(r.timestamp).toISOString().slice(0, 10),
          r.employerOrg,
          r.contributorHandle,
          r.streamLabel,
          formatUsdc(r.amount),
          r.tokenSymbol,
          r.memo ?? "",
          r.txSig,
        ]
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stipend-audit-${grant.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported — ready for 8949");
  };

  return (
    <Card>
      <CardBody className="p-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LockOpen className="h-4 w-4 text-[var(--color-mint)]" />
            <h3 className="text-sm font-semibold">Decrypted disbursements</h3>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="mint" dot>
              {rows.length} transactions · ${formatUsdc(total)} USDC
            </Badge>
            <Button size="sm" variant="secondary" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
        <Divider />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-left px-6 py-3">Stream</th>
                <th className="text-left px-6 py-3">Memo</th>
                <th className="text-right px-6 py-3">Amount</th>
                <th className="text-left px-6 py-3">Tx sig</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((r) => (
                <tr key={r.disbursementId} className="hover:bg-white/3">
                  <td className="px-6 py-3 whitespace-nowrap text-[var(--color-text-muted)]">
                    {formatDate(r.timestamp)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="font-medium">{r.streamLabel}</div>
                    <div className="text-xs text-[var(--color-text-faint)]">
                      {r.employerOrg} → {r.contributorHandle}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-[var(--color-text-muted)] italic">
                    {r.memo ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-medium">
                    ${formatUsdc(r.amount)}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-[var(--color-text-muted)]">
                    {truncateAddress(r.txSig, 8, 6)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-[var(--color-text-muted)]"
                  >
                    Grant has no matching disbursements in its scope window.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

export function AccountantDashboard() {
  const umbra = useUmbra();
  const grants = useAppStore((s) => s.grants);
  const contributors = useAppStore((s) => s.contributors);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [decrypting, setDecrypting] = useState(false);
  const [decrypted, setDecrypted] = useState<DecryptedDisbursement[] | null>(
    null,
  );
  const [lastDecryptedAt, setLastDecryptedAt] = useState<Date | null>(null);

  const grant = grants.find((g) => g.id === selectedId);
  const issuer = contributors.find((c) => c.id === grant?.issuerContributorId);

  const runDecrypt = async () => {
    if (!selectedId) return;
    setDecrypting(true);
    try {
      const rows = await umbra.decryptForGrantee(selectedId);
      setDecrypted(rows);
      setLastDecryptedAt(new Date());
      toast.success(`Decrypted ${rows.length} disbursements`, {
        description: "Re-encrypted for your X25519 key via the Umbra MPC.",
      });
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <PageShell>
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
          <Receipt className="h-3.5 w-3.5" />
          <span>Accountant workspace</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Scoped disclosure & tax reporting
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-2xl">
          Load a compliance grant your client issued you and Stipend runs{" "}
          <Mono>getSharedCiphertextReencryptorForUserGrantFunction</Mono>{" "}
          to reveal just the window they authorized.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardBody className="py-4">
            <StatBlock
              label="Open grants"
              value={grants.filter((g) => !g.revoked).length}
              sublabel={`${grants.length} total`}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <StatBlock
              label="Clients"
              value={new Set(grants.map((g) => g.issuerContributorId)).size}
              sublabel="audited privately"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <StatBlock
              label="Last decrypt"
              value={
                lastDecryptedAt ? (
                  <span className="text-sm font-normal text-[var(--color-text)]">
                    {formatDateTime(lastDecryptedAt)}
                  </span>
                ) : (
                  "—"
                )
              }
              sublabel={decrypted ? `${decrypted.length} transactions` : "no runs"}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <StatBlock
              label="Privacy posture"
              value={
                <span className="text-sm font-normal text-[var(--color-mint)] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Sealed
                </span>
              }
              sublabel="viewing keys scoped"
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <GrantPicker selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-3 flex flex-col gap-4">
          {grant ? (
            <Card>
              <CardBody className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
                      Active grant
                    </div>
                    <div className="mt-1 text-sm font-medium">
                      {issuer?.displayName}{" "}
                      <span className="text-[var(--color-text-faint)]">→ you</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      Scope:{" "}
                      <Mono>
                        {grant.scopeFrom
                          ? `${formatDate(grant.scopeFrom)} → ${
                              grant.scopeTo ? formatDate(grant.scopeTo) : "open"
                            }`
                          : grant.scope}
                      </Mono>
                    </div>
                  </div>
                  <Button
                    size="md"
                    onClick={runDecrypt}
                    loading={decrypting}
                    disabled={grant.revoked}
                  >
                    <LockOpen className="h-4 w-4" />
                    Decrypt grant
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-[var(--color-text-faint)] uppercase tracking-wider mb-1">
                      Grantee key
                    </div>
                    <div className="font-mono text-[var(--color-text)]">
                      {truncateAddress(grant.granteeX25519PubKey, 8, 6)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-faint)] uppercase tracking-wider mb-1">
                      Issued
                    </div>
                    <div className="text-[var(--color-text)]">
                      {formatDate(grant.createdAt)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-faint)] uppercase tracking-wider mb-1">
                      Status
                    </div>
                    <div className="text-[var(--color-text)]">
                      {grant.revoked ? (
                        <Badge tone="rose" dot>
                          revoked
                        </Badge>
                      ) : (
                        <Badge tone="mint" dot>
                          active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="py-12 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <ClipboardCheck className="h-6 w-6 text-[var(--color-text-muted)]" />
                </div>
                <div className="text-sm text-[var(--color-text)]">
                  Select a grant to begin decryption
                </div>
                <div className="text-xs text-[var(--color-text-faint)] max-w-sm">
                  Without a grant, every transaction below is just bytes to
                  you. That&apos;s the point.
                </div>
              </CardBody>
            </Card>
          )}

          {decrypted ? (
            <DecryptedTable rows={decrypted} grant={grant!} />
          ) : (
            <EncryptedPreview grant={grant} />
          )}
        </div>
      </div>

      <Section
        title="Why this works"
        description="Umbra splits viewing rights from spending rights. A compliance grant is a narrow re-encryption authorization — it can't move funds, and it only covers the window the client chose."
      >
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardBody>
              <h4 className="text-sm font-semibold mb-1">Scoped</h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Poseidon-derived TVKs cover exactly the date range authorized.
                Children can never derive parents.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="text-sm font-semibold mb-1">Auditable</h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Every decrypt is logged on-chain so the client can see
                exactly what their accountant accessed.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h4 className="text-sm font-semibold mb-1">Revocable</h4>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Semi-revocable grants can be rescinded before first use.
                After that, only the already-re-encrypted window remains visible.
              </p>
            </CardBody>
          </Card>
        </div>
      </Section>

      <DummyCipherPreview grant={grant} />
    </PageShell>
  );
}

function DummyCipherPreview({ grant }: { grant?: ComplianceGrant }) {
  if (!grant) return null;
  return (
    <Card>
      <CardBody>
        <h3 className="text-sm font-semibold mb-3">
          Re-encryption call transcript
        </h3>
        <pre className="text-xs font-mono text-[var(--color-text-muted)] whitespace-pre-wrap leading-relaxed bg-black/40 border border-white/5 rounded-lg p-4 overflow-x-auto">
{`> const reencrypt = getSharedCiphertextReencryptorForUserGrantFunction({ client });
> await reencrypt({
    grantId: "${grant.id}",
    granteeX25519: "${grant.granteeX25519PubKey}",
    windowFrom: ${grant.scopeFrom ? `"${grant.scopeFrom}"` : "null"},
    windowTo:   ${grant.scopeTo ? `"${grant.scopeTo}"` : "null"},
  });
→ MPC quorum re-encrypts ciphertexts for grantee key
→ Poseidon-hash chain derives ${grant.scope === "fiscal-year" ? "yearly" : "window"} TVK
→ Ciphertexts decrypted client-side with grantee X25519 private key`}
        </pre>
      </CardBody>
    </Card>
  );
}

export {}; // keep module scope
