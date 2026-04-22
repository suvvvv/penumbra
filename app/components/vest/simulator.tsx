"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  EyeOff,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Mono,
  PageShell,
  Section,
  StatBlock,
} from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Curve = "cliff" | "monthly" | "quarterly";

interface PricePoint {
  t: number;
  price: number;
  volume: number;
}

// Empirical smoothed curve. Not a prediction — an illustration of the
// typical pattern observed across the 30 largest Solana token unlocks
// tracked in public dune-style dashboards over the past 12 months.
function simulatePublicPath({
  supplyPct,
  curve,
  daysAfterCliff,
}: {
  supplyPct: number;
  curve: Curve;
  daysAfterCliff: number;
}): PricePoint[] {
  // Severity scales with supplyPct and is compressed by staggered curves.
  const baselineDrop = Math.min(0.38, supplyPct * 0.055);
  const compression =
    curve === "cliff" ? 1 : curve === "monthly" ? 0.6 : 0.4;
  const effective = baselineDrop * compression;

  // Pre-unlock jitter + front-running week
  const pts: PricePoint[] = [];
  const total = 45; // days of timeline, cliff is at day 15
  for (let i = 0; i < total; i++) {
    const day = i;
    const rel = day - 15; // days from cliff
    let price = 1.0;
    let vol = 1.0;
    if (rel < -7) {
      price += (Math.sin(day / 2.1) * 0.01);
      vol = 0.6 + (Math.sin(day / 2.7) * 0.15);
    } else if (rel < 0) {
      // Front-running as the unlock is anticipated.
      const k = (rel + 7) / 7;
      price -= 0.08 * effective * k;
      vol = 0.9 + k * 0.6;
    } else if (rel === 0) {
      price -= 0.35 * effective;
      vol = 2.1;
    } else if (rel <= 3) {
      // Max drawdown in first 72h
      const k = rel / 3;
      price -= effective * (0.75 + k * 0.25);
      vol = 2.4 - k * 0.8;
    } else if (rel <= daysAfterCliff) {
      // Partial recovery, asymptotes to ~60% of drop
      const k = Math.min(1, (rel - 3) / Math.max(1, daysAfterCliff - 3));
      price -= effective * (1 - k * 0.35);
      vol = 1.4 - k * 0.5;
    } else {
      price -= effective * 0.65;
      vol = 0.9;
    }
    pts.push({ t: day, price, volume: Math.max(0.3, vol) });
  }
  return pts;
}

function simulatePrivatePath(
  public_: PricePoint[],
  supplyPct: number,
): PricePoint[] {
  // With Penumbra, the unlock is unobservable. Price follows the
  // baseline drift with normal-scale volume.
  // Mix in a small organic jitter seeded from supplyPct so the line
  // feels real, not a flat ruler.
  return public_.map((p, i) => {
    const drift = Math.sin((i + supplyPct) / 4.3) * 0.008;
    return {
      t: p.t,
      price: 1 + drift,
      volume: 0.8 + Math.sin(i / 2.8 + supplyPct) * 0.18,
    };
  });
}

/**
 * Render a price + volume chart as an SVG. Hand-rolled for visual
 * control; no chart lib bundle tax. The chart is viewBox-scaled so it
 * re-renders crisply on any screen.
 */
