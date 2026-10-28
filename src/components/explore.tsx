"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  ChevronRight,
  Clock3,
  Compass,
  Hospital,
  LocateFixed,
  MapPin,
  Navigation,
  RotateCcw,
  SlidersHorizontal,
  Stethoscope,
  X,
} from "lucide-react";
import {
  CITY_CENTER,
  DEMO_ORIGIN,
  ROUTE_ENDPOINT,
  TYPE_LABELS,
  dateTime,
} from "@/lib/config";
import {
  availabilityLabel,
  availabilityStatus,
  facilityAvailability,
  haversine,
  isScheduledOpen,
} from "@/lib/facilities";
import {
  directConnection,
  googleDirections,
  OsrmRoutingProvider,
  routeOrFallback,
  type RouteResult,
} from "@/lib/routing";
import type { AppState, Coordinates, Facility } from "@/lib/types";
import { Notice, SearchBox, Select } from "./ui";
const CareMap = dynamic(() => import("./care-map"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading interactive map…</div>,
});
export interface Origin extends Coordinates {
  source: "demo" | "manual" | "device";
  accuracy?: number;
}
export const FacilityIcon = ({
  type,
  size = 20,
}: {
  type: Facility["type"];
  size?: number;
}) =>
  type === "hospital" ? (
    <Hospital size={size} />
  ) : type === "clinic" ? (
    <Stethoscope size={size} />
  ) : (
    <Building2 size={size} />
  );

