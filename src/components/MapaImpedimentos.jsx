import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Bus,
  Hospital,
  TriangleAlert,
  Construction,
  AlertOctagon,
} from "lucide-react";

import ReactDOMServer from "react-dom/server";
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

const centerFallback = [-23.5505, -46.6333]; // São Paulo
const defaultZoom = 5;

const SEVERITY_CONFIG = {
  ALTO: {
    color: "#FF5E5E", 
    iconColor: "#FFFFFF", 
    label: "Alto",
  },
  MEDIO: {
    color: "#F2CB52", 
    iconColor: "#7C2D12", 
    label: "Médio",
  },
  BAIXO: {
    color: "#53ADDD", 
    iconColor: "#FFFFFF", 
    label: "Baixo",
  },
  DEFAULT: {
    color: "#F2CB52",
    iconColor: "#111827",
    label: "Indefinido",
  },
};

// ===== TIPOS DE IMPEDIMENTO -> COMPONENTE LUCIDE + EMOJI + LABEL =====
const TIPO_META_CONFIG = {
  ACIDENTE: {
    emoji: "💥",
    icon: TriangleAlert,
    label: "Acidente / Colisão",
  },
  ONIBUS: {
    emoji: "🚌",
    icon: Bus,
    label: "Veículo / Ônibus",
  },
  SAUDE: {
    emoji: "🚑",
    icon: Hospital,
    label: "Saúde / Emergência",
  },
  OBRA: {
    emoji: "🚧",
    icon: Construction,
    label: "Obra / Manutenção",
  },
  OUTRO: {
    emoji: "⚠️",
    icon: AlertOctagon,
    label: "Outro tipo de impedimento",
  },
};

