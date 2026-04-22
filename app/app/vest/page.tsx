import { VestDashboard } from "@/components/vest/dashboard";
import { Hydrated } from "@/components/layout/hydrated";
import { PageShell } from "@/components/ui/primitives";

export default function VestPage() {
  return (
    <Hydrated
      fallback={
        <PageShell>
          <div className="h-8 w-40 shimmer rounded" />
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 shimmer rounded-2xl" />
            ))}
          </div>
        </PageShell>
      }
    >
      <VestDashboard />
    </Hydrated>
  );
}
