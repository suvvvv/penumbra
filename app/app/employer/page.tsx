import { EmployerDashboard } from "@/components/employer/dashboard";
import { Hydrated } from "@/components/layout/hydrated";
import { PageShell } from "@/components/ui/primitives";

export default function EmployerPage() {
  return (
    <Hydrated
      fallback={
        <PageShell>
          <div className="h-8 w-40 shimmer rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 shimmer rounded-2xl" />
            ))}
          </div>
        </PageShell>
      }
    >
      <EmployerDashboard />
    </Hydrated>
  );
}
