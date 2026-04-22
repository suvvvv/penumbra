import { AccountantDashboard } from "@/components/accountant/dashboard";
import { Hydrated } from "@/components/layout/hydrated";
import { PageShell } from "@/components/ui/primitives";

export default function AccountantPage() {
  return (
    <Hydrated
      fallback={
        <PageShell>
          <div className="h-8 w-40 shimmer rounded" />
          <div className="grid gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 shimmer rounded-2xl" />
            ))}
          </div>
        </PageShell>
      }
    >
      <AccountantDashboard />
    </Hydrated>
  );
}
