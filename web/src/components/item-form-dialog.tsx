import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { geocodeAddress, LocationPicker, mapsConfigured } from "@/components/maps";
import { PhotoUpload } from "@/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type Location, type PlanItem } from "@/lib/api";
import { formatMoneyInput, fromLocalInput, parseMoneyInput, toLocalInput } from "@/lib/utils";

export function ItemFormDialog({
  open,
  onOpenChange,
  planId,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  planId: string;
  item?: PlanItem | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [planned, setPlanned] = useState("");
  const [stopped, setStopped] = useState("");
  const [spent, setSpent] = useState("0");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setPlanned(toLocalInput(item?.planned_stop_time));
    setStopped(toLocalInput(item?.stopped_time));
    setSpent(formatMoneyInput(String(Math.round(item?.spent_money ?? 0))));
    setPhotoUrl(item?.photo_url ?? null);
    setLocation(item?.location ?? null);
    setAddress(item?.location.address ?? "");
    setLat(item ? String(item.location.lat) : "");
    setLng(item ? String(item.location.lng) : "");
  }, [open, item]);

  const applyLocation = (loc: Location) => {
    setLocation(loc);
    setLat(loc.lat.toFixed(6));
    setLng(loc.lng.toFixed(6));
    if (loc.address) setAddress(loc.address);
  };

  const onSearch = async () => {
    if (!address.trim()) return;
    try {
      const loc = await geocodeAddress(address.trim());
      if (loc) applyLocation(loc);
      else toast.error("No place found for that address.");
    } catch {
      toast.error("Address lookup failed. Is the Geocoding API enabled?");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const latN = Number(lat);
    const lngN = Number(lng);
    if (lat === "" || lng === "" || Number.isNaN(latN) || Number.isNaN(lngN)) {
      toast.error("Pick a location on the map or enter coordinates.");
      return;
    }
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        planned_stop_time: fromLocalInput(planned),
        stopped_time: fromLocalInput(stopped),
        spent_money: parseMoneyInput(spent),
        photo_url: photoUrl,
        location: { lat: latN, lng: lngN, address: address.trim() || null },
      };
      if (item) await api.updateItem(planId, item.id, body);
      else await api.createItem(planId, body);
      toast.success(item ? "Stop updated" : "Stop added");
      onSaved();
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
          <DialogTitle>{item ? "Edit stop" : "Add stop"}</DialogTitle>
          <DialogDescription>
            {mapsConfigured ? "Tap the map to drop the pin, or search an address." : "Enter the coordinates of the stop."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-address">Location</Label>
            <div className="flex gap-2">
              <Input
                id="item-address"
                placeholder="Address or place name"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && mapsConfigured) {
                    e.preventDefault();
                    onSearch();
                  }
                }}
              />
              {mapsConfigured && (
                <Button type="button" variant="outline" size="icon" aria-label="Search address" onClick={onSearch}>
                  <Search />
                </Button>
              )}
            </div>
            <LocationPicker value={location} onChange={applyLocation} className="h-56" />
            <div className="grid grid-cols-2 gap-2">
              <Input
                inputMode="decimal"
                placeholder="Latitude"
                aria-label="Latitude"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
              <Input
                inputMode="decimal"
                placeholder="Longitude"
                aria-label="Longitude"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="item-planned">Planned stop time</Label>
              <Input id="item-planned" type="datetime-local" value={planned} onChange={(e) => setPlanned(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item-stopped">Actual stop time</Label>
              <Input id="item-stopped" type="datetime-local" value={stopped} onChange={(e) => setStopped(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="item-spent">Money spent (VND)</Label>
            <div className="relative">
              <Input
                id="item-spent"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                className="pr-8"
                value={spent}
                onChange={(e) => setSpent(formatMoneyInput(e.target.value))}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                ₫
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Photo</Label>
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
