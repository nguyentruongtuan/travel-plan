import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PhotoUpload } from "@/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type Plan } from "@/lib/api";

export function PlanFormDialog({
  open,
  onOpenChange,
  plan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan?: Plan | null;
  onSaved: (plan: Plan) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(plan?.name ?? "");
      setDescription(plan?.description ?? "");
      setPhotoUrl(plan?.photo_url ?? null);
    }
  }, [open, plan]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { name: name.trim(), description, photo_url: photoUrl };
      const saved = plan ? await api.updatePlan(plan.id, body) : await api.createPlan(body);
      toast.success(plan ? "Plan updated" : "Plan created");
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? "Edit plan" : "New plan"}</DialogTitle>
          <DialogDescription>Distance and spending are calculated from the plan's stops.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plan-desc">Description</Label>
            <Textarea id="plan-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Cover photo</Label>
            <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
