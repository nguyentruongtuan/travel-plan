import { ImageIcon, MapPin, Plus, Route, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PlanFormDialog } from "@/components/plan-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Plan } from "@/lib/api";
import { formatKm, formatMoney } from "@/lib/utils";

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <Link
      to={`/plans/${plan.id}`}
      className="bg-card group flex overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md sm:flex-col"
    >
      <div className="bg-muted relative w-28 shrink-0 sm:aspect-video sm:w-full">
        {plan.photo_url ? (
          <img src={plan.photo_url} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
        ) : (
          <div className="text-muted-foreground absolute inset-0 grid place-items-center">
            <ImageIcon className="size-6" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="truncate font-semibold group-hover:text-primary">{plan.name}</h3>
        <p className="text-muted-foreground truncate text-xs">by {plan.author}</p>
        {plan.description && <p className="text-muted-foreground line-clamp-2 text-sm">{plan.description}</p>}
        <div className="text-muted-foreground mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {plan.item_count} stops
          </span>
          <span className="inline-flex items-center gap-1">
            <Route className="size-3.5" /> {formatKm(plan.total_distance_km)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Wallet className="size-3.5" /> {formatMoney(plan.total_spent)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api
      .listPlans()
      .then(setPlans)
      .catch((err) => {
        toast.error(`Could not load plans: ${err.message}`);
        setPlans([]);
      });
  }, []);

  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-5xl p-4 pb-24 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My plans</h1>
          <p className="text-muted-foreground text-sm">Tap a plan to see its stops.</p>
        </div>
        <Button className="hidden md:inline-flex" onClick={() => setCreating(true)}>
          <Plus /> New plan
        </Button>
      </div>

      {plans === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-64" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Route className="size-8" />
          <p>No plans yet. Create your first trip!</p>
          <Button onClick={() => setCreating(true)}>
            <Plus /> New plan
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      )}

      {/* Mobile floating action button */}
      <Button
        size="icon"
        className="fixed right-5 bottom-5 size-14 rounded-full shadow-lg md:hidden"
        aria-label="New plan"
        onClick={() => setCreating(true)}
      >
        <Plus className="size-6" />
      </Button>

      <PlanFormDialog open={creating} onOpenChange={setCreating} onSaved={(p) => navigate(`/plans/${p.id}`)} />
    </div>
  );
}
