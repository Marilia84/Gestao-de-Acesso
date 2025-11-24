// src/components/GoogleMapaRota.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";
const GOOGLE_LIBRARIES = ["places"];
const containerStyle = { width: "100%", height: "100%" };

const polylineOptions = {
  strokeColor: "#9ebd8d",
  strokeOpacity: 0.9,
  strokeWeight: 5,
};

function normalizaCoord(n) {
  if (n == null) return null;
  if (typeof n === "number") return n;
  if (typeof n === "string") return Number(n.replace(",", "."));
  return null;
}

export default function GoogleMapaRota({
  pontos = [],
  height = 300,
  followRoads = true,
}) {
  // ⚠️ Todos os hooks no topo (SEM condicionais)
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: ["places"],
    language: "pt-BR",
    region: "BR",
  });

  const mapRef = useRef(null);
  const [directions, setDirections] = useState(null);
  const [directionsError, setDirectionsError] = useState(null);

  // Centro padrão (Brasília) quando não há pontos
  const defaultCenter = useMemo(
    () => ({ lat: -15.7801, lng: -47.9292 }),
    []
  );

  const center = useMemo(() => {
    if (pontos && pontos.length > 0) {
      const p0 = pontos[0];
      if (Number.isFinite(p0?.lat) && Number.isFinite(p0?.lng)) {
        return { lat: Number(p0.lat), lng: Number(p0.lng) };
      }
    }
    return defaultCenter;
  }, [pontos, defaultCenter]);

  const markerPositions = useMemo(() => {
    return (pontos || [])
      .filter(p => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
      .map(p => ({ lat: Number(p.lat), lng: Number(p.lng), nome: p.nome, ordem: p.ordem }));
  }, [pontos]);


  // Calcula rotas pelas vias (DirectionsService) só quando isLoaded e houver 2+ pontos
  useEffect(() => {
    setDirections(null);
    setDirectionsError(null);

    if (!isLoaded) return;
    if (!followRoads) return;
    if (!markerPositions || markerPositions.length < 2) return;

    const svc = new window.google.maps.DirectionsService();

    // Estratégia: quebrar em legs sequenciais (p0->p1, p1->p2, ...)
    async function buildDirections() {
      try {
        const legs = [];
        for (let i = 0; i < markerPositions.length - 1; i++) {
          /* eslint no-await-in-loop: "off" */
          const origem = markerPositions[i];
          const destino = markerPositions[i + 1];

          const result = await svc.route({
            origin: origem,
            destination: destino,
            travelMode: window.google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: false,
            // Você pode ajustar o avoid (ex.: avoidTolls/Highways) se precisar
          });

          // O DirectionsRenderer aceita um único objeto. Para várias legs,
          // vamos concatenar as polylines manualmente abaixo usando Polyline.
          legs.push(result.routes[0].overview_path);
        }

        // Concatena todas as legs em um único array de LatLng
        const path = legs.flat();
        // Transforma em {lat, lng}
        const merged = path.map(ll => ({ lat: ll.lat(), lng: ll.lng() }));
        setDirections(merged);
      } catch (err) {
        console.error("Directions error:", err);
        setDirectionsError("Falha ao traçar rota pelas vias.");
      }
    }

    buildDirections();
  }, [isLoaded, followRoads, markerPositions]);

  // Ajusta bounds para caber todos os marcadores (ou a polyline das vias)
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const map = mapRef.current;
    const bounds = new window.google.maps.LatLngBounds();

    let added = false;

    if (directions && directions.length > 0) {
      directions.forEach(pt => bounds.extend(pt));
      added = true;
    } else if (markerPositions.length > 0) {
      markerPositions.forEach(pt => bounds.extend(pt));
      added = true;
    }

    if (added) {
      map.fitBounds(bounds, 64); // padding
    }
  }, [isLoaded, directions, markerPositions]);

  // --- Renderização (após todos os hooks) ---

  if (loadError) {
    return (
      <div
        style={{ height }}
        className="grid place-items-center bg-red-50 text-red-600 text-xs rounded"
      >
        Erro ao carregar Google Maps.
      </div>
    );
  }
  const createMarkerIcon = (color = "#038C3E") => {
    return {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
        <svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
          <path d="M23 0C13 0 5 8 5 18c0 11 15 28 18 28s18-17 18-28C41 8 33 0 23 0z" 
                fill="${color}"  stroke-width="3"/>
        </svg>`),
      scaledSize: new window.google.maps.Size(38, 38),
      anchor: new window.google.maps.Point(19, 38),
      labelOrigin: new window.google.maps.Point(19, 14),
    };
  };
  return (
    <div style={{ height }}>
      {!isLoaded ? (
        <div className="grid place-items-center h-full text-xs text-gray-500">
          Carregando mapa...
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%", borderRadius: 12 }}
          center={center}
          zoom={12}
          onLoad={(map) => (mapRef.current = map)}
          options={{
            disableDefaultUI: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: true,
            gestureHandling: "greedy",
            styles: [], // se quiser um tema aqui
          }}
        >
          {markerPositions.map((pt, idx) => (
            <Marker
              key={`${pt.lat}-${pt.lng}-${idx}`}
              position={{ lat: pt.lat, lng: pt.lng }}
              icon={createMarkerIcon("#038C3E")} // COR DO BALÃO AQUI
              label={{
                text: String(pt.ordem ?? idx + 1),
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              title={pt.nome || `Ponto ${idx + 1}`}
            />
          ))}
          {/* Polyline direta (fallback) quando não usamos rotas pelas vias */}
          {!followRoads && markerPositions.length >= 2 && (
            <Polyline
              path={markerPositions.map(({ lat, lng }) => ({ lat, lng }))}
              options={polylineOptions}
            />
          )}

          {/* Polyline das vias (resultado do DirectionsService) */}
          {followRoads && directions && directions.length > 1 && (
            <Polyline
              path={directions}
              options={polylineOptions}
            />
          )}
        </GoogleMap>
      )}

      {directionsError && (
        <div className="mt-1 text-[11px] text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
          {directionsError}
        </div>
      )}
    </div>
  );
}