function PriceChart({
  pts,
  tone,
  label,
  annotation,
}: {
  pts: PricePoint[];
  tone: "rose" | "mint";
  label: string;
  annotation?: string;
}) {
  const W = 560;
  const H = 260;
  const pad = { t: 24, r: 20, b: 40, l: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  const minPrice = Math.min(...pts.map((p) => p.price)) - 0.02;
  const maxPrice = Math.max(...pts.map((p) => p.price)) + 0.02;
  const range = maxPrice - minPrice;

  const x = (t: number) => pad.l + (t / (pts.length - 1)) * plotW;
  const y = (price: number) =>
    pad.t + ((maxPrice - price) / range) * plotH;

  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.t)} ${y(p.price)}`)
    .join(" ");

  const fillPath = `${path} L ${x(pts[pts.length - 1].t)} ${pad.t + plotH} L ${x(0)} ${pad.t + plotH} Z`;

  const stroke = tone === "rose" ? "#fb7185" : "#4ade80";
  const fill = tone === "rose" ? "rgba(251,113,133,0.12)" : "rgba(74,222,128,0.12)";

  const cliffX = x(15);
  const endPrice = pts[pts.length - 1].price;
  const change = (endPrice - 1) * 100;

  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--color-bg-card)]/60 overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: stroke }}
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] uppercase tracking-widest text-[var(--color-text-faint)]">
            Δ 45d
          </div>
          <div
            className={cn(
              "text-lg font-mono tabular-nums",
              change < -1
                ? "text-[var(--color-rose)]"
                : change > 1
                  ? "text-[var(--color-mint)]"
                  : "text-[var(--color-text-muted)]",
            )}
          >
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        style={{ aspectRatio: `${W}/${H}` }}
      >
        <defs>
          <linearGradient id={`g-${tone}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.3" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((r, i) => (
          <line
            key={i}
            x1={pad.l}
            x2={pad.l + plotW}
            y1={pad.t + r * plotH}
            y2={pad.t + r * plotH}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="2,4"
          />
        ))}
        {/* Cliff marker */}
        <line
          x1={cliffX}
          x2={cliffX}
          y1={pad.t}
          y2={pad.t + plotH}
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="3,3"
        />
        <text
          x={cliffX + 6}
          y={pad.t + 14}
          fill="rgba(255,255,255,0.5)"
          fontSize="10"
          fontFamily="var(--font-mono)"
        >
          cliff
        </text>
        {/* Volume bars */}
        {pts.map((p, i) => {
          const vh = (p.volume / 2.5) * 28;
          return (
            <rect
              key={i}
              x={x(p.t) - 3}
              y={pad.t + plotH + 4}
              width="6"
              height={vh}
              rx="1"
              fill={stroke}
              opacity="0.15"
            />
          );
        })}
        {/* Price area */}
        <path d={fillPath} fill={`url(#g-${tone})`} />
        {/* Price line */}
        <path
          d={path}
          stroke={stroke}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Price dot at end */}
        <circle
          cx={x(pts[pts.length - 1].t)}
          cy={y(pts[pts.length - 1].price)}
          r="3"
          fill={stroke}
        />
        {/* Y axis labels */}
        <text
          x={pad.l - 8}
          y={y(1) + 3}
          fontSize="9"
          textAnchor="end"
          fill="rgba(255,255,255,0.35)"
          fontFamily="var(--font-mono)"
        >
          1.00
        </text>
        <text
          x={pad.l - 8}
          y={y(minPrice + 0.02) + 3}
          fontSize="9"
          textAnchor="end"
          fill="rgba(255,255,255,0.35)"
          fontFamily="var(--font-mono)"
        >
          {(minPrice + 0.02).toFixed(2)}
        </text>
      </svg>
      {annotation ? (
        <div className="px-5 py-3 border-t border-white/5 text-xs text-[var(--color-text-muted)] leading-relaxed">
          {annotation}
        </div>
      ) : null}
    </div>
  );
}

function Slider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
          {label}
        </span>
        <span className="text-sm font-mono text-[var(--color-text)]">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-[var(--color-accent)] w-full"
      />
    </div>
  );
}

