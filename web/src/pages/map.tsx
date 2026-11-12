import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { StopsMap, type MapStop } from "@/components/maps";
import { api, type Plan, type PlanItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const COLORS = ["#0f766e", "#2563eb", "#c2410c", "#7c3aed", "#be123c", "#15803d", "#a16207", "#0e7490"];

export default function MapPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [selected, setSelected] = useState<string | "all">("all");

  useEffect(() => {
    Promise.all([api.listPlans(), api.listAllItems()])
      .then(([p, i]) => {
        setPlans(p);
        setItems(i);
      })
      .catch((err) => toast.error(`Could not load map data: ${err.message}`));
  }, []);

  const colorOf = useMemo(() => {
    const m = new Map(plans.map((p, idx) => [p.id, COLORS[idx % COLORS.length]]));
    return (id: string) => m.get(id) ?? COLORS[0];
  }, [plans]);

  const planName = useMemo(() => new Map(plans.map((p) => [p.id, p.name])), [plans]);

  const stops: MapStop[] = items
    .filter((i) => selected === "all" || i.plan_id === selected)
    .map((i) => ({
      id: i.id,
      label: String(i.order + 1),
      title: i.name,
      subtitle: [planName.get(i.plan_id), i.location.address].filter(Boolean).join(" · "),
      location: i.location,
      color: colorOf(i.plan_id),
      group: i.plan_id,
    }));

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:h-dvh">
      <div className="flex gap-2 overflow-x-auto border-b p-3 [scrollbar-width:none]">
        <Chip active={selected === "all"} onClick={() => setSelected("all")}>
          All plans
        </Chip>
        {plans.map((p) => (
          <Chip key={p.id} active={selected === p.id} color={colorOf(p.id)} onClick={() => setSelected(p.id)}>
            {p.name}
          </Chip>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        <StopsMap stops={stops} className="absolute inset-0 rounded-none" />
        {items.length === 0 && plans.length > 0 && (
          <div className="bg-background/90 absolute inset-x-4 bottom-4 rounded-lg border p-3 text-center text-sm shadow">
            No stops yet. Add stops from a{" "}
            <Link to="/plans" className="text-primary underline">
              plan
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent",
      )}
    >
      {color && <span className="size-2.5 rounded-full ring-1 ring-white" style={{ background: color }} />}
      {children}
    </button>
  );
}