// Remove acentos
function normalizeString(value) {
  return value
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Decide o nível de severidade independente do formato que vier do backend
function getSeverityLevel(severidade) {
  if (!severidade) return null;

  const s = normalizeString(severidade);

  if (
    s.includes("CRITICO") ||
    s.includes("CRITICA") ||
    s.includes("ALTO") ||
    s.includes("ALTA") ||
    s === "3"
  ) {
    return "ALTO";
  }

  if (s.includes("MEDIO") || s.includes("MEDIA") || s === "2") {
    return "MEDIO";
  }

  if (s.includes("BAIXO") || s.includes("BAIXA") || s === "1") {
    return "BAIXO";
  }

  return null;
}

function normalizarTipo(imp) {
  const base = imp?.tipo || imp?.motivo || imp?.descricao || "";
  const t = normalizeString(base);

  if (
    t.includes("ACIDENTE") ||
    t.includes("COLISAO") ||
    t.includes("BATIDA")
  ) {
    return "ACIDENTE";
  }

  if (
    t.includes("ONIBUS") ||
    t.includes("VEICULO") ||
    t.includes("TRANSPORTE") ||
    t.includes("QUEBRA") ||
    t.includes("PANE")
  ) {
    return "ONIBUS";
  }

  if (
    t.includes("SAUDE") ||
    t.includes("MEDICO") ||
    t.includes("URGENCIA") ||
    t.includes("EMERGENCIA") ||
    t.includes("SOCORRO")
  ) {
    return "SAUDE";
  }

  if (
    t.includes("OBRA") ||
    t.includes("MANUTENCAO") ||
    t.includes("INTERDICAO")
  ) {
    return "OBRA";
  }

  return "OUTRO";
}

function getTipoMeta(imp) {
  const key = normalizarTipo(imp);
  return TIPO_META_CONFIG[key] || TIPO_META_CONFIG.OUTRO;
}

// Cria ícone de marker como DIV, com cor (severidade) e SVG do Lucide (via ReactDOMServer)
function createMarkerIcon(bgColor, IconComponent, iconColor) {
  const svgString = ReactDOMServer.renderToString(
    <IconComponent color={iconColor || "#FFFFFF"} size={20} strokeWidth={2} />
  );

  const html = `
    <div
      class="tp-marker"
      style="
        background:${bgColor};
        border-radius:999px;
        width:34px;
        height:34px;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:0 8px 14px rgba(15,23,42,0.35);
        border:2px solid #FFFFFF;
        transform:translateY(-4px);
      "
    >
      ${svgString}
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });
}

/**
 * Controlador do mapa para:
 * - resetar visão
 * - enquadrar todos os pontos visíveis
 */
function MapController({ action, pontos, defaultCenter, defaultZoom }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !action) return;

    if (action.type === "reset") {
      map.flyTo(defaultCenter, defaultZoom, { duration: 0.6 });
      return;
    }

    if (action.type === "fit") {
      const validPoints = pontos
        .map((i) => {
          const lat = parseFloat(i.latitude);
          const lng = parseFloat(i.longitude);
          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null;
          return [lat, lng];
        })
        .filter(Boolean);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        map.flyToBounds(bounds, {
          padding: [48, 48],
          duration: 0.6,
        });
      } else {
        map.flyTo(defaultCenter, defaultZoom, { duration: 0.6 });
      }
    }
  }, [map, action, pontos, defaultCenter, defaultZoom]);

  return null;
}

/**
 * Controlador para focar em um impedimento selecionado (da tabela)
 */
function SelectedImpedimentoController({ selectedId, impedimentos }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedId) return;

    const imp = impedimentos.find((i) => i.id === selectedId);
    if (!imp) return;

    const lat = parseFloat(imp.latitude);
    const lng = parseFloat(imp.longitude);
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

    map.flyTo([lat, lng], 14, { duration: 0.8 });
  }, [map, selectedId, impedimentos]);

  return null;
}

export default function MapaImpedimentos({ onSelect, selectedId }) {
  const [impedimentos, setImpedimentos] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtro de severidade: null | "ALTO" | "MEDIO" | "BAIXO"
  const [severityFilter, setSeverityFilter] = useState(null);
  // ação do mapa (reset / fit)
  const [mapAction, setMapAction] = useState(null);

  const fetchImpedimentosMapa = async () => {
    try {
      setLoading(true);
      const res = await api.get("/impedimentos/mapa");
      const data = Array.isArray(res.data) ? res.data : [];
      console.log("Impedimentos mapa (total):", data.length, data);
      console.log(
        "Severidades distintas:",
        [...new Set(data.map((i) => i.severidade))]
      );
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

  const filteredImpedimentos = useMemo(() => {
    if (!severityFilter) return impedimentos;

    return impedimentos.filter((imp) => {
      const level = getSeverityLevel(imp.severidade);
      return level === severityFilter;
    });
  }, [impedimentos, severityFilter]);

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

  const handleFilterClick = (level) => {
    const newFilter = severityFilter === level ? null : level;
    setSeverityFilter(newFilter);

    // sempre que mudar filtro, já dispara um "fit" nos pontos visíveis
    setMapAction({
      type: "fit",
      ts: Date.now(),
    });
  };

  const handleResetViewClick = () => {
    setMapAction({
      type: "reset",
      ts: Date.now(),
    });
  };

  const handleZoomToAllClick = () => {
    setMapAction({
      type: "fit",
      ts: Date.now(),
    });
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

  const totalVisiveis = severityFilter
    ? filteredImpedimentos.length
    : impedimentos.length;

  const { BaseLayer } = LayersControl;

  return (
    <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
      {/* Cabeçalho flutuante com filtros */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 bg-white/95 backdrop-blur-sm flex flex-wrap gap-3 items-center justify-between z-[10]">
        <div>
          <p className="text-2xl font-semibold text-slate-800">
            Mapa de Impedimentos
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
            onClick={handleResetViewClick}
            className="text-[16px] px-2.5 py-1 rounded-lg bg-white/95 border border-slate-200 shadow-sm hover:bg-slate-50 transition"
          >
            Visão inicial
          </button>

          {totalVisiveis > 0 && (
            <button
              type="button"
              onClick={handleZoomToAllClick}
              className="text-[16px] px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition"
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
        >
          {/* Controladores imperativos do mapa */}
          <MapController
            action={mapAction}
            pontos={severityFilter ? filteredImpedimentos : impedimentos}
            defaultCenter={initialCenter}
            defaultZoom={defaultZoom}
          />
          <SelectedImpedimentoController
            selectedId={selectedId}
            impedimentos={impedimentos}
          />

          {/* CONTROLE DE LAYERS */}
          <LayersControl position="topright">
            {/* Mapa claro padrão */}
            <BaseLayer checked name="Mapa claro (OSM)">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
            </BaseLayer>

            {/* Mapa estilo Carto Voyager */}
            <BaseLayer name="Mapa Voyager (Carto)">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap &copy; CartoDB"
              />
            </BaseLayer>
          </LayersControl>

          {/* Marcadores */}
          {filteredImpedimentos.map((imp) => {
            const latNum = parseFloat(imp.latitude);
            const lngNum = parseFloat(imp.longitude);
            const hasValid =
              !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;

            const position = hasValid ? [latNum, lngNum] : centerFallback;
            const isSelected = selectedId === imp.id;

            const level = getSeverityLevel(imp.severidade);
            const severityCfg =
              (level && SEVERITY_CONFIG[level]) || SEVERITY_CONFIG.DEFAULT;

            const tipoMeta = getTipoMeta(imp);
            const IconComponent = tipoMeta.icon || AlertOctagon;

            const icon = createMarkerIcon(
              severityCfg.color, // fundo
              IconComponent,
              severityCfg.iconColor // cor do ícone
            );

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
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full bg-slate-100 text-[11px] md:text-[12px] text-slate-700"
                      >
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
