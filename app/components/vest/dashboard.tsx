"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  Clock,
  EyeOff,
  FileCheck2,
  LockKeyhole,
  Play,
  ShieldCheck,
  TrendingDown,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/store/app-store";
import { useUmbra } from "@/lib/umbra/hook";
import { SEED_FOUNDATION } from "@/lib/umbra/vest-seed";
import type { VestAttestation, VestSchedule, VestTranche } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  truncateAddress,
} from "@/lib/utils";
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

function formatToken(base: bigint, decimals: number): string {
  const whole = base / 10n ** BigInt(decimals);
  return whole.toLocaleString();
}

function scheduleProgress(schedule: VestSchedule): number {
  if (schedule.tranches === 0) return 0;
  return (schedule.tranchesDisbursed / schedule.tranches) * 100;
}

function nextTranche(schedule: VestSchedule, tranches: VestTranche[]) {
  return tranches
    .filter((t) => t.scheduleId === schedule.id && t.status === "scheduled")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
}

function postedButUnclaimed(
  schedule: VestSchedule,
  tranches: VestTranche[],
) {
  return tranches.filter(
    (t) => t.scheduleId === schedule.id && t.status === "utxo-posted",
  );
}

function FoundationHeader() {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
          <LockKeyhole className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          <span>Foundation control room</span>
          <span>·</span>
          <Mono>{SEED_FOUNDATION.name}</Mono>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Private token vesting
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
          Every active schedule below is custodied by a PDA-held Encrypted
          Token Account. Cliffs and tranches advance through our Anchor
          program, which CPIs into Umbra&apos;s stealth pool — so the unlock
          is unobservable to anyone watching the {SEED_FOUNDATION.tokenSymbol} mint.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/vest/simulator"
          className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
        >
          Open unlock-FUD simulator
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function FoundationStats() {
  const vestSchedules = useAppStore((s) => s.vestSchedules);
  const vestTranches = useAppStore((s) => s.vestTranches);
  const vestAttestations = useAppStore((s) => s.vestAttestations);

  const totalLocked = useMemo(
    () =>
      vestSchedules.reduce(
        (sum, s) =>
          sum +
          (s.totalAllocation * BigInt(s.tranches - s.tranchesDisbursed)) /
            BigInt(s.tranches),
        0n,
      ),
    [vestSchedules],
  );

  const nextDue = useMemo(() => {
    return vestTranches
      .filter((t) => t.status === "scheduled")
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  }, [vestTranches]);

  const posted = useMemo(
    () => vestTranches.filter((t) => t.status === "utxo-posted").length,
    [vestTranches],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Active schedules"
            value={vestSchedules.filter((s) => s.status === "active").length}
            sublabel={`${vestSchedules.length} total`}
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Locked supply"
            tone="accent"
            mono
            value={
              <CipherField
                cipher="••• ••• •••"
                plain={`${formatToken(totalLocked, SEED_FOUNDATION.tokenDecimals)} ${SEED_FOUNDATION.tokenSymbol}`}
                className="text-2xl"
              />
            }
            sublabel="in PDA-held ETAs"
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Next tranche"
            value={
              nextDue ? (
                <span className="text-sm font-normal text-[var(--color-text)]">
                  {formatDate(nextDue.dueAt)}
                </span>
              ) : (
                "—"
              )
            }
            sublabel={
              nextDue
                ? `tranche #${nextDue.tranchIndex}`
                : "all disbursed"
            }
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Posted / unclaimed"
            tone={posted > 0 ? "accent" : "default"}
            value={posted}
            sublabel={`${vestAttestations.length} attestations live`}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function ScheduleRow({ schedule }: { schedule: VestSchedule }) {
  const investors = useAppStore((s) => s.investors);
  const vestTranches = useAppStore((s) => s.vestTranches);
  const umbra = useUmbra();
  const [ticking, setTicking] = useState(false);
  const [attestOpen, setAttestOpen] = useState(false);

  const investor = useMemo(
    () => investors.find((i) => i.id === schedule.investorId),
    [investors, schedule.investorId],
  );

  const tranches = useMemo(
    () => vestTranches.filter((t) => t.scheduleId === schedule.id),
    [vestTranches, schedule.id],
  );

  const next = nextTranche(schedule, tranches);
  const posted = postedButUnclaimed(schedule, tranches);
  const progress = scheduleProgress(schedule);

  const tick = async () => {
    if (!next) {
      toast.info("No scheduled tranches remaining");
      return;
    }
    setTicking(true);
    try {
      const result = await umbra.tickVestTranche(next.id);
      toast.success(`Tranche #${result.tranche.tranchIndex} posted`, {
        description: (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px]">
              scheduler · {truncateAddress(result.schedulerTxSig, 8, 6)}
            </span>
            <span className="font-mono text-[10px]">
              umbra utxo · {truncateAddress(result.umbraUtxoTxSig, 8, 6)}
            </span>
          </div>
        ),
      });
    } finally {
      setTicking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {investor ? <Avatar seed={investor.avatarSeed} size={36} /> : null}
          <div>
            <div className="text-sm font-medium flex items-center gap-2">
              {investor?.orgName}
              <Badge tone="muted">{investor?.round ?? ""}</Badge>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] font-mono">
              {truncateAddress(schedule.pdaAddress, 8, 8)} ·{" "}
              {schedule.curve === "monthly-step"
                ? "monthly"
                : schedule.curve === "quarterly-step"
                  ? "quarterly"
                  : "linear"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {posted.length > 0 ? (
            <Badge tone="amber" dot>
              {posted.length} awaiting claim
            </Badge>
          ) : null}
          {schedule.status === "pending" ? (
            <Badge tone="muted" dot>
              pre-cliff
            </Badge>
          ) : schedule.status === "active" ? (
            <Badge tone="mint" dot>
              active
            </Badge>
          ) : (
            <Badge tone="default" dot>
              {schedule.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
            Total allocation
          </div>
          <CipherField
            cipher="••• ••• •••"
            plain={`${formatToken(schedule.totalAllocation, schedule.tokenDecimals)} ${schedule.tokenSymbol}`}
            className="text-sm"
          />
          <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">
            {schedule.publicSupplyPct.toFixed(2)}% of circulating
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
            Cliff
          </div>
          <div className="text-[var(--color-text)]">
            {formatDate(schedule.cliffAt)}
          </div>
          <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">
            ends {formatDate(schedule.endsAt)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
            Progress
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[var(--color-text-muted)]">
              {schedule.tranchesDisbursed}/{schedule.tranches}
            </span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)] mb-1">
            Next tranche
          </div>
          <div className="text-[var(--color-text)]">
            {next ? formatDate(next.dueAt) : "complete"}
          </div>
          <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">
            {next ? `#${next.tranchIndex}` : "fully vested"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={tick} loading={ticking} disabled={!next}>
          <Play className="h-3.5 w-3.5" />
          Tick now
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setAttestOpen(true)}
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          Issue attestation
        </Button>
        <span className="text-[10px] text-[var(--color-text-faint)]">
          Each tick fires a keeper tx → CPI into Umbra&apos;s stealth pool.
        </span>
      </div>

      <AttestDialog
        schedule={schedule}
        open={attestOpen}
        onClose={() => setAttestOpen(false)}
      />
    </div>
  );
}

function AttestDialog({
  schedule,
  open,
  onClose,
}: {
  schedule: VestSchedule;
  open: boolean;
  onClose: () => void;
}) {
  const investors = useAppStore((s) => s.investors);
  const umbra = useUmbra();
  const [year, setYear] = useState("2026");
  const [submitting, setSubmitting] = useState(false);

  const investor = investors.find((i) => i.id === schedule.investorId);

  const submit = async () => {
    if (!investor) return;
    setSubmitting(true);
    try {
      const y = Number(year);
      const att = await umbra.issueVestAttestation({
        scheduleId: schedule.id,
        investorId: investor.id,
        granteeX25519PubKey: investor.granteeX25519PubKey,
        fiscalYearStart: new Date(y, 0, 1).toISOString(),
        fiscalYearEnd: new Date(y, 11, 31).toISOString(),
      });
      toast.success("Attestation issued", {
        description: (
          <span>
            Grant ID <Mono>{att.id}</Mono> issued to {investor.orgName}.
          </span>
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
      title="Issue quarterly attestation"
      description={`Give ${investor?.orgName ?? "investor"} a fiscal-year viewing key derived via Poseidon from the foundation MVK. Transparency for the cap table, invisibility for the market.`}
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} loading={submitting}>
            Issue attestation
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Schedule">
          <Input
            className="font-mono text-xs"
            value={schedule.id}
            readOnly
          />
        </Field>
        <Field label="Grantee (investor X25519)">
          <Input
            className="font-mono text-xs"
            value={investor?.granteeX25519PubKey ?? ""}
            readOnly
          />
        </Field>
        <Field label="Fiscal year">
          <Select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={[
              { value: "2025", label: "FY 2025" },
              { value: "2026", label: "FY 2026" },
              { value: "2027", label: "FY 2027" },
            ]}
          />
        </Field>
        <div className="text-xs text-[var(--color-text-faint)] leading-relaxed border border-white/5 rounded-lg bg-black/30 p-3">
          <strong className="text-[var(--color-text-muted)]">
            SDK path:
          </strong>{" "}
          <Mono>getMasterViewingKeyDeriver</Mono> →{" "}
          <Mono>deriveYear({year})</Mono> →{" "}
          <Mono>getComplianceGrantIssuerFunction</Mono>.
        </div>
      </div>
    </Dialog>
  );
}

function AttestationsInbox() {
  const attestations = useAppStore((s) => s.vestAttestations);
  const investors = useAppStore((s) => s.investors);
  const schedules = useAppStore((s) => s.vestSchedules);
  const umbra = useUmbra();
  const [decryptingId, setDecryptingId] = useState<string | null>(null);

  const decrypt = async (id: string) => {
    setDecryptingId(id);
    try {
      const result = await umbra.decryptAttestation(id);
      toast.success(
        `Decrypted ${result.tranches.length} tranches · ${formatToken(
          result.totalDisbursed,
          result.schedule.tokenDecimals,
        )} ${result.schedule.tokenSymbol}`,
        {
          description: "Re-encrypted via Umbra MPC for the investor's X25519 key.",
        },
      );
    } finally {
      setDecryptingId(null);
    }
  };

  return (
    <Card>
      <CardBody className="p-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--color-mint)]" />
            <h3 className="text-sm font-semibold">Attestations</h3>
          </div>
          <Badge tone="muted">cap table &amp; LP reports</Badge>
        </div>
        <Divider />
        <ul className="divide-y divide-white/5">
          {attestations.map((a) => {
            const investor = investors.find((i) => i.id === a.investorId);
            const schedule = schedules.find((s) => s.id === a.scheduleId);
            return (
              <li key={a.id} className="px-6 py-3 flex items-center gap-4">
                {investor ? (
                  <Avatar seed={investor.avatarSeed} size={28} />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {investor?.orgName}
                    <Badge tone="muted">{schedule?.id}</Badge>
                  </div>
                  <div className="text-xs text-[var(--color-text-faint)] font-mono">
                    {a.tvkFingerprint} ·{" "}
                    {formatDate(a.fiscalYearStart)} →{" "}
                    {formatDate(a.fiscalYearEnd)}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={decryptingId === a.id}
                  onClick={() => decrypt(a.id)}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Decrypt scope
                </Button>
              </li>
            );
          })}
          {attestations.length === 0 ? (
            <li className="px-6 py-8 text-sm text-[var(--color-text-muted)] text-center">
              No attestations yet. Issue one from a schedule above.
            </li>
          ) : null}
        </ul>
      </CardBody>
    </Card>
  );
}

function InvestorPortalCard() {
  const investors = useAppStore((s) => s.investors);
  const vestTranches = useAppStore((s) => s.vestTranches);
  const vestSchedules = useAppStore((s) => s.vestSchedules);
  const currentInvestorId = useAppStore((s) => s.currentInvestorId);
  const setCurrentInvestorId = useAppStore((s) => s.setCurrentInvestorId);
  const umbra = useUmbra();
  const [claiming, setClaiming] = useState<string | null>(null);

  const posted = useMemo(() => {
    const scheduleIds = vestSchedules
      .filter((s) => s.investorId === currentInvestorId)
      .map((s) => s.id);
    return vestTranches.filter(
      (t) => scheduleIds.includes(t.scheduleId) && t.status === "utxo-posted",
    );
  }, [vestTranches, vestSchedules, currentInvestorId]);

  const claim = async (trancheId: string) => {
    setClaiming(trancheId);
    try {
      const result = await umbra.claimVestTranche(trancheId, "encrypted");
      toast.success(`Tranche #${result.tranchIndex} claimed into ETA`, {
        description: "Gasless via Umbra relayer.",
      });
    } finally {
      setClaiming(null);
    }
  };

  const current = investors.find((i) => i.id === currentInvestorId);

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--color-amber)]" />
            <h3 className="text-sm font-semibold">Investor portal</h3>
          </div>
          <Select
            className="h-8 w-auto"
            value={currentInvestorId ?? ""}
            onChange={(e) => setCurrentInvestorId(e.target.value)}
            options={investors.map((i) => ({
              value: i.id,
              label: `${i.orgName} (${i.round})`,
            }))}
          />
        </div>
        {current ? (
          <div className="flex items-center gap-2 mb-3">
            <Avatar seed={current.avatarSeed} size={26} />
            <span className="text-sm">{current.orgName}</span>
            <Mono className="text-xs text-[var(--color-text-faint)]">
              {truncateAddress(current.stealthAddress, 6, 6)}
            </Mono>
          </div>
        ) : null}
        <ul className="flex flex-col gap-2">
          {posted.map((t) => {
            const schedule = vestSchedules.find((s) => s.id === t.scheduleId);
            return (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2.5"
              >
                <Clock className="h-3.5 w-3.5 text-[var(--color-amber)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    Tranche #{t.tranchIndex} ·{" "}
                    <CipherField
                      cipher="••• •••"
                      plain={`${formatToken(t.amount, schedule?.tokenDecimals ?? 9)} ${schedule?.tokenSymbol ?? ""}`}
                    />
                  </div>
                  <div className="text-xs text-[var(--color-text-faint)] font-mono">
                    utxo {truncateAddress(t.utxoCommitment ?? "", 8, 6)}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => claim(t.id)}
                  loading={claiming === t.id}
                >
                  Claim → ETA
                </Button>
              </li>
            );
          })}
          {posted.length === 0 ? (
            <li className="text-xs text-[var(--color-text-faint)] italic">
              No posted tranches. Press <Mono>Tick now</Mono> on a schedule
              above to simulate the keeper.
            </li>
          ) : null}
        </ul>
      </CardBody>
    </Card>
  );
}

function ImpactBanner() {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-rose)]/10 border border-[var(--color-rose)]/20 flex items-center justify-center shrink-0">
            <TrendingDown className="h-5 w-5 text-[var(--color-rose)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">
              Estimated market impact avoided this quarter
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-2xl leading-relaxed">
              Based on comparable public cliffs of similar supply share in the
              last 12 months, {SEED_FOUNDATION.tokenSymbol} holders would have
              seen an average −14.6% drawdown in the 72 hours after each
              tranche. Penumbra&apos;s stealth-pool disbursements eliminate the
              observable signal.
            </p>
            <div className="flex items-baseline gap-6 mt-4 flex-wrap">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
                  Market cap protected
                </div>
                <div className="text-xl font-mono text-[var(--color-mint)]">
                  $14.3M
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
                  Avg drawdown avoided
                </div>
                <div className="text-xl font-mono text-[var(--color-mint)]">
                  −14.6% → 0%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
                  Public observers with signal
                </div>
                <div className="text-xl font-mono text-[var(--color-mint)]">
                  0
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function VestDashboard() {
  const vestSchedules = useAppStore((s) => s.vestSchedules);

  return (
    <PageShell>
      <FoundationHeader />
      <FoundationStats />

      <ImpactBanner />

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <Section
            title="Vesting schedules"
            description="Each row is a PDA-held Encrypted Token Account. Tick advances a tranche through the stealth pool."
          >
            <Card>
              <CardBody className="p-0">
                <ul className="divide-y divide-white/5">
                  {vestSchedules.map((s) => (
                    <li key={s.id}>
                      <ScheduleRow schedule={s} />
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Section>
        </div>
        <div className="lg:col-span-2 flex flex-col gap-5">
          <InvestorPortalCard />
          <AttestationsInbox />
          <Card>
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="text-sm font-semibold">Scheduler program</h3>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                <Mono>PenumbraScheduler</Mono> is a minimal Anchor program
                that holds schedule PDAs, is tick-able by anyone, and CPIs
                into Umbra on each tranche.
              </p>
              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                program id
                <div className="text-[var(--color-text)] mt-0.5 break-all">
                  {SEED_FOUNDATION.schedulerProgramId}
                </div>
              </div>
              <Link
                href="/docs"
                className="text-xs text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
              >
                See CPI recipe <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
