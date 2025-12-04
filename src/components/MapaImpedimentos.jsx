// src/components/MapaImpedimentos.jsx
import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle } from "lucide-react";

import api from "../api/axios";

// --- FIX DO ÍCONE PADRÃO DO LEAFLET (fallback) ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const centerFallback = [-23.5505, -46.6333]; // São Paulo como centro padrão
const defaultZoom = 5;

// === NORMALIZAÇÃO DE SEVERIDADE (vários valores -> ALTO / MEDIO / BAIXO) ===
const SEVERITY_MAP = {
  CRITICO: "ALTO",
  ALTA: "ALTO",
  ALTO: "ALTO",

  MEDIA: "MEDIO",
  MEDIO: "MEDIO",

  BAIXA: "BAIXO",
  BAIXO: "BAIXO",
};

// === CONFIG DE SEVERIDADE (cores/labels) ===
const SEVERITY_CONFIG = {
  ALTO: {
    color: "#F97316", // laranja
    label: "Alto",
  },
  MEDIO: {
    color: "#EAB308", // amarelo
    label: "Médio",
  },
  BAIXO: {
    color: "#22C55E", // verde
    label: "Baixo",
  },
  DEFAULT: {
    color: "#0EA5E9", // azul
    label: "Padrão",
  },
};

function getSeverityKey(severidade) {
  if (!severidade) return null;
  return severidade.toString().trim().toUpperCase();
}

// ===== TIPOS DE IMPEDIMENTO -> EMOJI E LABEL =====
const TIPO_EMOJI_CONFIG = {
  ACIDENTE: {
    emoji: "💥",
    label: "Acidente / Colisão",
  },
  ONIBUS: {
    emoji: "🚌",
    label: "Veículo / Ônibus",
  },
  SAUDE: {
    emoji: "🚑",
    label: "Saúde / Emergência",
  },
  OBRA: {
    emoji: "🚧",
    label: "Obra / Manutenção",
  },
  OUTRO: {
    emoji: "⚠️",
    label: "Outro tipo de impedimento",
  },
};

function normalizarTipo(imp) {
  const base = imp?.tipo || imp?.motivo || imp?.descricao || "";
  const t = base.toString().toUpperCase();

  if (
    t.includes("ACIDENTE") ||
    t.includes("COLISAO") ||
    t.includes("COLISÃO") ||
    t.includes("BATIDA")
  ) {
    return "ACIDENTE";
  }

  if (
    t.includes("ÔNIBUS") ||
    t.includes("ONIBUS") ||
    t.includes("VEICULO") ||
    t.includes("VEÍCULO") ||
    t.includes("TRANSPORTE")
  ) {
    return "ONIBUS";
  }

  if (
    t.includes("SAUDE") ||
    t.includes("SAÚDE") ||
    t.includes("MEDICO") ||
    t.includes("MÉDICO") ||
    t.includes("URGENCIA") ||
    t.includes("URGÊNCIA") ||
    t.includes("EMERGENCIA") ||
    t.includes("EMERGÊNCIA")
  ) {
    return "SAUDE";
  }

  if (
    t.includes("OBRA") ||
    t.includes("MANUTENCAO") ||
    t.includes("MANUTENÇÃO") ||
    t.includes("INTERDICAO") ||
    t.includes("INTERDIÇÃO")
  ) {
    return "OBRA";
  }

  return "OUTRO";
}

function getTipoMeta(imp) {
  const key = normalizarTipo(imp);
  return TIPO_EMOJI_CONFIG[key] || TIPO_EMOJI_CONFIG.OUTRO;
}

