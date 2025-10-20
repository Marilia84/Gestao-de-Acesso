import React, { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

function FitTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (!coords?.length) return;
    if (coords.length === 1) map.setView(coords[0], 15);
    else map.fitBounds(L.latLngBounds(coords), { padding: [16, 16] });
  }, [map, coords]);
  return null;
}

export default function MapaRota({ pontos = [], height = 180 }) {
  const [routeCoords, setRouteCoords] = useState(null); // geometria “snapped” pelas ruas
  const pontosNorm = useMemo(() => {
    return (pontos || [])
      .map(p => {
        const lat = Number(p.lat ?? p.latitude);
        const lng = Number(p.lng ?? p.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { ...p, lat, lng, ordem: p.ordem ?? 9999 };
      })
      .filter(Boolean)
      .sort((a,b) => a.ordem - b.ordem);
  }, [pontos]);

  const coords = useMemo(() => pontosNorm.map(p => [p.lat, p.lng]), [pontosNorm]);

  // Chama OSRM para obter rota “snapped” (sem tempo/distância, só geometria)
  useEffect(() => {
    setRouteCoords(null);
    if (coords.length < 2) return;

    const controller = new AbortController();

    async function fetchRoute() {
      try {
        // OSRM espera "lng,lat" e waypoints separados por ";"
        const waypoints = pontosNorm.map(p => `${p.lng},${p.lat}`).join(";");
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson&steps=false`;

        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        if (data.code !== "Ok" || !data.routes?.[0]?.geometry) {
          console.warn("OSRM não retornou rota. Caindo no fallback (linhas retas).");
          setRouteCoords(null);
          return;
        }

        // GeoJSON vem como [lng, lat]; Leaflet usa [lat, lng]
        const snapped = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        setRouteCoords(snapped);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.warn("Falha no OSRM:", e);
          setRouteCoords(null);
        }
      }
    }

    fetchRoute();
    return () => controller.abort();
  }, [pontosNorm, coords.length]);

  if (!pontosNorm.length) {
    return <div className="text-xs text-gray-500 border rounded-lg p-2">Sem pontos.</div>;
  }

  return (
    <div className="w-full">
      <MapContainer
        style={{ height, width: "100%" }}
        center={coords[0]}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        attributionControl={false}
        className="rounded-xl overflow-hidden"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <FitTo coords={coords} />

        {/* Linha "snapped" (se o OSRM respondeu) */}
        {routeCoords && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: "#2563EB", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
          />
        )}

        {/* Fallback: ligar pontos em linha reta se OSRM falhar */}
        {!routeCoords && coords.length > 1 && (
          <Polyline
            positions={coords}
            pathOptions={{ color: "#2563EB", weight: 4, opacity: 0.7, dashArray: "6 6" }}
          />
        )}

        {/* Marcadores das paradas */}
        {pontosNorm.map((p, i) => (
          <Marker key={p.idPonto ?? i} position={[p.lat, p.lng]}>
            <Popup>
              <div className="font-medium">{p.nome ?? `Ponto ${i + 1}`}</div>
              {p.endereco && <div className="text-xs text-gray-600">{p.endereco}</div>}
              {p.ordem && <div className="text-xs">Ordem: {p.ordem}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
