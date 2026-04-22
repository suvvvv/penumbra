import { UnlockSimulator } from "@/components/vest/simulator";
import { Hydrated } from "@/components/layout/hydrated";
import { PageShell } from "@/components/ui/primitives";

export const metadata = {
  title: "Penumbra · Unlock-FUD simulator",
  description:
    "Side-by-side: what a Solana token unlock looks like when the world sees it coming, vs when Penumbra hides it.",
};

export default function SimulatorPage() {
  return (
    <Hydrated
      fallback={
        <PageShell>
          <div className="h-8 w-40 shimmer rounded" />
          <div className="h-96 shimmer rounded-2xl" />
        </PageShell>
      }
    >
      <UnlockSimulator />
    </Hydrated>
  );
}
