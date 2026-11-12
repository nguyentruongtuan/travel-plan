import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  Route,
  Trash2,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ItemFormDialog } from "@/components/item-form-dialog";
import { StopsMap } from "@/components/maps";
import { PlanFormDialog } from "@/components/plan-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError, type PlanDetail, type PlanItem } from "@/lib/api";
import { formatDateTime, formatKm, formatMoney } from "@/lib/utils";

function Stat({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <div className="bg-card rounded-xl border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PlanDetailPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [editingPlan, setEditingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: PlanItem | null }>({ open: false, item: null });
  const [deletingItem, setDeletingItem] = useState<PlanItem | null>(null);

  const load = useCallback(() => {
    api
      .getPlan(planId)
      .then(setPlan)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true);
        else toast.error(`Could not load plan: ${err.message}`);
      });
  }, [planId]);

  useEffect(load, [load]);

  const move = async (index: number, dir: -1 | 1) => {
    if (!plan) return;
    const ids = plan.items.map((i) => i.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    try {
      await api.reorderItems(plan.id, ids);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (notFound) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4">This plan doesn't exist or you don't have access to it.</p>
        <Button asChild variant="outline">
          <Link to="/plans">Back to plans</Link>
        </Button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto grid max-w-4xl gap-4 p-4 md:p-8">
        <Skeleton className="h-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stops = plan.items.map((i, idx) => ({
    id: i.id,
    label: String(idx + 1),
    title: `${idx + 1}. ${i.name}`,
    subtitle: i.location.address ?? undefined,
    location: i.location,
  }));

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* Hero */}
      <div className="bg-muted relative h-48 md:mx-8 md:mt-8 md:h-64 md:overflow-hidden md:rounded-xl">
        {plan.photo_url && <img src={plan.photo_url} alt="" className="absolute inset-0 size-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 left-3 rounded-full"
          aria-label="Back to plans"
          onClick={() => navigate("/plans")}
        >
          <ArrowLeft />
        </Button>
        <div className="absolute top-3 right-3 flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full" aria-label="Edit plan" onClick={() => setEditingPlan(true)}>
            <Pencil />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full" aria-label="Delete plan" onClick={() => setDeletingPlan(true)}>
            <Trash2 />
          </Button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h1 className="text-2xl font-bold">{plan.name}</h1>
          <p className="text-sm opacity-80">by {plan.author}</p>
        </div>
      </div>

      <div className="grid gap-5 p-4 md:px-8">
        {plan.description && <p className="text-muted-foreground whitespace-pre-line">{plan.description}</p>}

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={MapPin} label="Stops" value={String(plan.item_count)} />
          <Stat icon={Route} label="Distance" value={formatKm(plan.total_distance_km)} />
          <Stat icon={Wallet} label="Spent" value={formatMoney(plan.total_spent)} />
        </div>

        {plan.items.length > 0 && <StopsMap stops={stops} className="h-64 border md:h-80" />}

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Stops</h2>
          <Button size="sm" onClick={() => setItemDialog({ open: true, item: null })}>
            <Plus /> Add stop
          </Button>
        </div>

        {plan.items.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            No stops yet. Add the first place you'll visit.
          </p>
        ) : (
          <ol className="relative grid gap-3">
            {plan.items.map((item, idx) => (
              <li key={item.id} className="bg-card flex gap-3 rounded-xl border p-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full text-sm font-bold">
                    {idx + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Move up"
                    disabled={idx === 0}
                    onClick={() => move(idx, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Move down"
                    disabled={idx === plan.items.length - 1}
                    onClick={() => move(idx, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-muted-foreground truncate text-xs">
                        {item.location.address ?? `${item.location.lat.toFixed(4)}, ${item.location.lng.toFixed(4)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Edit stop"
                        onClick={() => setItemDialog({ open: true, item })}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label="Delete stop"
                        onClick={() => setDeletingItem(item)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <dl className="text-muted-foreground mt-2 grid gap-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5" />
                      <dt className="sr-only">Planned</dt>
                      <dd>Planned: {formatDateTime(item.planned_stop_time)}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      <dt className="sr-only">Stopped</dt>
                      <dd>Stopped: {formatDateTime(item.stopped_time)}</dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wallet className="size-3.5" />
                      <dt className="sr-only">Spent</dt>
                      <dd>{formatMoney(item.spent_money)}</dd>
                    </div>
                  </dl>

                  {item.photo_url && (
                    <img src={item.photo_url} alt="" className="mt-3 aspect-video w-full rounded-lg object-cover" loading="lazy" />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <PlanFormDialog open={editingPlan} onOpenChange={setEditingPlan} plan={plan} onSaved={load} />
      <ItemFormDialog
        open={itemDialog.open}
        onOpenChange={(open) => setItemDialog((s) => ({ ...s, open }))}
        planId={plan.id}
        item={itemDialog.item}
        onSaved={load}
      />
      <ConfirmDialog
        open={deletingPlan}
        onOpenChange={setDeletingPlan}
        title="Delete this plan?"
        description="The plan and all of its stops will be permanently deleted."
        onConfirm={async () => {
          await api.deletePlan(plan.id);
          toast.success("Plan deleted");
          navigate("/plans", { replace: true });
        }}
      />
      <ConfirmDialog
        open={deletingItem !== null}
        onOpenChange={(o) => !o && setDeletingItem(null)}
        title="Delete this stop?"
        description={`"${deletingItem?.name ?? ""}" will be removed from the plan.`}
        onConfirm={async () => {
          if (!deletingItem) return;
          await api.deleteItem(plan.id, deletingItem.id);
          toast.success("Stop deleted");
          load();
        }}
      />
    </div>
  );
}
