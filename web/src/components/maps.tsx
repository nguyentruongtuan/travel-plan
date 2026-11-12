import "mapbox-gl/dist/mapbox-gl.css";
import Map, {
  FullscreenControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  useMap,
  type MapMouseEvent,
} from "react-map-gl/mapbox";
import type { FeatureCollection, LineString } from "geojson";
import { MapPinOff } from "lucide-react";
import { useEffect, useState } from "react";
import type { Location } from "@/lib/api";
import { cn } from "@/lib/utils";

const ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAP_STYLE = import.meta.env.VITE_MAPBOX_STYLE || "mapbox://styles/mapbox/streets-v12";
const DEFAULT_CENTER = { lat: 16.05, lng: 108.2 };
const DEFAULT_COLOR = "#0f766e";

export const mapsConfigured = Boolean(ACCESS_TOKEN);

function MapsMissing({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg p-4 text-center text-sm",
        className,
      )}
    >
      <MapPinOff className="size-6" />
      Mapbox is not configured. Set <code>VITE_MAPBOX_ACCESS_TOKEN</code>.
    </div>
  );
}

export interface MapStop {
  id: string;
  label: string;
  title: string;
  subtitle?: string;
  location: Location;
  color?: string;
  group?: string;
}

/** Fit the viewport to the given points whenever they change. Must render inside <Map>. */
function FitBounds({ points }: { points: Location[] }) {
  const { current: map } = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join("|");
  useEffect(() => {
    if (!map || points.length === 0) return;
    if (points.length === 1) {
      map.flyTo({ center: [points[0].lng, points[0].lat], zoom: 13, duration: 600 });
      return;
    }
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: 15, duration: 600 },
    );
  }, [map, key]);
  return null;
}

/** Pan to the point if it is outside the current viewport (e.g. after an address search). */
function KeepInView({ point }: { point: Location }) {
  const { current: map } = useMap();
  useEffect(() => {
    if (!map || map.getBounds()?.contains([point.lng, point.lat])) return;
    map.flyTo({ center: [point.lng, point.lat], zoom: Math.max(map.getZoom(), 13), duration: 600 });
  }, [map, point.lat, point.lng]);
  return null;
}

function StopPin({ label, color }: { label: string; color: string }) {
  return (
    <div
      className="grid size-7 cursor-pointer place-items-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-md"
      style={{ background: color }}
    >
      {label}
    </div>
  );
}

/** Markers for stops, with an optional route line connecting each group in order. */
export function StopsMap({
  stops,
  showRoute = true,
  className,
  onSelect,
}: {
  stops: MapStop[];
  showRoute?: boolean;
  className?: string;
  onSelect?: (stop: MapStop) => void;
}) {
  const [active, setActive] = useState<MapStop | null>(null);
  if (!mapsConfigured) return <MapsMissing className={className} />;

  const groups = new globalThis.Map<string, MapStop[]>();
  for (const s of stops) {
    const g = s.group ?? "default";
    groups.set(g, [...(groups.get(g) ?? []), s]);
  }

  const routes: FeatureCollection<LineString, { color: string }> = {
    type: "FeatureCollection",
    features: [...groups.values()]
      .filter((g) => g.length >= 2)
      .map((g) => ({
        type: "Feature",
        properties: { color: g[0].color ?? DEFAULT_COLOR },
        geometry: { type: "LineString", coordinates: g.map((s) => [s.location.lng, s.location.lat]) },
      })),
  };

  return (
    <div className={cn("overflow-hidden rounded-lg", className)}>
      <Map
        mapboxAccessToken={ACCESS_TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: DEFAULT_CENTER.lng, latitude: DEFAULT_CENTER.lat, zoom: 5 }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <FullscreenControl position="top-right" />
        <FitBounds points={stops.map((s) => s.location)} />
        {showRoute && (
          <Source id="routes" type="geojson" data={routes}>
            <Layer
              id="routes-line"
              type="line"
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.85 }}
            />
          </Source>
        )}
        {stops.map((s) => (
          <Marker
            key={s.id}
            longitude={s.location.lng}
            latitude={s.location.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setActive(s);
              onSelect?.(s);
            }}
          >
            <StopPin label={s.label} color={s.color ?? DEFAULT_COLOR} />
          </Marker>
        ))}
        {active && (
          <Popup
            longitude={active.location.lng}
            latitude={active.location.lat}
            anchor="bottom"
            offset={18}
            maxWidth="16rem"
            onClose={() => setActive(null)}
          >
            <p className="pr-4 text-sm font-semibold text-neutral-900">{active.title}</p>
            {active.subtitle && <p className="text-sm text-neutral-700">{active.subtitle}</p>}
          </Popup>
        )}
      </Map>
    </div>
  );
}

/** Click (or tap) the map to choose a location. */
export function LocationPicker({
  value,
  onChange,
  className,
}: {
  value: Location | null;
  onChange: (loc: Location) => void;
  className?: string;
}) {
  if (!mapsConfigured) return <MapsMissing className={className} />;

  const onClick = (e: MapMouseEvent) => {
    const loc: Location = { lat: e.lngLat.lat, lng: e.lngLat.lng, address: value?.address ?? null };
    onChange(loc);
    // Best-effort reverse geocode to fill in a readable address.
    reverseGeocode(loc)
      .then((address) => {
        if (address) onChange({ ...loc, address });
      })
      .catch(() => {});
  };

  const center = value ?? DEFAULT_CENTER;
  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Map
        mapboxAccessToken={ACCESS_TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: value ? 13 : 5 }}
        cursor="crosshair"
        onClick={onClick}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        {value && <KeepInView point={value} />}
        {value && <Marker longitude={value.lng} latitude={value.lat} anchor="bottom" color={DEFAULT_COLOR} />}
      </Map>
    </div>
  );
}

interface GeocodeFeature {
  geometry: { coordinates: [number, number] };
  properties: { full_address?: string; name?: string; place_formatted?: string };
}

async function geocode(path: string, params: Record<string, string>): Promise<GeocodeFeature | null> {
  const qs = new URLSearchParams({ ...params, limit: "1", access_token: ACCESS_TOKEN });
  const res = await fetch(`https://api.mapbox.com/search/geocode/v6/${path}?${qs}`);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const body: { features?: GeocodeFeature[] } = await res.json();
  return body.features?.[0] ?? null;
}

function addressOf(f: GeocodeFeature): string | null {
  const p = f.properties;
  return p.full_address ?? ([p.name, p.place_formatted].filter(Boolean).join(", ") || null);
}

async function reverseGeocode(loc: Location): Promise<string | null> {
  const f = await geocode("reverse", { longitude: String(loc.lng), latitude: String(loc.lat) });
  return f ? addressOf(f) : null;
}

/** Geocode a free-text address into a location (Mapbox Geocoding API). */
export async function geocodeAddress(address: string): Promise<Location | null> {
  if (!mapsConfigured) return null;
  const f = await geocode("forward", { q: address });
  if (!f) return null;
  const [lng, lat] = f.geometry.coordinates;
  return { lat, lng, address: addressOf(f) ?? address };
}