export function Explore({
  state,
  origin,
  setOrigin,
  destination,
  onCloseRoute,
  offline,
  tilesDisabled,
  backLabel = "Back to facilities",
}: {
  state: AppState;
  origin?: Origin;
  setOrigin: (v: Origin | undefined) => void;
  destination?: string;
  onCloseRoute: () => void;
  offline: boolean;
  tilesDisabled: boolean;
  backLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [service, setService] = useState("");
  const [opening, setOpening] = useState("");
  const [availability, setAvailability] = useState("");
  const [selectedId, setSelected] = useState<string | undefined>(destination);
  const [listOnly, setListOnly] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [recenter, setRecenter] = useState(0);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [providerResult, setProviderResult] = useState<{
    key: string;
    result: RouteResult;
  }>();
  const [routeRetry, setRouteRetry] = useState(0);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const lastRouteRequest = useRef(0);
  const lastRouteRetry = useRef(0);
  const locationRequest = useRef(0);
  const lastDevicePosition = useRef<Coordinates | undefined>(undefined);
  useEffect(() => {
    const requestCounter = locationRequest;
    const cancel = () => {
      requestCounter.current++;
      setLocating(false);
      setLocationMessage("");
    };
    window.addEventListener("ihealth-demo-reset", cancel);
    return () => {
      requestCounter.current++;
      window.removeEventListener("ihealth-demo-reset", cancel);
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const facilities = useMemo(
    () =>
      state.facilities.filter(
        (f) =>
          (!query || f.name.toLowerCase().includes(query.toLowerCase())) &&
          (!type || f.type === type) &&
          (!service || f.services.includes(service)) &&
          (!opening ||
            isScheduledOpen(f, new Date(clock)) === (opening === "open")) &&
          (!availability ||
            facilityAvailability(f, service, clock) === availability),
      ),
    [state.facilities, query, type, service, opening, availability, clock],
  );
  const sorted = useMemo(
    () =>
      origin
        ? [...facilities].sort(
            (a, b) =>
              haversine(origin, a.coordinates) -
              haversine(origin, b.coordinates),
          )
        : facilities,
    [facilities, origin],
  );
  const selected = state.facilities.find(
    (f) => f.id === (destination || selectedId),
  );
  const routeMode = !!destination;
  const endpoint = ROUTE_ENDPOINT;
  const routeKey =
    routeMode && origin && selected
      ? `${origin.lat},${origin.lng}:${selected.id}:${offline}:${routeRetry}`
      : "";
  const route =
    routeMode && origin && selected
      ? providerResult?.key === routeKey
        ? providerResult.result
        : directConnection(origin, selected.coordinates)
      : undefined;
  const loadingRoute = !!(
    routeMode &&
    origin &&
    endpoint &&
    !offline &&
    providerResult?.key !== routeKey
  );
  useEffect(() => {
    if (!routeMode || !origin || !selected || !endpoint || offline) return;
    const controller = new AbortController();
    let active = true;
    const explicitRetry = routeRetry !== lastRouteRetry.current;
    lastRouteRetry.current = routeRetry;
    let timeout: ReturnType<typeof setTimeout>;
    // Avoid repeatedly querying the public service while device location changes.
    const timer = setTimeout(
      () => {
        lastRouteRequest.current = Date.now();
        timeout = setTimeout(() => controller.abort(), 12000);
        routeOrFallback(
          new OsrmRoutingProvider(endpoint),
          origin,
          selected.coordinates,
          controller.signal,
        )
          .then((result) => {
            if (active && !controller.signal.aborted)
              setProviderResult({ key: routeKey, result });
          })
          .catch(() => {
            if (active)
              setProviderResult({
                key: routeKey,
                result: directConnection(origin, selected.coordinates),
              });
          })
          .finally(() => clearTimeout(timeout));
      },
      origin.source === "device" && !explicitRetry
        ? Math.max(0, 15000 - (Date.now() - lastRouteRequest.current))
        : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [routeMode, origin, selected, endpoint, offline, routeKey, routeRetry]);
  useEffect(() => {
    if (!routeMode || origin?.source !== "device" || !navigator.geolocation)
      return;
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        if (p.coords.accuracy > 1000) {
          setLocationMessage(
            "Location accuracy is low. The last usable position is retained; you can choose a manual point.",
          );
          return;
        }
        const position: Origin = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          source: "device",
          accuracy: p.coords.accuracy,
        };
        if (
          lastDevicePosition.current &&
          haversine(lastDevicePosition.current, position) < 0.03
        )
          return;
        lastDevicePosition.current = position;
        setOrigin(position);
      },
      (e) =>
        setLocationMessage(
          e.code === 1
            ? "Location permission denied. Choose a starting point or use the demo location."
            : "Location updates unavailable. Manual and demo starting points remain available.",
        ),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [routeMode, origin?.source, setOrigin]);
  function locate() {
    const request = ++locationRequest.current;
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage(
        "This browser does not support geolocation. Choose a manual or demo starting point.",
      );
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (request !== locationRequest.current) return;
        setLocating(false);
        if (p.coords.accuracy > 1000) {
          setLocationMessage(
            "This position is too inaccurate for the demo (over 1 km). Try again or choose a manual point.",
          );
          return;
        }
        const next: Origin = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          source: "device",
          accuracy: p.coords.accuracy,
        };
        lastDevicePosition.current = next;
        setOrigin(next);
        setRecenter((v) => v + 1);
        setLocationMessage(
          haversine(next, CITY_CENTER) > 50
            ? "Your device is far from the demonstration area. Your location was kept. Use Demo Location to explore Isabela City."
            : `Device position selected, approximately ±${Math.round(p.coords.accuracy)} m. Not saved or shared with staff. Opening directions sends coordinates to the road-routing service.`,
        );
      },
      (e) => {
        if (request !== locationRequest.current) return;
        setLocating(false);
        setLocationMessage(
          e.code === 1
            ? "Location permission denied. Choose a starting point or use the demo location."
            : e.code === 3
              ? "Location request timed out. Try again or use a demo starting point."
              : "Location unavailable. Manual and demo selection are available.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }
  const selectOrigin = useCallback(
    (point: Coordinates) => {
      setOrigin({ ...point, source: "manual" });
      setChoosing(false);
      setLocationMessage("Manual starting point selected.");
    },
    [setOrigin],
  );
  const onTileError = useCallback(() => setTileError(true), []);
  const clearFilters = () => {
    setQuery("");
    setType("");
    setService("");
    setOpening("");
    setAvailability("");
    setSelected(undefined);
  };
  const visibleSelection =
    routeMode || facilities.some((f) => f.id === selectedId)
      ? selected
      : undefined;
  return (
    <section className="explore-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="tiny-dot" /> ISABELA CITY, BASILAN
          </div>
          <h1>
            {routeMode ? "Referral directions" : "Explore care facilities"}
          </h1>
          <p>
            {routeMode
              ? "Check the confirmed plan before making travel arrangements."
              : "Explore facilities and services. Your referring facility coordinates the plan."}
          </p>
        </div>
        {routeMode ? (
          <button className="button secondary" onClick={onCloseRoute}>
            <ArrowLeft size={17} /> {backLabel}
          </button>
        ) : (
          <span className="area-badge">
            <MapPin size={15} /> Fictional sites · real map
          </span>
        )}
      </div>
      <div className="explore-toolbar">
        <SearchBox
          value={query}
          onChange={(v) => {
            setQuery(v);
            setSelected(undefined);
          }}
          label="Search facilities"
          placeholder="Search facilities by name…"
        />
        <Select
          label="Facility type"
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setSelected(undefined);
          }}
        >
          <option value="">All facility types</option>
          {Object.entries(TYPE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Service"
          value={service}
          onChange={(e) => {
            setService(e.target.value);
            setSelected(undefined);
          }}
        >
          <option value="">All services</option>
          {state.services.map((s) => (
            <option value={s.id} key={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <button
          className={`button secondary filter-toggle ${expandedFilters ? "active" : ""}`}
          aria-expanded={expandedFilters}
          onClick={() => setExpandedFilters(!expandedFilters)}
        >
          <SlidersHorizontal size={17} /> Filters
          {(opening || availability) && <span className="tiny-dot" />}
        </button>
      </div>
      {expandedFilters && (
        <div className="extra-filters">
          <Select
            label="Scheduled opening"
            value={opening}
            onChange={(e) => {
              setOpening(e.target.value);
              setSelected(undefined);
            }}
          >
            <option value="">Any scheduled opening</option>
            <option value="open">Scheduled open</option>
            <option value="closed">Scheduled closed</option>
          </Select>
          <Select
            label="Reported referral availability"
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
              setSelected(undefined);
            }}
          >
            <option value="">Any reported availability</option>
            <option value="accepting">Accepting referrals</option>
            <option value="not_accepting">Not accepting</option>
            <option value="unknown">Unknown / stale</option>
          </Select>
          <button className="text-button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
      <div className="location-bar">
        <div>
          <MapPin size={17} />
          <span>
            {origin
              ? `${origin.source === "demo" ? "Demo" : origin.source === "device" ? "Device" : "Manual"} starting point selected`
              : "Choose a starting point to see distances"}
          </span>
          {origin && (
            <button
              className="icon-button"
              aria-label="Clear starting point"
              onClick={() => setOrigin(undefined)}
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="location-actions">
          <button
            className="text-button"
            onClick={locate}
            disabled={locating}
            aria-busy={locating}
          >
            <LocateFixed size={15} />
            {locating ? "Locating…" : "Use My Location"}
          </button>
          <button
            className="text-button"
            onClick={() => {
              setOrigin({ ...DEMO_ORIGIN, source: "demo" });
              setLocationMessage(
                "Demo location selected. This is a fictional starting point.",
              );
              setRecenter((v) => v + 1);
            }}
          >
            Use Demo Location
          </button>
        </div>
      </div>
      {locationMessage && <Notice>{locationMessage}</Notice>}
      {(tileError || tilesDisabled) && (
        <Notice tone="warning">
          {tilesDisabled
            ? "Map tiles are disabled by the presentation simulation."
            : "Map tiles could not be loaded. Markers remain interactive; the facility list and referral workflow still work."}{" "}
          No offline map is provided.
        </Notice>
      )}
      <div className={`map-list-layout ${listOnly ? "list-mode" : ""}`}>
        <div className="facility-list">
          <div className="list-title">
            <span>
              {sorted.length} facilities
              {origin ? " · nearest by straight line" : ""}
            </span>
            <div className="view-switch">
              <button
                className={!listOnly ? "active" : ""}
                aria-pressed={!listOnly}
                onClick={() => setListOnly(false)}
              >
                Map
              </button>
              <button
                className={listOnly ? "active" : ""}
                aria-pressed={listOnly}
                onClick={() => setListOnly(true)}
              >
                List
              </button>
            </div>
          </div>
          <div className="facility-scroll">
            {sorted.map((f) => (
              <button
                className={`facility-card ${visibleSelection?.id === f.id ? "selected" : ""}`}
                key={f.id}
                onClick={() => {
                  setSelected(f.id);
                  if (routeMode) onCloseRoute();
                }}
                aria-pressed={visibleSelection?.id === f.id}
              >
                <div className="facility-card-top">
                  <span className={`facility-icon ${f.type}`}>
                    <FacilityIcon type={f.type} />
                  </span>
                  <span>
                    <strong>{f.name}</strong>
                    <small>
                      {TYPE_LABELS[f.type]} <span>· Fictional site</span>
                    </small>
                  </span>
                  <ChevronRight size={17} />
                </div>
                <div className="service-tags">
                  {f.services.map((s) => (
                    <span key={s}>
                      {state.services.find((v) => v.id === s)?.name}
                    </span>
                  ))}
                </div>
                <div className="card-meta">
                  <span
                    className={
                      isScheduledOpen(f, new Date(clock)) ? "open" : "muted"
                    }
                  >
                    <Clock3 size={12} />
                    {isScheduledOpen(f, new Date(clock))
                      ? "Scheduled open"
                      : "Scheduled closed"}
                  </span>
                  <span>
                    {origin
                      ? `${haversine(origin, f.coordinates).toFixed(1)} km straight-line`
                      : "Distance not set"}
                  </span>
                </div>
                <div
                  className={`availability ${facilityAvailability(f, service, clock)}`}
                >
                  <span className="tiny-dot" />
                  {availabilityLabel(facilityAvailability(f, service, clock))}
                  {!service && <small> · varies by service</small>}
                </div>
              </button>
            ))}
            {!sorted.length && (
              <div className="empty">
                <Compass size={26} />
                <h3>No matching facilities</h3>
                <p>Try another service or remove a filter.</p>
                <button className="button secondary" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
          <div className="list-foot">
            <span className="tiny-dot" /> All facilities and availability are
            fictional.
          </div>
        </div>
        {!listOnly && (
          <div className="map-panel">
            <CareMap
              facilities={routeMode && selected ? [selected] : facilities}
              selectedId={visibleSelection?.id}
              onSelect={setSelected}
              origin={origin}
              chooseOrigin={choosing}
              onOrigin={selectOrigin}
              recenter={recenter}
              route={route?.kind === "road" ? route : undefined}
              onTileError={onTileError}
              tilesDisabled={tilesDisabled}
            />
            <div className="map-top-controls">
              <button
                className={`button white ${choosing ? "active" : ""}`}
                onClick={() => setChoosing(!choosing)}
              >
                <MapPin size={15} />
                {choosing ? "Tap map to set start" : "Choose Starting Point"}
              </button>
              <button
                className="icon-button white"
                aria-label="Recenter map"
                onClick={() => setRecenter((v) => v + 1)}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            {choosing && (
              <div className="map-instruction">
                Tap anywhere on the map to choose your starting point.
              </div>
            )}
            <div className="map-legend">
              <span>
                <span className="legend-symbol hospital">+</span> Hospital
              </span>
              <span>
                <span className="legend-symbol health_center">⌂</span> Health
                center
              </span>
              <span>
                <span className="legend-symbol clinic">□</span> Clinic
              </span>
            </div>
            <div className="map-site-label">SYNTHETIC FACILITY LOCATIONS</div>
          </div>
        )}
      </div>
      {visibleSelection && (
        <section
          className="facility-detail panel"
          aria-label="Selected facility details"
        >
          <div className="section-heading">
            <div className="row">
              <span className={`facility-icon ${visibleSelection.type}`}>
                <FacilityIcon type={visibleSelection.type} />
              </span>
              <div>
                <h2>{visibleSelection.name}</h2>
                <p>{visibleSelection.addressLabel}</p>
              </div>
            </div>
            {!routeMode && (
              <button
                className="icon-button"
                aria-label="Close facility details"
                onClick={() => setSelected(undefined)}
              >
                <X size={20} />
              </button>
            )}
          </div>
          <span className="badge neutral">
            Fictional site · synthetic coordinates
          </span>
          <div className="detail-grid">
            <div>
              <h3>Service details</h3>
              {visibleSelection.services.map((s) => {
                const report = visibleSelection.serviceAvailability.find(
                  (a) => a.serviceId === s,
                );
                return (
                  <div className="service-report" key={s}>
                    <strong>
                      {state.services.find((v) => v.id === s)?.name}
                    </strong>
                    <span
                      className={`availability ${availabilityStatus(report, clock)}`}
                    >
                      {availabilityLabel(availabilityStatus(report, clock))}
                    </span>
                    <small>
                      Reported {report ? dateTime(report.updatedAt) : "never"} ·{" "}
                      {report &&
                      clock - new Date(report.updatedAt).getTime() > 3600000
                        ? "stale; shown as unknown"
                        : "60-minute demo freshness rule"}
                    </small>
                  </div>
                );
              })}
            </div>
            <div>
              <h3>Before you visit</h3>
              <p>
                <Clock3 size={15} />{" "}
                {isScheduledOpen(visibleSelection, new Date(clock))
                  ? "Scheduled open"
                  : "Scheduled closed"}{" "}
                · Asia/Manila
              </p>
              <p>
                {visibleSelection.hours.length
                  ? visibleSelection.hours
                      .map(
                        (h) =>
                          `${h.days.length === 7 ? "Every day" : "Selected weekdays"} ${h.open}–${h.close}${h.open > h.close ? " (overnight)" : ""}`,
                      )
                      .join("; ")
                  : "Closed in the demonstration schedule"}
              </p>
              <p>Contact: demo only · no real phone number</p>
              <p>
                Opening hours do not guarantee a doctor or an accepted referral.
                Browsing does not book a visit.
              </p>
              {origin && (
                <strong>
                  {haversine(origin, visibleSelection.coordinates).toFixed(2)}{" "}
                  km · Straight-line distance
                </strong>
              )}
            </div>
          </div>
          {routeMode ? (
            <div
              className="route-summary"
              aria-live="polite"
              aria-busy={loadingRoute}
            >
              <Navigation size={23} />
              <div>
                <h3>
                  {!origin
                    ? "Choose a starting point for road directions"
                    : offline
                      ? "Road routing needs an internet connection"
                      : loadingRoute
                        ? "Finding a route along the roads…"
                        : route?.kind === "road"
                          ? `${route.distanceKm.toFixed(2)} km road distance · ${Math.round(route.durationMinutes)} min estimated driving`
                          : "Road route unavailable"}
                </h3>
                <p>
                  {route?.kind === "road"
                    ? "The blue line follows mapped roads for driving. Time is an estimate without live traffic. Fictional destinations may be reached at the nearest mapped road."
                    : loadingRoute
                      ? "Looking up the road network. A route line appears only after a road route is returned."
                      : "Use My Location, choose a starting point, or use the demo location. If a road route cannot be found, try again or open Google Maps."}
                </p>
                <p>
                  Device location updates only while this screen is open. No
                  guaranteed background tracking; location is not shared with
                  staff.
                </p>
                {route?.kind === "road" &&
                  (route.startOffsetMeters || 0) > 25 && (
                    <p className="small">
                      The route starts on a mapped road about{" "}
                      {Math.round(route.startOffsetMeters!)} m from your
                      selected point.
                    </p>
                  )}
                {route?.kind === "road" &&
                  (route.destinationOffsetMeters || 0) > 25 && (
                    <p className="small">
                      The road ends about{" "}
                      {Math.round(route.destinationOffsetMeters!)} m from the
                      fictional facility pin. No off-road connection is drawn.
                    </p>
                  )}
                <p className="small">
                  Directions send only starting and destination coordinates to
                  the routing service.{" "}
                  <a
                    href="https://project-osrm.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OSRM
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://routing.openstreetmap.de/about.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    FOSSGIS
                  </a>{" "}
                  · ©{" "}
                  <a
                    href="https://www.openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                  >
                    OpenStreetMap
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://www.openstreetmap.org/fixthemap"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fix the map
                  </a>
                </p>
                {origin &&
                  !offline &&
                  !loadingRoute &&
                  route?.kind !== "road" && (
                    <button
                      className="button secondary"
                      onClick={() => setRouteRetry((value) => value + 1)}
                    >
                      Retry road route
                    </button>
                  )}
              </div>
            </div>
          ) : (
            <button
              className="button primary"
              onClick={() => {
                setSelected(visibleSelection.id);
                window.dispatchEvent(
                  new CustomEvent("demo-directions", {
                    detail: visibleSelection.id,
                  }),
                );
              }}
            >
              <Navigation size={16} /> View directions
            </button>
          )}
          <div className="row wrap">
            <a
              className="button secondary"
              href={googleDirections(visibleSelection.coordinates, origin)}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps <ArrowUpRight size={16} />
            </a>
            <span className="muted small">
              Opens external directions to synthetic coordinates. No patient
              data included.
            </span>
          </div>
        </section>
      )}
      <div className="explore-note">
        <span className="note-icon">
          <Compass size={21} />
        </span>
        <div>
          <strong>A clearer path, one confirmed step at a time.</strong>
          <p>
            Facility discovery helps you explore options. Your care team reviews
            suitability and confirms your referral plan.
          </p>
        </div>
      </div>
    </section>
  );
}