// 🔥 Cria ícone de marker em SVG MAIOR, com cor (severidade) e emoji (tipo)
function createMarkerIcon(color, emoji) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="52" height="72" viewBox="0 0 24 24">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.8" stdDeviation="1.8" flood-color="rgba(15,23,42,0.45)" />
        </filter>
      </defs>
      <path filter="url(#shadow)" fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3.7" fill="white"/>
      <text x="12" y="10.2" text-anchor="middle" font-size="10.5" dominant-baseline="middle">
        ${emoji || ""}
      </text>
    </svg>
  `;

  const encoded = encodeURIComponent(svg.trim());

  return L.icon({
    iconUrl: `data:image/svg+xml,${encoded}`,
    iconSize: [54, 70],
    iconAnchor: [22, 58],
    popupAnchor: [0, -54],
    shadowUrl: markerShadow,
    shadowSize: [50, 50],
    shadowAnchor: [16, 48],
  });
}

export default function MapaImpedimentos({ onSelect, selectedId }) {
  const [impedimentos, setImpedimentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  // filtro de severidade: null | "ALTO" | "MEDIO" | "BAIXO"
  const [severityFilter, setSeverityFilter] = useState(null);

  const fetchImpedimentosMapa = async () => {
    try {
      setLoading(true);
      const res = await api.get("/impedimentos/mapa");
      const data = Array.isArray(res.data) ? res.data : [];
      console.log("Impedimentos mapa (total):", data.length, data);
      setImpedimentos(data);
    } catch (err) {
      console.error("Erro ao carregar impedimentos no mapa:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpedimentosMapa();
  }, []);

  // lista filtrada pelo filtro de severidade
  const filteredImpedimentos = useMemo(() => {
    if (!severityFilter) return impedimentos;

    return impedimentos.filter((imp) => {
      const sevKeyRaw = getSeverityKey(imp.severidade);
      const normalizedKey = sevKeyRaw
        ? SEVERITY_MAP[sevKeyRaw] || sevKeyRaw
        : null;
      return normalizedKey === severityFilter;
    });
  }, [impedimentos, severityFilter]);

  // centro inicial baseado em todos os impedimentos
  const initialCenter = useMemo(() => {
    const valido = impedimentos.find((i) => {
      const lat = parseFloat(i.latitude);
      const lng = parseFloat(i.longitude);
      return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    });

    if (valido) {
      return [parseFloat(valido.latitude), parseFloat(valido.longitude)];
    }
    return centerFallback;
  }, [impedimentos]);

  // fit nos pontos de uma lista
  const fitToPoints = (lista) => {
    if (!mapInstance) return;

    const validPoints = lista
      .map((i) => {
        const lat = parseFloat(i.latitude);
        const lng = parseFloat(i.longitude);
        if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
        return [lat, lng];
      })
      .filter(Boolean);

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(validPoints);
      mapInstance.flyToBounds(bounds, {
        padding: [48, 48],
        duration: 0.6,
      });
    } else {
      mapInstance.flyTo(centerFallback, defaultZoom, { duration: 0.6 });
    }
  };

  // quando clicar no filtro, além de filtrar, leva o mapa até os pontos
  const handleFilterClick = (level) => {
    const newFilter = severityFilter === level ? null : level;
    setSeverityFilter(newFilter);

    if (!mapInstance) return;

    if (newFilter === null) {
      // todos
      fitToPoints(impedimentos);
    } else {
      const list = impedimentos.filter((imp) => {
        const sevKeyRaw = getSeverityKey(imp.severidade);
        const normalizedKey = sevKeyRaw
          ? SEVERITY_MAP[sevKeyRaw] || sevKeyRaw
          : null;
        return normalizedKey === newFilter;
      });
      fitToPoints(list);
    }
  };

  const handleResetView = () => {
    if (!mapInstance) return;
    mapInstance.flyTo(initialCenter, defaultZoom, { duration: 0.6 });
  };

  const handleZoomToAll = () => {
    if (!mapInstance) return;
    const baseList = severityFilter ? filteredImpedimentos : impedimentos;
    fitToPoints(baseList);
  };

  const getFilterButtonClasses = (level) => {
    const isActive = severityFilter === level;
    return [
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
      isActive
        ? "bg-slate-900 text-white border-slate-900"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
    ].join(" ");
  };

  // 🔎 Quando o selectedId mudar (clique na tabela), leva o mapa até o ponto
  useEffect(() => {
    if (!mapInstance || !selectedId) return;

    const imp = impedimentos.find((i) => i.id === selectedId);
    if (!imp) return;

    const lat = parseFloat(imp.latitude);
    const lng = parseFloat(imp.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    mapInstance.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [selectedId, mapInstance, impedimentos]);

  return (
    <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
      {/* Cabeçalho flutuante com filtros */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 bg-white/95 backdrop-blur-sm flex flex-wrap gap-3 items-center justify-between z-[10]">
        <div>
          <p className="text-xs font-semibold text-slate-800">
            Mapa de Impedimentos
          </p>
          <p className="text-[11px] text-slate-500">
            Visualize impedimentos por severidade e tipo no trajeto.
          </p>
        </div>

        {/* Filtros de severidade em chip */}
        <div className="flex flex-wrap gap-2 text-[11px] items-center">
          <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">
            Severidade:
          </span>
          <button
            type="button"
            onClick={() => handleFilterClick(null)}
            className={getFilterButtonClasses(null)}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick("ALTO")}
            className={getFilterButtonClasses("ALTO")}
          >
            Alto
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick("MEDIO")}
            className={getFilterButtonClasses("MEDIO")}
          >
            Médio
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick("BAIXO")}
            className={getFilterButtonClasses("BAIXO")}
          >
            Baixo
          </button>
        </div>
      </div>

      {/* Corpo: mapa ocupa o restante */}
      <div className="flex-1 relative">
        {/* Botões de zoom / visão inicial */}
        <div className="absolute left-3 bottom-3 z-[1000] flex flex-col gap-1">
          <button
            type="button"
            onClick={handleResetView}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm hover:bg-slate-50 transition"
          >
            Visão inicial
          </button>

          {impedimentos.length > 0 && (
            <button
              type="button"
              onClick={handleZoomToAll}
              className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition"
            >
              Enquadrar impedimentos
            </button>
          )}
        </div>

        {/* Legenda de severidade */}
        <div className="absolute z-[20] top-3 right-3 flex flex-col gap-1 px-3 py-2 rounded-xl bg-white/90 backdrop-blur border border-slate-200 shadow-sm text-[11px] text-slate-600 max-w-[260px]">
          <span className="font-semibold text-[10px] tracking-wide text-slate-500 uppercase">
            Severidade
          </span>
          <div className="flex flex-wrap gap-1.5">
            {["ALTO", "MEDIO", "BAIXO"].map((key) => {
              const cfg = SEVERITY_CONFIG[key];
              return (
                <div
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-[2px] bg-slate-50/80"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="text-[10px]">{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda de tipos */}
        <div className="absolute z-[20] bottom-3 right-3 flex flex-col gap-1 px-3 py-2 rounded-xl bg-white/90 backdrop-blur border border-slate-200 shadow-sm text-[11px] text-slate-600 max-w-[260px]">
          <span className="font-semibold text-[10px] tracking-wide text-slate-500 uppercase">
            Tipos de impedimento
          </span>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5">
              <span>💥</span>
              <span className="text-[10px]">Acidente / Colisão</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span>🚌</span>
              <span className="text-[10px]">Veículo / Ônibus</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span>🚑</span>
              <span className="text-[10px]">Saúde / Emergência</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span>🚧</span>
              <span className="text-[10px]">Obra / Manutenção</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span>⚠️</span>
              <span className="text-[10px]">Outros</span>
            </span>
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/70 text-slate-500 text-xs gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            Carregando mapa de impedimentos...
          </div>
        )}

        <MapContainer
          center={initialCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
          className="z-0"
          whenCreated={setMapInstance}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

          {filteredImpedimentos.map((imp) => {
            const latNum = parseFloat(imp.latitude);
            const lngNum = parseFloat(imp.longitude);
            const hasValid =
              !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;

            const position = hasValid ? [latNum, lngNum] : centerFallback;
            const isSelected = selectedId === imp.id;

            const sevKeyRaw = getSeverityKey(imp.severidade);
            const normalizedKey = sevKeyRaw
              ? SEVERITY_MAP[sevKeyRaw] || sevKeyRaw
              : null;

            const severityCfg =
              (normalizedKey && SEVERITY_CONFIG[normalizedKey]) ||
              SEVERITY_CONFIG.DEFAULT;

            const tipoMeta = getTipoMeta(imp);
            const icon = createMarkerIcon(severityCfg.color, tipoMeta.emoji);

            const motivoFormatado =
              imp.motivo?.replace(/_/g, " ") || "Motivo não informado";

            return (
              <Marker
                key={imp.id}
                position={position}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    if (onSelect) onSelect(imp.id);
                  },
                }}
              >
                <Popup>
                  <div className="text-[13px] md:text-[14px] leading-snug">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5 text-[15px] md:text-[16px]">
                      <span>{tipoMeta.emoji}</span>
                      <span>{motivoFormatado}</span>
                    </p>

                    <p className="mt-2 text-[12px] md:text-[13px] text-slate-600 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full bg-slate-100 text-[11px] md:text-[12px] text-slate-700">
                        <span>{tipoMeta.emoji}</span>
                        <span>{tipoMeta.label}</span>
                      </span>
                    </p>

                    <p className="mt-2 text-[12px] md:text-[13px] text-slate-600 flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full border text-[11px] md:text-[12px]"
                        style={{
                          borderColor: severityCfg.color,
                          backgroundColor: "#F9FAFB",
                          color: "#0F172A",
                        }}
                      >
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: severityCfg.color }}
                        />
                        {imp.severidade || "—"}
                      </span>
                      <span>•</span>
                      {imp.ocorridoEm
                        ? new Date(imp.ocorridoEm).toLocaleString("pt-BR")
                        : "—"}
                    </p>

                    {imp.descricao && (
                      <p className="mt-3 text-[13px] md:text-[14px] text-slate-700">
                        {imp.descricao}
                      </p>
                    )}

                    {isSelected && (
                      <p className="mt-3 text-[12px] md:text-[13px] text-emerald-600 font-medium">
                        (Impedimento selecionado)
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {!loading && impedimentos.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500 text-sm bg-white/70">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Nenhum ponto de impedimento para exibir no mapa.</span>
          </div>
        )}
      </div>
    </div>
  );
}
