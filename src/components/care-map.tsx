"use client";
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { CITY_CENTER, TILE_URL, TILE_ATTRIBUTION } from "@/lib/config";
import type { Coordinates, Facility } from "@/lib/types";
import type { RoadRoute } from "@/lib/routing";
import { haversine } from "@/lib/facilities";
export interface CareMapProps {
  facilities: Facility[];
  selectedId?: string;
  onSelect: (id: string) => void;
  origin?: Coordinates;
  chooseOrigin: boolean;
  onOrigin: (v: Coordinates) => void;
  recenter: number;
  route?: RoadRoute;
  onTileError: () => void;
  tilesDisabled?: boolean;
}
const markerIcon = (type: Facility["type"], selected: boolean) =>
  L.divIcon({
    className: "care-marker-wrap",
    html: `<span class="care-marker ${type} ${selected ? "selected" : ""}">${type === "hospital" ? '<svg viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/></svg>' : type === "health_center" ? '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v11H3Z"/><path d="M12 9v8m-4-4h8"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M3 7h18v14H3Zm5 0V3h8v4m-4 4v7m-3-3h6"/></svg>'}</span>`,
    iconSize: [42, 48],
    iconAnchor: [21, 44],
  });
const originIcon = L.divIcon({
  className: "origin-marker",
  html: "<span></span>",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});
function Controller({
  facilities,
  selectedId,
  origin,
  chooseOrigin,
  onOrigin,
  recenter,
  route,
}: CareMapProps) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      if (chooseOrigin) onOrigin({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  useEffect(() => {
    const selected = facilities.find((f) => f.id === selectedId);
    if (route) {
      map.fitBounds(
        L.latLngBounds(
          route.geometry.map((p) => [p.lat, p.lng] as [number, number]),
        ),
        { padding: [55, 55], maxZoom: 15 },
      );
    } else if (selected) {
      map.setView(selected.coordinates, 15, { animate: false });
    } else if (
      facilities.length &&
      (!origin || haversine(origin, CITY_CENTER) < 50)
    ) {
      const points = facilities.map((f) => f.coordinates);
      if (origin) points.push(origin);
      map.fitBounds(L.latLngBounds(points), {
        paddingTopLeft: [48, 65],
        paddingBottomRight: [48, 65],
        maxZoom: 14,
        animate: false,
      });
    } else {
      map.setView(origin || CITY_CENTER, 14, { animate: false });
    }
  }, [map, selectedId, facilities, origin, recenter, route]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}
export default function CareMap(props: CareMapProps) {
  return (
    <MapContainer
      center={CITY_CENTER}
      zoom={14}
      scrollWheelZoom
      className={`care-map ${props.chooseOrigin ? "choose-origin" : ""}`}
      aria-label="Interactive map of fictional facilities"
    >
      <Controller {...props} />
      {!props.tilesDisabled && (
        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          eventHandlers={{ tileerror: props.onTileError }}
        />
      )}
      {props.tilesDisabled && (
        <div className="map-unavailable">
          Tiles disabled for this presentation. Markers are synthetic; use the
          facility list.
        </div>
      )}
      {props.facilities.map((f) => (
        <Marker
          key={f.id}
          title={`${f.name} · fictional ${f.type.replace("_", " ")}`}
          position={f.coordinates}
          icon={markerIcon(f.type, f.id === props.selectedId)}
          eventHandlers={{
            click: () => {
              if (!props.chooseOrigin) props.onSelect(f.id);
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -36]}>
            {f.name} · fictional site
          </Tooltip>
        </Marker>
      ))}
      {props.origin && (
        <Marker
          position={props.origin}
          icon={originIcon}
          title="Selected starting point"
        >
          <Tooltip>Selected starting point</Tooltip>
        </Marker>
      )}
      {props.route && (
        <Polyline
          className="road-route"
          positions={props.route.geometry.map(
            (p) => [p.lat, p.lng] as [number, number],
          )}
          pathOptions={{
            color: "#245bcc",
            weight: 6,
          }}
        />
      )}
    </MapContainer>
  );
}
