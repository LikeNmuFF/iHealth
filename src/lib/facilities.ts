import { AVAILABILITY_FRESHNESS_MS } from "./config";
import type { Coordinates, Facility, ServiceAvailability } from "./types";
export function haversine(a: Coordinates, b: Coordinates) {
  const rad = (v: number) => (v * Math.PI) / 180;
  const dlat = rad(b.lat - a.lat),
    dlng = rad(b.lng - a.lng);
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function availabilityStatus(
  value?: ServiceAvailability,
  now = Date.now(),
) {
  return !value ||
    now - new Date(value.updatedAt).getTime() > AVAILABILITY_FRESHNESS_MS ||
    new Date(value.updatedAt).getTime() > now + 60000
    ? "unknown"
    : value.status;
}
export function isScheduledOpen(facility: Facility, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: facility.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  const time = get("hour") + ":" + get("minute");
  return facility.hours.some((h) =>
    h.open <= h.close
      ? h.days.includes(day) && time >= h.open && time <= h.close
      : (h.days.includes(day) && time >= h.open) ||
        (h.days.includes((day + 6) % 7) && time <= h.close),
  );
}
export function facilityAvailability(
  f: Facility,
  serviceId?: string,
  now = Date.now(),
) {
  const values = f.serviceAvailability
    .filter((v) => !serviceId || v.serviceId === serviceId)
    .map((v) => availabilityStatus(v, now));
  return values.includes("accepting")
    ? "accepting"
    : values.length && values.every((v) => v === "not_accepting")
      ? "not_accepting"
      : "unknown";
}
export const availabilityLabel = (status: string) =>
  status === "accepting"
    ? "Accepting referrals"
    : status === "not_accepting"
      ? "Not accepting"
      : "Availability unknown";
