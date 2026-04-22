"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Plus,
  Play,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { useAppStore } from "@/lib/store/app-store";
import { useUmbra } from "@/lib/umbra/hook";
import {
  CADENCE_DAYS,
  CADENCE_LABELS,
  DEFAULT_TOKEN,
  TOKENS,
} from "@/lib/constants";
import { formatUsdc, parseUsdc, truncateAddress } from "@/lib/utils";
import type { Cadence, Stream } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { TabPills } from "@/components/ui/tabs";
import {
  Avatar,
  CipherField,
  Divider,
  PageShell,
  Section,
  StatBlock,
  Mono,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";

function TreasuryCard() {
  const treasury = useAppStore((s) => s.treasury);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <Card>
      <CardBody className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
              Treasury
            </div>
            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
              Acme Labs DAO · USDC
            </div>
          </div>
          <Badge tone="accent" dot>
            ETA active
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <StatBlock
            label="Public balance"
            value={
              <span className="font-mono cipher-reveal">
                ${formatUsdc(treasury.publicBalance)}
              </span>
            }
            sublabel="Visible on Solana explorer"
          />
          <StatBlock
            label="Encrypted balance"
            tone="accent"
            value={
              <CipherField
                cipher="a8c2…ef15"
                plain={`$${formatUsdc(treasury.encryptedBalance)}`}
                className="text-2xl"
              />
            }
            sublabel="Rescue-ciphered on-chain"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setDepositOpen(true)}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Shield into ETA
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setWithdrawOpen(true)}
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            Withdraw
          </Button>
        </div>
      </CardBody>
      <DepositDialog open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
    </Card>
  );
}

function DepositDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const umbra = useUmbra();
  const [amount, setAmount] = useState("25000");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try {
      const base = parseUsdc(amount);
      const sig = await umbra.fundEncryptedTreasury(DEFAULT_TOKEN.mint, base);
      toast.success("Shielded into ETA", {
        description: (
          <span className="font-mono text-xs">{truncateAddress(sig, 10, 6)}</span>
        ),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Shield USDC into treasury ETA"
      description="Calls getPublicBalanceToEncryptedBalanceDirectDepositorFunction. The amount is encrypted with the Rescue cipher before landing on-chain."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={submitting}>
            Shield {amount} USDC
          </Button>
        </>
      }
    >
      <Field label="Amount (USDC)">
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="25000"
        />
      </Field>
    </Dialog>
  );
}

function WithdrawDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const umbra = useUmbra();
  const [amount, setAmount] = useState("5000");
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    setSubmitting(true);
    try {
      const base = parseUsdc(amount);
      const sig = await umbra.withdrawTreasury(DEFAULT_TOKEN.mint, base);
      toast.success("Withdrawn to public wallet", {
        description: (
          <span className="font-mono text-xs">{truncateAddress(sig, 10, 6)}</span>
        ),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Withdraw from encrypted treasury"
      description="Calls getEncryptedBalanceToPublicBalanceDirectWithdrawerFunction."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={submitting}>
            Withdraw {amount} USDC
          </Button>
        </>
      }
    >
      <Field label="Amount (USDC)">
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="5000"
        />
      </Field>
    </Dialog>
  );
}

function NewStreamDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const contributors = useAppStore((s) => s.contributors);
  const addStream = useAppStore((s) => s.addStream);
  const [label, setLabel] = useState("Engineering — monthly");
  const [contributorId, setContributorId] = useState(contributors[0]?.id ?? "");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [amount, setAmount] = useState("5000");
  const [memo, setMemo] = useState("Salary");

  const submit = () => {
    if (!contributorId) return;
    const stream: Stream = {
      id: "s_" + nanoid(6),
      label,
      employerOrg: "Acme Labs DAO",
      contributorId,
      tokenMint: DEFAULT_TOKEN.mint,
      amountPerPeriod: parseUsdc(amount),
      cadence,
      startsAt: new Date().toISOString(),
      memo,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    addStream(stream);
    toast.success("Stream scheduled", {
      description: `${label} · ${CADENCE_LABELS[cadence]} · $${amount} USDC`,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Schedule a private stream"
      description="Stipend stores the cadence and recipient off-chain. Each period the scheduler fires getEncryptedBalanceToReceiverClaimableUtxoCreatorFunction, dropping an unlinkable UTXO into the stealth pool."
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Save stream
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Label">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Recipient">
            <Select
              value={contributorId}
              onChange={(e) => setContributorId(e.target.value)}
              options={contributors.map((c) => ({
                value: c.id,
                label: `${c.displayName} (${c.handle})`,
              }))}
            />
          </Field>
          <Field label="Cadence">
            <Select
              value={cadence}
              onChange={(e) => setCadence(e.target.value as Cadence)}
              options={Object.entries(CADENCE_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              }))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount per period (USDC)">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Memo (encrypted)">
            <Input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function StreamRow({ stream }: { stream: Stream }) {
  const contributors = useAppStore((s) => s.contributors);
  const allDisbursements = useAppStore((s) => s.disbursements);

  const contributor = useMemo(
    () => contributors.find((c) => c.id === stream.contributorId),
    [contributors, stream.contributorId],
  );
  const disbursements = useMemo(
    () => allDisbursements.filter((d) => d.streamId === stream.id),
    [allDisbursements, stream.id],
  );
  const total = useMemo(
    () =>
      disbursements.reduce(
        (sum, d) => (d.claimStatus !== "pending" ? sum + d.amount : sum),
        0n,
      ),
    [disbursements],
  );

  const pending = useMemo(
    () => disbursements.filter((d) => d.claimStatus === "pending").length,
    [disbursements],
  );

  return (
    <div className="flex items-center justify-between gap-4 p-4 hover:bg-white/3 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {contributor ? (
          <Avatar seed={contributor.avatarSeed} size={36} />
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{stream.label}</div>
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
            <span>{contributor?.handle}</span>
            <span>·</span>
            <span>{CADENCE_LABELS[stream.cadence]}</span>
            {stream.memo ? (
              <>
                <span>·</span>
                <span className="italic">“{stream.memo}”</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        <div className="text-right">
          <div className="text-xs text-[var(--color-text-faint)]">Per period</div>
          <div className="font-mono text-sm">
            ${formatUsdc(stream.amountPerPeriod)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--color-text-faint)]">Claimed total</div>
          <div className="font-mono text-sm text-[var(--color-mint)]">
            ${formatUsdc(total)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge
            tone={
              stream.status === "active"
                ? "mint"
                : stream.status === "paused"
                  ? "amber"
                  : "muted"
            }
            dot
          >
            {stream.status}
          </Badge>
          {pending > 0 ? (
            <span className="text-[10px] text-[var(--color-amber)]">
              {pending} unclaimed
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DisbursementsFeed() {
  const allDisbursements = useAppStore((s) => s.disbursements);
  const streams = useAppStore((s) => s.streams);
  const contributors = useAppStore((s) => s.contributors);
  const disbursements = useMemo(
    () => allDisbursements.slice(0, 12),
    [allDisbursements],
  );
  return (
    <Card>
      <CardBody className="p-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-accent)]" />
            <h3 className="text-sm font-semibold">Recent disbursements</h3>
          </div>
          <Badge tone="muted">Stealth pool UTXOs</Badge>
        </div>
        <Divider />
        <ul className="divide-y divide-white/5">
          {disbursements.map((d) => {
            const stream = streams.find((s) => s.id === d.streamId);
            const contributor = contributors.find(
              (c) => c.id === stream?.contributorId,
            );
            return (
              <li key={d.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {contributor ? (
                    <Avatar seed={contributor.avatarSeed} size={28} />
                  ) : null}
                  <div className="min-w-0">
                    <div className="text-sm truncate">
                      {stream?.label ?? "Stream"}
                    </div>
                    <div className="text-xs text-[var(--color-text-faint)] font-mono">
                      utxo {truncateAddress(d.utxoCommitment, 8, 6)}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-mono">
                  <CipherField
                    cipher="••••"
                    plain={`$${formatUsdc(d.amount)}`}
                  />
                </div>
                <div className="w-28 text-right">
                  {d.claimStatus === "pending" ? (
                    <Badge tone="amber" dot>
                      unclaimed
                    </Badge>
                  ) : d.claimStatus === "claimed-encrypted" ? (
                    <Badge tone="accent" dot>
                      in ETA
                    </Badge>
                  ) : (
                    <Badge tone="mint" dot>
                      withdrawn
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}

function TopSummary() {
  const streams = useAppStore((s) => s.streams);
  const contributors = useAppStore((s) => s.contributors);
  const disbursements = useAppStore((s) => s.disbursements);

  const monthlyBurn = useMemo(
    () =>
      streams
        .filter((s) => s.status === "active")
        .reduce((sum, s) => {
          const periodsPerMonth =
            s.cadence === "one-time" ? 0 : 30 / CADENCE_DAYS[s.cadence];
          return sum + (s.amountPerPeriod * BigInt(Math.round(periodsPerMonth * 100))) / 100n;
        }, 0n),
    [streams],
  );

  const unclaimed = disbursements.filter(
    (d) => d.claimStatus === "pending",
  ).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Active streams"
            value={streams.filter((s) => s.status === "active").length}
            sublabel={`${streams.length} total`}
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Contributors"
            value={contributors.length}
            sublabel="paid privately"
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Monthly run-rate"
            mono
            value={`$${formatUsdc(monthlyBurn)}`}
            sublabel="encrypted outflow"
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Unclaimed UTXOs"
            tone={unclaimed > 0 ? "accent" : "default"}
            value={unclaimed}
            sublabel="sitting in stealth pool"
          />
        </CardBody>
      </Card>
    </div>
  );
}

export function EmployerDashboard() {
  const umbra = useUmbra();
  const streams = useAppStore((s) => s.streams);
  const [streamDialogOpen, setStreamDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const [disbursing, setDisbursing] = useState(false);

  const filtered = streams.filter((s) =>
    filter === "all" ? true : s.status === filter,
  );

  const runDisbursements = async () => {
    setDisbursing(true);
    try {
      const due = streams.filter((s) => s.status === "active").slice(0, 3);
      for (const stream of due) {
        await umbra.createDisbursement({
          streamId: stream.id,
          contributorId: stream.contributorId,
          amount: stream.amountPerPeriod,
          tokenMint: stream.tokenMint,
          memo: stream.memo,
        });
      }
      toast.success(`Fired ${due.length} disbursements into the stealth pool`, {
        description: "Groth16 proofs generated · routed via Umbra relayer",
      });
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <PageShell>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
            <Wallet className="h-3.5 w-3.5" />
            <span>Acme Labs DAO</span>
            <span>·</span>
            <Mono>{truncateAddress("uMBR4DaOTreasuryPda8zQmX2kLbH9tVc3sWp4Y", 6, 6)}</Mono>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Employer control room
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
            Fund a private treasury once, then stream comp to contributors
            without ever publishing an amount or a recipient on-chain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={runDisbursements}
            loading={disbursing}
          >
            <Play className="h-4 w-4" />
            Run disbursements now
          </Button>
          <Button size="md" onClick={() => setStreamDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New stream
          </Button>
        </div>
      </div>

      <TopSummary />

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <Section
            title="Streams"
            description="Each stream schedules a receiver-claimable UTXO on its cadence."
            actions={
              <TabPills
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All", count: streams.length },
                  {
                    value: "active",
                    label: "Active",
                    count: streams.filter((s) => s.status === "active").length,
                  },
                  {
                    value: "paused",
                    label: "Paused",
                    count: streams.filter((s) => s.status === "paused").length,
                  },
                ]}
              />
            }
          >
            <Card>
              <CardBody className="p-0">
                <ul className="divide-y divide-white/5">
                  {filtered.map((s) => (
                    <li key={s.id}>
                      <StreamRow stream={s} />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Section>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-5">
          <TreasuryCard />
          <ContributorStrip />
        </div>
      </div>

      <DisbursementsFeed />

      <NewStreamDialog
        open={streamDialogOpen}
        onClose={() => setStreamDialogOpen(false)}
      />
    </PageShell>
  );
}

function ContributorStrip() {
  const contributors = useAppStore((s) => s.contributors);
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--color-accent)]" />
            <h3 className="text-sm font-semibold">Contributors</h3>
          </div>
          <Badge tone="muted">stealth addrs only</Badge>
        </div>
        <ul className="flex flex-col gap-3">
          {contributors.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <Avatar seed={c.avatarSeed} size={28} />
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{c.displayName}</div>
                <div className="text-xs text-[var(--color-text-faint)] font-mono truncate">
                  {truncateAddress(c.stealthAddress, 8, 8)}
                </div>
              </div>
              <span className={cn("text-xs text-[var(--color-text-muted)]")}>
                @{c.handle.split(".")[0]}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
