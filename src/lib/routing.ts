import type { Coordinates } from "./types";
import { haversine } from "./facilities";
export interface RoadRoute {
  kind: "road";
  geometry: Coordinates[];
  distanceKm: number;
  durationMinutes: number;
  label: "Road distance";
  mode: "driving";
  startOffsetMeters?: number;
  destinationOffsetMeters?: number;
}
export interface DirectConnection {
  kind: "direct";
  geometry: Coordinates[];
  distanceKm: number;
  label: "Straight-line distance";
  message: "Road route unavailable. No road connection is drawn.";
}
export type RouteResult = RoadRoute | DirectConnection;
export interface RoutingProvider {
  route(
    origin: Coordinates,
    destination: Coordinates,
    signal: AbortSignal,
  ): Promise<RoadRoute>;
}
export function directConnection(
  origin: Coordinates,
  destination: Coordinates,
): DirectConnection {
  return {
    kind: "direct",
    geometry: [origin, destination],
    distanceKm: haversine(origin, destination),
    label: "Straight-line distance",
    message: "Road route unavailable. No road connection is drawn.",
  };
}
export function googleDirections(
  destination: Coordinates,
  origin?: Coordinates,
) {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`,
    travelmode: "driving",
  });
  if (origin) params.set("origin", `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params}`;
}
let nextRequestAt = 0;
async function waitForRequestSlot(signal: AbortSignal) {
  signal.throwIfAborted();
  const start = Math.max(Date.now(), nextRequestAt);
  nextRequestAt = start + 1200;
  const delay = start - Date.now();
  if (delay <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, delay);
    signal.addEventListener("abort", abort, { once: true });
  });
}
export class OsrmRoutingProvider implements RoutingProvider {
  constructor(private endpoint: string) {}
  async route(
    origin: Coordinates,
    destination: Coordinates,
    signal: AbortSignal,
  ): Promise<RoadRoute> {
    const base = new URL(this.endpoint);
    if (
      !["https:", "http:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    )
      throw new Error("Invalid public endpoint.");
    await waitForRequestSlot(signal);
    const response = await fetch(
      `${base.href.replace(/\/$/, "")}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false&generate_hints=false&radiuses=1000;1000`,
      {
        signal,
        cache: "no-store",
        referrerPolicy: "strict-origin-when-cross-origin",
      },
    );
    if (!response.ok) throw new Error("Road provider unavailable.");
    const data = await response.json();
    const r = data.routes?.[0];
    if (
      data.code !== "Ok" ||
      !r ||
      !Number.isFinite(r.distance) ||
      r.distance < 0 ||
      !Number.isFinite(r.duration) ||
      r.duration < 0 ||
      r.geometry?.type !== "LineString" ||
      !Array.isArray(r.geometry.coordinates) ||
      r.geometry.coordinates.length < 2
    )
      throw new Error("Invalid road geometry.");
    const geometry: Coordinates[] = r.geometry.coordinates.map(
      (point: unknown) => {
        if (
          !Array.isArray(point) ||
          point.length < 2 ||
          !Number.isFinite(point[0]) ||
          !Number.isFinite(point[1]) ||
          Math.abs(point[0]) > 180 ||
          Math.abs(point[1]) > 90
        )
          throw new Error("Invalid road coordinate.");
        return { lat: point[1] as number, lng: point[0] as number };
      },
    );
    return {
      kind: "road",
      geometry,
      distanceKm: r.distance / 1000,
      durationMinutes: r.duration / 60,
      label: "Road distance",
      mode: "driving",
      startOffsetMeters: Number.isFinite(data.waypoints?.[0]?.distance)
        ? data.waypoints[0].distance
        : undefined,
      destinationOffsetMeters: Number.isFinite(data.waypoints?.[1]?.distance)
        ? data.waypoints[1].distance
        : undefined,
    };
  }
}
export async function routeOrFallback(
  provider: RoutingProvider | undefined,
  origin: Coordinates,
  destination: Coordinates,
  signal: AbortSignal,
): Promise<RouteResult> {
  try {
    return provider
      ? await provider.route(origin, destination, signal)
      : directConnection(origin, destination);
  } catch (error) {
    if (signal.aborted) throw error;
    return directConnection(origin, destination);
  }
}
