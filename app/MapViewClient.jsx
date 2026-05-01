"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useMemo, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/maplibre";

const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const T = {
  rust: "#C04B2C",
  rustLight: "#E8633E",
  forest: "#2A4D3E",
  forestMid: "#3D6B57",
  ink: "#1C1916",
  inkLight: "#6B6358",
  white: "#FDFAF5",
  parchment: "#EDE6D6",
  sans: "'Outfit', -apple-system, sans-serif",
  serif: "'Cormorant Garamond', Georgia, serif",
};

function boundsFor(points) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

function ZoomBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        border: `1.5px solid ${T.parchment}`,
        background: T.white,
        borderRadius: 10,
        cursor: "pointer",
        fontSize: 20,
        fontWeight: 700,
        color: T.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(28,25,22,0.12)",
        lineHeight: 1,
        fontFamily: T.sans,
      }}
    >
      {label}
    </button>
  );
}

export function MapViewClient({ points, starred, onOpen, onToggle }) {
  const mapRef = useRef(null);
  const hasFittedRef = useRef(false);
  const [selectedId, setSelectedId] = useState(null);

  const selected = useMemo(
    () => points.find((p) => p.id === selectedId) || null,
    [points, selectedId],
  );

  // Fit bounds only on the very first render — never re-zoom on day filter changes.
  useEffect(() => {
    if (!mapRef.current || !points.length || hasFittedRef.current) return;
    hasFittedRef.current = true;

    if (points.length === 1) {
      mapRef.current.flyTo({ center: [points[0].lng, points[0].lat], zoom: 13, duration: 800 });
      return;
    }
    const b = boundsFor(points);
    mapRef.current.fitBounds(
      [[b.minLng, b.minLat], [b.maxLng, b.maxLat]],
      { padding: 52, duration: 900 },
    );
  }, [points]);

  const zoom = (delta) => {
    if (!mapRef.current) return;
    mapRef.current.zoomTo(mapRef.current.getZoom() + delta, { duration: 250 });
  };

  const isStarredFn = (id) => starred?.has?.(id);

  return (
    <div style={{ height: 360, borderRadius: "22px", overflow: "hidden", position: "relative" }}>
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -79.3832, latitude: 43.6532, zoom: 10 }}
        mapStyle={OSM_RASTER_STYLE}
        attributionControl={false}
        reuseMaps
      >
        {points.map((p) => {
          const isStarred = isStarredFn(p.id);
          const isSelected = p.id === selectedId;
          return (
            <Marker
              key={p.id}
              longitude={p.lng}
              latitude={p.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedId(isSelected ? null : p.id);
              }}
            >
              <div
                style={{
                  width: isSelected ? 30 : 22,
                  height: isSelected ? 30 : 22,
                  borderRadius: 999,
                  background: isStarred
                    ? `linear-gradient(135deg, ${T.rust}, ${T.rustLight})`
                    : isSelected
                    ? T.forest
                    : T.forestMid,
                  border: `3px solid ${T.white}`,
                  boxShadow: isStarred
                    ? "0 4px 16px rgba(192,75,44,0.38)"
                    : isSelected
                    ? "0 6px 20px rgba(28,25,22,0.3)"
                    : "0 3px 12px rgba(28,25,22,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.white,
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: "pointer",
                  transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {isStarred ? "★" : "•"}
              </div>
            </Marker>
          );
        })}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="top"
            closeOnClick={false}
            onClose={() => setSelectedId(null)}
            maxWidth="275px"
          >
            <div style={{ fontFamily: T.sans, padding: "2px 0" }}>
              <div
                style={{
                  fontFamily: T.serif,
                  fontWeight: 700,
                  fontSize: 15,
                  color: T.ink,
                  marginBottom: 5,
                  lineHeight: 1.25,
                }}
              >
                {selected.title}
              </div>
              <div style={{ fontSize: 12, color: T.inkLight, lineHeight: 1.4, marginBottom: 8 }}>
                {selected.time} · {selected.start || selected.neighbourhood || "TBA"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  onClick={() => onOpen?.(selected)}
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: T.rust,
                    cursor: "pointer",
                    borderBottom: "1.5px solid rgba(192,75,44,0.3)",
                    paddingBottom: 1,
                    flex: 1,
                  }}
                >
                  View details →
                </div>
                {onToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(selected.id);
                    }}
                    style={{
                      background: isStarredFn(selected.id)
                        ? `linear-gradient(135deg, ${T.rust}, ${T.rustLight})`
                        : T.parchment,
                      border: "none",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      color: isStarredFn(selected.id) ? T.white : T.inkLight,
                      flexShrink: 0,
                      transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                  >
                    {isStarredFn(selected.id) ? "★" : "☆"}
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Zoom controls */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          zIndex: 10,
        }}
      >
        <ZoomBtn label="+" onClick={() => zoom(1)} />
        <ZoomBtn label="−" onClick={() => zoom(-1)} />
      </div>
    </div>
  );
}
