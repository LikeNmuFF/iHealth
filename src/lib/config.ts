import type { Coordinates } from "./types";
// Approximate geographic context only. Every facility marker is synthetic.
export const CITY_CENTER: Coordinates = { lat: 6.704, lng: 121.969 };
export const DEMO_ORIGIN: Coordinates = { lat: 6.7048, lng: 121.9654 };
export const AVAILABILITY_FRESHNESS_MS = 60 * 60 * 1000; // Prototype assumption, not a clinical standard.
export const STORAGE_KEY = "ihealth-hapisabela-demo-v1";
export const TILE_URL =
  process.env.NEXT_PUBLIC_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_TILE_ATTRIBUTION ||
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>';
// Public OSRM demo service: low-volume, non-commercial demonstrations only.
// https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server
export const ROUTE_ENDPOINT =
  process.env.NEXT_PUBLIC_OSRM_ENDPOINT || "https://router.project-osrm.org";
export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Awaiting review",
  acknowledged: "Under review",
  clarification_requested: "Clarification needed",
  resubmitted: "Information added",
  alternative_proposed: "Alternative proposed",
  alternative_accepted: "Alternative accepted",
  confirmed: "Plan confirmed",
  arrived: "Arrived",
  completed: "Visit completed",
  declined: "Declined",
  cancelled: "Cancelled",
} as const;
export const TYPE_LABELS = {
  hospital: "Hospital",
  health_center: "Health center",
  clinic: "Clinic",
} as const;
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