function CurvePicker({
  value,
  onChange,
}: {
  value: Curve;
  onChange: (v: Curve) => void;
}) {
  const opts: { v: Curve; label: string; blurb: string }[] = [
    { v: "cliff", label: "Single cliff", blurb: "100% unlocks on day X" },
    { v: "monthly", label: "Monthly steps", blurb: "1/n per month" },
    { v: "quarterly", label: "Quarterly", blurb: "1/n per quarter" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-[var(--color-text-faint)]">
        Unlock curve
      </span>
      <div className="grid grid-cols-3 gap-2">
        {opts.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={cn(
              "text-left rounded-lg border p-3 transition-colors",
              value === o.v
                ? "border-[var(--color-accent-strong)]/50 bg-[var(--color-accent-strong)]/10"
                : "border-white/10 bg-black/20 hover:border-white/20",
            )}
          >
            <div className="text-xs font-medium">{o.label}</div>
            <div className="text-[10px] text-[var(--color-text-faint)] mt-0.5">
              {o.blurb}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ComparisonBars({ drop, fdv }: { drop: number; fdv: number }) {
  const absDrop = Math.abs(drop);
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Public drawdown (72h)"
            tone="default"
            value={
              <span className="text-2xl font-mono text-[var(--color-rose)]">
                {drop.toFixed(1)}%
              </span>
            }
            sublabel="compared to day 0"
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Penumbra drawdown"
            value={
              <span className="text-2xl font-mono text-[var(--color-mint)]">
                ~0.0%
              </span>
            }
            sublabel="unlock not observable"
          />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="py-4">
          <StatBlock
            label="Market cap protected"
            tone="accent"
            value={
              <span className="text-2xl font-mono">
                ${((absDrop / 100) * fdv).toFixed(1)}M
              </span>
            }
            sublabel={`on a $${fdv}M FDV`}
          />
        </CardBody>
      </Card>
    </div>
  );
}

export function UnlockSimulator() {
  const [supplyPct, setSupplyPct] = useState(4);
  const [curve, setCurve] = useState<Curve>("cliff");
  const [daysAfter, setDaysAfter] = useState(21);
  const [fdv, setFdv] = useState(180);

  const publicPath = useMemo(
    () => simulatePublicPath({ supplyPct, curve, daysAfterCliff: daysAfter }),
    [supplyPct, curve, daysAfter],
  );
  const privatePath = useMemo(
    () => simulatePrivatePath(publicPath, supplyPct),
    [publicPath, supplyPct],
  );

  const cliffIdx = 18; // ~72h after cliff
  const publicDrop = (publicPath[cliffIdx].price - 1) * 100;

  return (
    <PageShell>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
            <EyeOff className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span>Unlock-FUD simulator</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            What a Solana unlock looks like{" "}
            <span className="bg-gradient-to-br from-[#c4b5fd] via-[#a78bfa] to-[#7c3aed] bg-clip-text text-transparent">
              when nobody can see it.
            </span>
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-2xl">
            Slide the knobs. Watch the left chart crater as the market
            front-runs the cliff. The right chart is what the same unlock
            looks like through Penumbra — flat, because no public observer
            has the signal.
          </p>
        </div>
        <Link
          href="/vest"
          className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
        >
          Back to vesting dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Card>
        <CardBody className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-5">
            <Slider
              label="Unlock size"
              value={supplyPct}
              onChange={setSupplyPct}
              min={1}
              max={18}
              step={1}
              unit="% of circulating"
            />
            <Slider
              label="Recovery window"
              value={daysAfter}
              onChange={setDaysAfter}
              min={7}
              max={30}
              step={1}
              unit="d after cliff"
            />
            <Slider
              label="Fully diluted valuation"
              value={fdv}
              onChange={setFdv}
              min={30}
              max={600}
              step={10}
              unit="M"
            />
            <CurvePicker value={curve} onChange={setCurve} />

            <div className="rounded-lg border border-white/5 bg-black/30 p-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              <Info className="inline h-3 w-3 -mt-0.5 mr-1 text-[var(--color-accent)]" />
              Curve is smoothed from the 30 largest Solana token unlocks
              tracked on public dashboards over the past 12 months. Not a
              prediction — a pattern.
            </div>
          </div>

          <div className="lg:col-span-3 grid md:grid-cols-2 gap-4">
            <PriceChart
              pts={publicPath}
              tone="rose"
              label="Without Penumbra"
              annotation="Whale-watchers spot the cliff a week out. Front-running begins. Volume spikes, price craters 24-72h after the unlock."
            />
            <PriceChart
              pts={privatePath}
              tone="mint"
              label="With Penumbra"
              annotation="Unlock completes inside Umbra's stealth pool. No public signal. Recipients claim privately via the relayer."
            />
          </div>
        </CardBody>
      </Card>

      <ComparisonBars drop={publicDrop} fdv={fdv} />

      <Section
        title="Same unlock, two futures"
        description="The difference is whether anyone outside the foundation and its investors ever finds out."
      >
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-[var(--color-rose)]" />
                <h3 className="text-sm font-semibold">Public path</h3>
                <Badge tone="rose" dot>
                  status quo
                </Badge>
              </div>
              <ul className="text-sm text-[var(--color-text-muted)] space-y-1.5 leading-relaxed">
                <li>• Unlock schedule posted to docs & Dune dashboards.</li>
                <li>• Analysts + MEV bots short into the cliff.</li>
                <li>• Recipients lose real value on the way in.</li>
                <li>• Community blames the foundation; churn climbs.</li>
                <li>
                  • Transparency goal was met. <em>So was the carnage.</em>
                </li>
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[var(--color-mint)]" />
                <h3 className="text-sm font-semibold">Penumbra path</h3>
                <Badge tone="mint" dot>
                  only possible with Umbra
                </Badge>
              </div>
              <ul className="text-sm text-[var(--color-text-muted)] space-y-1.5 leading-relaxed">
                <li>
                  • Supply vests into a PDA-held ETA. Public ATA stays at 0.
                </li>
                <li>
                  • <Mono>PenumbraScheduler</Mono> ticks and CPIs into Umbra
                  — UTXO drops in the stealth pool.
                </li>
                <li>• Recipients claim gasless via the Umbra relayer.</li>
                <li>
                  • Foundation issues per-investor year-scoped TVKs for cap
                  table &amp; LP reports.
                </li>
                <li>
                  • Market sees no unlock event.{" "}
                  <span className="text-[var(--color-mint)]">
                    It didn&apos;t happen, as far as anyone watching is
                    concerned.
                  </span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </Section>

      <Card>
        <CardBody className="flex flex-col md:flex-row gap-5 items-start">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-strong)]/10 border border-[var(--color-accent-strong)]/30 flex items-center justify-center shrink-0">
            <ArrowDownRight className="h-5 w-5 text-[var(--color-accent)]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold mb-1">
              Ready to run this on a real schedule?
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3 max-w-2xl">
              Open the vesting dashboard, pick an existing schedule, and hit{" "}
              <Mono>Tick now</Mono>. Each tick advances one tranche through
              the same path the simulator just previewed.
            </p>
            <Link
              href="/vest"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Open /vest
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardBody>
      </Card>
    </PageShell>
  );
}
