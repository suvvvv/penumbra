"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  KeyRound,
  Mail,
  ScanLine,
  Send,
  Sparkles,
  UserCog,
} from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { useUmbra } from "@/lib/umbra/hook";
import { formatDateTime, formatUsdc, truncateAddress } from "@/lib/utils";
import type { ComplianceGrant, Disbursement } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import {
  Avatar,
  CipherField,
  Divider,
  Mono,
  PageShell,
  Section,
  StatBlock,
} from "@/components/ui/primitives";

function ContributorSwitcher() {
  const contributors = useAppStore((s) => s.contributors);
  const currentId = useAppStore((s) => s.currentContributorId);
  const setCurrentId = useAppStore((s) => s.setCurrentContributorId);
  const current = contributors.find((c) => c.id === currentId);

  return (
    <div className="flex items-center gap-3">
      {current ? <Avatar seed={current.avatarSeed} size={44} /> : null}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
          Signed in as
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Select
            className="h-9 min-w-[220px]"
            value={currentId ?? ""}
            onChange={(e) => setCurrentId(e.target.value)}
            options={contributors.map((c) => ({
              value: c.id,
              label: `${c.displayName} · ${c.handle}`,
            }))}
          />
          <UserCog className="h-4 w-4 text-[var(--color-text-faint)]" />
        </div>
        {current ? (
          <div className="text-xs text-[var(--color-text-faint)] mt-1 font-mono">
            {truncateAddress(current.stealthAddress, 8, 8)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SessionStrip() {
  const session = useAppStore((s) => s.session);
  const umbra = useUmbra();
  const [registering, setRegistering] = useState(false);

  const register = async () => {
    setRegistering(true);
    try {
      await umbra.ensureRegistered();
      toast.success("Registered with Umbra", {
        description: "MVK generated · X25519 encryption key on-chain",
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Card>
      <CardBody className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={
              session.registered
                ? "h-2 w-2 rounded-full bg-[var(--color-mint)] pulse-dot"
                : "h-2 w-2 rounded-full bg-[var(--color-amber)]"
            }
          />
          <div>
            <div className="text-sm font-medium">
              {session.registered
                ? "Umbra session active"
                : "Umbra registration required"}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {session.registered ? (
                <>
                  MVK fingerprint{" "}
                  <Mono>{session.mvkFingerprint}</Mono> · confidential +
                  anonymous modes enabled
                </>
              ) : (
                "One-time on-chain account init via getUserRegistrationFunction."
              )}
            </div>
          </div>
        </div>
        {!session.registered ? (
          <Button size="sm" onClick={register} loading={registering}>
            <KeyRound className="h-3.5 w-3.5" />
            Register with Umbra
          </Button>
        ) : (
          <Badge tone="mint" dot>
            <Sparkles className="h-3 w-3" />
            Ready to claim
          </Badge>
        )}
      </CardBody>
    </Card>
  );
}

function ClaimCard({ d }: { d: Disbursement }) {
  const umbra = useUmbra();
  const streams = useAppStore((s) => s.streams);
  const stream = useMemo(
    () => streams.find((st) => st.id === d.streamId),
    [streams, d.streamId],
  );
  const [claiming, setClaiming] = useState<null | "encrypted" | "public">(null);

  const claim = async (target: "encrypted" | "public") => {
    setClaiming(target);
    try {
      await umbra.claimDisbursement(d.id, target);
      toast.success(
        target === "encrypted"
          ? "Claimed into your ETA"
          : "Claimed & withdrawn to public wallet",
        {
          description: "Relayer paid the network fee · amount stays private",
        },
      );
    } finally {
      setClaiming(null);
    }
  };

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-medium">{stream?.label ?? "Disbursement"}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {stream?.employerOrg} ·{" "}
              {d.memo ? <span className="italic">“{d.memo}”</span> : "no memo"}
            </div>
          </div>
          <Badge tone="amber" dot>
            unclaimed
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
              Encrypted amount
            </div>
            <CipherField
              cipher={d.encryptedPayloadPreview}
              plain={`$${formatUsdc(d.amount)} USDC`}
              className="text-lg"
            />
          </div>
          <div className="text-right text-xs text-[var(--color-text-muted)]">
            <div>UTXO commitment</div>
            <div className="font-mono text-[var(--color-text)]">
              {truncateAddress(d.utxoCommitment, 8, 8)}
            </div>
          </div>
        </div>

        <Divider />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-[var(--color-text-faint)]">
            Dropped {formatDateTime(d.createdAt)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => claim("encrypted")}
              loading={claiming === "encrypted"}
            >
              Claim → ETA
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => claim("public")}
              loading={claiming === "public"}
            >
              Claim → public wallet
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function ClaimHistory() {
  const currentId = useAppStore((s) => s.currentContributorId);
  const streams = useAppStore((s) => s.streams);
  const disbursements = useAppStore((s) => s.disbursements);

  const rows = useMemo(() => {
    const streamIds = streams
      .filter((s) => s.contributorId === currentId)
      .map((s) => s.id);
    return disbursements
      .filter(
        (d) => streamIds.includes(d.streamId) && d.claimStatus !== "pending",
      )
      .slice(0, 25);
  }, [streams, disbursements, currentId]);

  return (
    <Card>
      <CardBody className="p-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Claim history</h3>
          <Badge tone="muted">{rows.length} claims</Badge>
        </div>
        <Divider />
        <ul className="divide-y divide-white/5">
          {rows.map((d) => {
            const stream = streams.find((s) => s.id === d.streamId);
            return (
              <li key={d.id} className="px-6 py-3 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate">{stream?.label}</div>
                  <div className="text-xs text-[var(--color-text-faint)] font-mono">
                    claim {truncateAddress(d.claimTxSig ?? "", 8, 6)}
                  </div>
                </div>
                <div className="font-mono text-sm">
                  ${formatUsdc(d.amount)}
                </div>
                <div className="w-28 text-right">
                  <Badge
                    tone={
                      d.claimStatus === "claimed-encrypted" ? "accent" : "mint"
                    }
                    dot
                  >
                    {d.claimStatus === "claimed-encrypted"
                      ? "in ETA"
                      : "withdrawn"}
                  </Badge>
                </div>
              </li>
            );
          })}
          {rows.length === 0 ? (
            <li className="px-6 py-8 text-sm text-[var(--color-text-muted)] text-center">
              No claims yet. Umbra UTXOs appear here after you claim.
            </li>
          ) : null}
        </ul>
      </CardBody>
    </Card>
  );
}

function GrantIssueCard() {
  const umbra = useUmbra();
  const contributors = useAppStore((s) => s.contributors);
  const currentId = useAppStore((s) => s.currentContributorId) ?? "";
  const allGrants = useAppStore((s) => s.grants);
  const currentContrib = useMemo(
    () => contributors.find((c) => c.id === currentId),
    [contributors, currentId],
  );
  const grants = useMemo(
    () => allGrants.filter((g) => g.issuerContributorId === currentId),
    [allGrants, currentId],
  );
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Chen Tax CPA");
  const [pubkey, setPubkey] = useState("X25519:" + Math.random().toString(36).slice(2, 10));
  const [scope, setScope] = useState<ComplianceGrant["scope"]>("fiscal-year");
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-12-31");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!currentId) return;
    setSubmitting(true);
    try {
      const grant = await umbra.issueComplianceGrant({
        issuerContributorId: currentId,
        granteeLabel: label,
        granteeX25519PubKey: pubkey,
        scope,
        scopeFrom: scope === "single-tx" ? undefined : from + "T00:00:00Z",
        scopeTo: scope === "single-tx" ? undefined : to + "T23:59:59Z",
      });
      toast.success("Compliance grant issued", {
        description: (
          <span>
            Share grant ID{" "}
            <Mono className="text-[var(--color-accent)]">{grant.id}</Mono> with
            your accountant.
          </span>
        ),
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = (s: string) => {
    void navigator.clipboard.writeText(s);
    toast.success("Copied to clipboard");
  };

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[var(--color-amber)]" />
              <h3 className="text-sm font-semibold">Compliance grants</h3>
            </div>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Send className="h-3.5 w-3.5" />
              Issue grant
            </Button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">
            Hand your accountant a scoped viewing key. They can decrypt the
            window you authorize and nothing else. Implemented via{" "}
            <Mono>getComplianceGrantIssuerFunction</Mono>.
          </p>
          <ul className="flex flex-col gap-2">
            {grants.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{g.granteeLabel}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">
                    {g.scope === "fiscal-year"
                      ? `FY ${new Date(g.scopeFrom ?? "").getUTCFullYear()}`
                      : g.scope}{" "}
                    ·{" "}
                    <Mono>{g.id}</Mono>
                  </div>
                </div>
                {g.revoked ? (
                  <Badge tone="rose" dot>
                    revoked
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copy(g.id)}
                  >
                    Copy ID
                  </Button>
                )}
              </li>
            ))}
            {grants.length === 0 ? (
              <li className="text-xs text-[var(--color-text-faint)] italic">
                No grants issued yet.
              </li>
            ) : null}
          </ul>
        </CardBody>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Issue compliance grant"
        description={`Give ${currentContrib?.displayName ?? "your accountant"} a Poseidon-derived viewing key scoped to a window. Revocable before first use.`}
        footer={
          <>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} loading={submitting}>
              Issue grant
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Grantee label">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          <Field
            label="Grantee X25519 public key"
            hint="Re-encryption target. Your accountant provides this from their wallet."
          >
            <Input
              className="font-mono text-xs"
              value={pubkey}
              onChange={(e) => setPubkey(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Scope">
              <Select
                value={scope}
                onChange={(e) =>
                  setScope(e.target.value as ComplianceGrant["scope"])
                }
                options={[
                  { value: "fiscal-year", label: "Fiscal year" },
                  { value: "month", label: "Month" },
                  { value: "date-range", label: "Date range" },
                  { value: "single-tx", label: "Single tx" },
                ]}
              />
            </Field>
            <Field label="From">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
          </div>
          <div className="text-xs text-[var(--color-text-faint)] leading-relaxed border border-white/5 rounded-lg bg-black/30 p-3">
            <strong className="text-[var(--color-text-muted)]">Under the hood:</strong>{" "}
            Stipend derives a TVK from your MVK via the Poseidon hash chain for
            the selected window, then calls{" "}
            <Mono>getComplianceGrantIssuerFunction</Mono> to register an
            on-chain re-encryption grant for the grantee&apos;s X25519 key.
          </div>
        </div>
      </Dialog>
    </>
  );
}

export function ContributorDashboard() {
  const umbra = useUmbra();
  const streams = useAppStore((s) => s.streams);
  const disbursements = useAppStore((s) => s.disbursements);
  const currentId = useAppStore((s) => s.currentContributorId);
  const session = useAppStore((s) => s.session);
  const [scanning, setScanning] = useState(false);

  const claimable = useMemo(() => {
    if (!currentId) return [];
    const streamIds = streams
      .filter((s) => s.contributorId === currentId)
      .map((s) => s.id);
    return disbursements.filter(
      (d) => streamIds.includes(d.streamId) && d.claimStatus === "pending",
    );
  }, [streams, disbursements, currentId]);

  const totalClaimed = useMemo(() => {
    const streamIds = streams
      .filter((s) => s.contributorId === currentId)
      .map((s) => s.id);
    return disbursements
      .filter(
        (d) => streamIds.includes(d.streamId) && d.claimStatus !== "pending",
      )
      .reduce((sum, d) => sum + d.amount, 0n);
  }, [streams, disbursements, currentId]);

  const rescan = async () => {
    setScanning(true);
    try {
      if (!currentId) return;
      const found = await umbra.scanClaimable(currentId);
      toast.info(`Scanned stealth pool · ${found.length} UTXOs for you`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <PageShell>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Incoming stipends
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
            Everything employers sent you lives here, encrypted. Scan the
            stealth pool, pull funds into your ETA, withdraw publicly only when
            you want to.
          </p>
        </div>
        <ContributorSwitcher />
      </div>

      <SessionStrip />

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardBody className="py-4">
            <StatBlock
              label="Claimable now"
              tone={claimable.length > 0 ? "accent" : "default"}
              value={claimable.length}
              sublabel="UTXOs in stealth pool"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <StatBlock
              label="Lifetime claimed"
              mono
              tone="mint"
              value={`$${formatUsdc(totalClaimed)}`}
              sublabel="across all streams"
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="py-4">
            <StatBlock
              label="Active streams"
              value={
                streams.filter(
                  (s) => s.contributorId === currentId && s.status === "active",
                ).length
              }
              sublabel="paying you"
            />
          </CardBody>
        </Card>
      </div>

      <Section
        title="Claimable UTXOs"
        description="Scan the Umbra mixer for stealth-addressed UTXOs. Nothing links these to the employer's public wallet."
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={rescan}
            loading={scanning}
            disabled={!session.registered}
          >
            <ScanLine className="h-3.5 w-3.5" />
            Rescan stealth pool
          </Button>
        }
      >
        {claimable.length === 0 ? (
          <Card>
            <CardBody className="py-10 text-center">
              <div className="text-sm text-[var(--color-text-muted)]">
                Caught up — no pending disbursements.
              </div>
              <div className="text-xs text-[var(--color-text-faint)] mt-1">
                Stipend auto-scans every minute using{" "}
                <Mono>getClaimableUtxoScannerFunction</Mono>.
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {claimable.map((d) => (
              <ClaimCard key={d.id} d={d} />
            ))}
          </div>
        )}
      </Section>

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <Section
            title="Claim history"
            description="Decrypted locally with your MVK. Never leaves this device."
          >
            <ClaimHistory />
          </Section>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-5">
          <GrantIssueCard />
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[var(--color-mint)]" />
                  <h3 className="text-sm font-semibold">Export</h3>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">
                Self-export your decrypted history as CSV for personal
                bookkeeping. Uses your local MVK — no grant required.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportCsv(streams, disbursements, currentId)}
              >
                Export personal CSV
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function exportCsv(
  streams: ReturnType<typeof useAppStore.getState>["streams"],
  disbursements: ReturnType<typeof useAppStore.getState>["disbursements"],
  currentId: string | undefined,
) {
  if (!currentId) return;
  const mine = disbursements.filter((d) => {
    const stream = streams.find((s) => s.id === d.streamId);
    return stream?.contributorId === currentId && d.claimStatus !== "pending";
  });
  const rows = [
    ["date", "stream", "amount_usdc", "status", "memo", "tx_sig"],
    ...mine.map((d) => {
      const stream = streams.find((s) => s.id === d.streamId);
      return [
        new Date(d.createdAt).toISOString().slice(0, 10),
        stream?.label ?? "",
        formatUsdc(d.amount),
        d.claimStatus,
        d.memo ?? "",
        d.claimTxSig ?? "",
      ];
    }),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stipend-personal-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported personal CSV");
}
