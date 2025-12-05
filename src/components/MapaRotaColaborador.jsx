// src/components/MapaRotaColaborador.jsx
import { useEffect, useMemo, useState } from "react";
import ReactDOMServer from "react-dom/server";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
  LayersControl,
  ScaleControl,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import api from "../api/axios";
import Loading from "./Loading";
import "leaflet/dist/leaflet.css";
import { UsersRound } from "lucide-react";

const { BaseLayer, Overlay } = LayersControl;

const LEGEND_ITEMS = [
  { cor: "#53ADDD", faixa: "1 – 5" },
  { cor: "#21BE67", faixa: "6 – 9" },
  { cor: "#FF5E5E", faixa: "10+" },
];

function MapController({ action, pontos, defaultCenter, defaultZoom }) {
  const map = useMap();

  useEffect(() => {
    if (!action || !map) return;

    if (action.type === "reset") {
      map.flyTo(defaultCenter, defaultZoom, { duration: 0.6 });
      return;
    }

    if (action.type === "fitAll" && pontos.length > 0) {
      const bounds = L.latLngBounds(
        pontos.map((p) => [p.latitude, p.longitude])
      );
      map.flyToBounds(bounds, {
        padding: [40, 40],
        duration: 0.6,
      });
      return;
    }

    if (action.type === "focus" && action.pontoId != null) {
      const ponto = pontos.find((p) => p.idPonto === action.pontoId);
      if (!ponto) return;

      map.flyTo([ponto.latitude, ponto.longitude], 16, {
        duration: 0.6,
      });
      return;
    }
  }, [action, pontos, map, defaultCenter, defaultZoom]);

  return null;
}

export default function MapaRotaColaborador() {
  const [pontos, setPontos] = useState([]);
  const [loadingMapa, setLoadingMapa] = useState(true);
  const [errorMapa, setErrorMapa] = useState(null);
  const [selectedPontoId, setSelectedPontoId] = useState(null);

  const [mapAction, setMapAction] = useState(null);

  const [rotas, setRotas] = useState([]);
  const [rotaSelecionada, setRotaSelecionada] = useState("");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("");

  // carrega rotas para o filtro
  useEffect(() => {
    const carregarRotas = async () => {
      try {
        const res = await api.get("/rotas");
        const lista = Array.isArray(res.data) ? res.data : [];
        setRotas(lista);
      } catch (err) {
        console.error("Erro ao carregar rotas para filtro:", err);
      }
    };
    carregarRotas();
  }, []);

  // carrega pontos do mapa
  useEffect(() => {
    const carregarMapa = async () => {
      try {
        setLoadingMapa(true);
        setErrorMapa(null);

        const params = {};
        if (rotaSelecionada) params.idRota = rotaSelecionada;
        if (periodoSelecionado) params.periodo = periodoSelecionado;

        const res = await api.get("/MapasTrackpass/mapaRotaColaborador", {
          params,
        });

        const data = res.data;
        const lista = Array.isArray(data) ? data : [];

        const pontosNormalizados = lista
          .map((p) => ({
            idPonto: p.idPonto,
            nome: p.nome,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            quantidadeColaboradores: Number(p.quantidadeColaboradores ?? 0),
          }))
          .filter(
            (p) =>
              Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
          );

        setPontos(pontosNormalizados);
        setSelectedPontoId(null);
      } catch (err) {
        console.error("❌ Erro ao carregar mapa:", err);

        if (err.response) {
          if (err.response.status === 401 || err.response.status === 403) {
            setErrorMapa(
              `Você não tem permissão para acessar o mapa (erro ${err.response.status}).`
            );
          } else {
            setErrorMapa(
              `Erro ao carregar o mapa (status ${err.response.status}).`
            );
          }
        } else if (err.request) {
          setErrorMapa(
            "Não foi possível conectar ao servidor para carregar o mapa."
          );
        } else {
          setErrorMapa("Não foi possível carregar o mapa de colaboradores.");
        }
      } finally {
        setLoadingMapa(false);
      }
    };

    carregarMapa();
  }, [rotaSelecionada, periodoSelecionado]);

  const defaultCenter = useMemo(
    () => [-20.4303571, -47.8197832],
    []
  );
  const defaultZoom = 5;

  const triggerMapAction = (type, extra = {}) => {
    setMapAction({
      type,
      at: Date.now(),
      ...extra,
    });
  };

  const stats = useMemo(() => {
    if (!pontos.length) return null;
    const totalPontos = pontos.length;
    const totalColabs = pontos.reduce(
      (acc, p) => acc + (p.quantidadeColaboradores || 0),
      0
    );
    const maxColab = Math.max(
      ...pontos.map((p) => p.quantidadeColaboradores || 0)
    );
    return { totalPontos, totalColabs, maxColab };
  }, [pontos]);

  const topPontos = useMemo(() => {
    return [...pontos]
      .sort(
        (a, b) =>
          (b.quantidadeColaboradores || 0) - (a.quantidadeColaboradores || 0)
      )
      .slice(0, 5);
  }, [pontos]);

  const getColorByQuantidade = (qtd) => {
    if (qtd <= 5) return "#53ADDD";
    if (qtd <= 6) return "#21BE67";
    if (qtd <= 10) return "#FF5E5E";
    return "#f97373";
  };

  const getBubbleSize = (qtd) => {
    if (qtd <= 2) return 26;
    if (qtd <= 4) return 32;
    if (qtd <= 6) return 38;
    if (qtd <= 10) return 46;
    return 56;
  };
  const getMarkerIcon = (qtd, isSelected) => {
  const color = getColorByQuantidade(qtd);
  const iconSvg = ReactDOMServer.renderToStaticMarkup(
    <UsersRound size={14} strokeWidth={2} />
  );

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: ${isSelected ? "scale(1.15)" : "scale(1)"};
        transition: transform 160ms ease-out;
      ">
        <!-- GOTA -->
        <div style="
          width: 100%;
          height: 100%;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          display:flex;
          align-items:center;
          justify-content:center;
          position: relative;
        ">
          <!-- Conteúdo dentro da gota -->
          <div style="
            transform: rotate(45deg);
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            color:#fff;
            font-weight:700;
            font-size:12px;
            line-height:1;
          ">
            <div style="width:14px; height:14px; margin-bottom:2px;">${iconSvg}</div>
            ${qtd}
          </div>
        </div>

        <!-- PONTA da gota -->
        <div style="
          position:absolute;
          bottom:-6px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
        "></div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 46],  // A gota se ancora exatamente na ponta
  });
};


  const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  const color = getColorByQuantidade(count);
  const baseSize =
    count < 10 ? 40 :
    count < 50 ? 46 :
    count < 100 ? 50 : 52;

  const outerSize = baseSize;
  const innerSize = baseSize - 6;

  const shadow =
    "0 10px 20px rgba(15,23,42,0.25), 0 0 0 1px rgba(148,163,184,0.45)";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position: relative;
        width: ${outerSize}px;
        height: ${outerSize}px;
        border-radius: 999px;
        background: radial-gradient(circle at 30% 20%, #ffffff, ${color});
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${shadow};
        overflow: hidden;
      ">
        <div style="
          width: ${innerSize}px;
          height: ${innerSize}px;
          border-radius: 999px;
          background: #f9fafb;
          border: 2px solid ${color};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          ">
            ${count}
          </span>
        </div>
      </div>
    `,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
  });
};


  const handleResetView = () => {
    setSelectedPontoId(null);
    triggerMapAction("reset");
  };

  const handleZoomToAllPoints = () => {
    if (!pontos.length) return;
    setSelectedPontoId(null);
    triggerMapAction("fitAll");
  };

  const handleFocusPonto = (ponto) => {
    setSelectedPontoId(ponto.idPonto);
    triggerMapAction("focus", { pontoId: ponto.idPonto });
  };

  const handleLimparFiltros = () => {
    setRotaSelecionada("");
    setPeriodoSelecionado("");
    setSelectedPontoId(null);
  };

  // ESTADOS DE LOADING / ERRO: preenchem todo espaço do pai
  if (loadingMapa) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <Loading size={120} />
      </div>
    );
  }

  if (errorMapa) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <p className="text-sm text-red-500 text-center px-4 whitespace-pre-line">
          {errorMapa}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative overflow-hidden flex flex-col">
      {/* HEADER DO MAPA */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 bg-white/95 backdrop-blur-sm flex flex-wrap gap-3 items-center justify-between z-[10]">
        <div>
          <p className="text-2xl font-semibold text-slate-800">
            Mapa de Colaboradores por Ponto
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[16px] items-center">
          <select
            className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={rotaSelecionada}
            onChange={(e) => setRotaSelecionada(e.target.value)}
          >
            <option value="">Todas as rotas</option>
            {rotas.map((rota) => (
              <option key={rota.idRota} value={rota.idRota}>
                {rota.nome}
              </option>
            ))}
          </select>

          <select
            className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
          >
            <option value="">Todos os períodos</option>
            <option value="MANHA">Manhã</option>
            <option value="TARDE">Tarde</option>
            <option value="NOITE">Noite</option>
          </select>

          <button
            type="button"
            onClick={handleLimparFiltros}
            disabled={!rotaSelecionada && !periodoSelecionado}
            className={`text-[16px] px-2.5 py-1 rounded-lg border transition 
              ${
                !rotaSelecionada && !periodoSelecionado
                  ? "border-slate-200 text-slate-300 cursor-default"
                  : "border-emerald-500/60 text-emerald-700 hover:bg-emerald-600 hover:text-white"
              }`}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* CORPO: MAPA + PAINEL LATERAL */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* MAPA */}
        <div className="relative flex-1">
          {/* botões de ação no canto inferior direito */}
          <div className="absolute right-3 bottom-8 z-[1000] flex flex-col gap-3">
            <button
              type="button"
              onClick={handleResetView}
              className="text-[16px] px-2.5 py-1 rounded-lg bg-white/95 border border-slate-200 shadow-sm hover:bg-slate-50 transition"
            >
              Visão inicial
            </button>

            {pontos.length > 0 && (
              <button
                type="button"
                onClick={handleZoomToAllPoints}
                className="text-[16px] px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition"
              >
                Enquadrar pontos
              </button>
            )}
          </div>

          {/* badge flutuante com resumo rápido */}
          {stats && (
            <div className="absolute right-16 top-3 z-[900] bg-white/95 border border-slate-200 rounded-full px-3 py-1.5 shadow-sm text-[13px] text-slate-600 flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-xl" />
                {stats.totalPontos} pontos
              </span>
              <span className="text-slate-300">-</span>
              <span>{stats.totalColabs} colaboradores</span>
            </div>
          )}

          {pontos.length === 0 && (
            <div className="absolute left-4 top-4 z-[900] bg-white/95 border border-slate-200 rounded-lg px-3 py-2 shadow text-[11px] text-slate-500 max-w-xs">
              Nenhum ponto encontrado com os filtros atuais. Ajuste os filtros
              ou clique em{" "}
              <span className="font-semibold">“Limpar filtros”</span> para ver
              todos os pontos novamente.
            </div>
          )}

          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            minZoom={3}
            maxZoom={18}
            style={{ width: "100%", height: "100%" }}
          >
            {/* controla flyTo / bounds */}
            <MapController
              action={mapAction}
              pontos={pontos}
              defaultCenter={defaultCenter}
              defaultZoom={defaultZoom}
            />

            {/* escala no canto */}
            <ScaleControl position="bottomleft" />

            {/* controle de camadas e estilo do mapa */}
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

              {/* overlay dos pontos */}
              <Overlay checked name="Colaboradores por ponto">
                <MarkerClusterGroup
                  chunkedLoading
                  iconCreateFunction={createClusterCustomIcon}
                >
                  {pontos.map((ponto) => {
                    const isSelected = ponto.idPonto === selectedPontoId;
                    return (
                      <Marker
                        key={ponto.idPonto}
                        position={[ponto.latitude, ponto.longitude]}
                        icon={getMarkerIcon(
                          ponto.quantidadeColaboradores,
                          isSelected
                        )}
                        eventHandlers={{
                          click: () => handleFocusPonto(ponto),
                        }}
                      >
                        <Tooltip
                          direction="top"
                          offset={[0, -4]}
                          opacity={0.9}
                        >
                          <span className="font-semibold text-[11px]">
                            {ponto.nome || "Ponto sem nome"}
                          </span>
                          <br />
                          <span className="text-[10px]">
                            {ponto.quantidadeColaboradores} colaborador(es)
                          </span>
                        </Tooltip>
                        <Popup>
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-800 text-sm">
                              {ponto.nome || "Ponto sem nome"}
                            </p>
                            <p className="text-xs text-slate-600">
                              Colaboradores neste ponto:{" "}
                              <span className="font-semibold">
                                {ponto.quantidadeColaboradores}
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Lat: {ponto.latitude.toFixed(5)} | Lng:{" "}
                              {ponto.longitude.toFixed(5)}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              </Overlay>
            </LayersControl>
          </MapContainer>
        </div>

        {/* PAINEL LATERAL */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 flex flex-col gap-3">
          {/* CART VISÃO GERAL */}
          {pontos.length > 0 && stats && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-3 py-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Visão Geral
                </p>
                <span className="text-[10px] text-slate-400">
                  Atualizado em tempo real
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400">Pontos</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stats.totalPontos}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400">Colaboradores</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stats.totalColabs}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400">Máx. por ponto</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stats.maxColab}
                  </span>
                </div>
              </div>

              {/* mini barra de distribuição geral */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500">
                  Distribuição aproximada por faixa
                </span>
                <div className="flex gap-1 h-1.5">
                  {LEGEND_ITEMS.map((item) => (
                    <div
                      key={item.faixa}
                      className="flex-1 rounded-full"
                      style={{ backgroundColor: item.cor, opacity: 0.9 }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  {LEGEND_ITEMS.map((item) => (
                    <span key={item.faixa}>{item.faixa}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TOP PONTOS */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Top pontos com mais colaboradores
            </p>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {topPontos.map((p, index) => {
                const isSelected = p.idPonto === selectedPontoId;
                const color = getColorByQuantidade(
                  p.quantidadeColaboradores || 0
                );
                const larguraBarra =
                  stats && stats.maxColab
                    ? Math.max(
                        8,
                        (p.quantidadeColaboradores / stats.maxColab) * 100
                      )
                    : 0;

                return (
                  <button
                    key={p.idPonto}
                    type="button"
                    onClick={() => handleFocusPonto(p)}
                    className={`w-full text-left rounded-xl px-2 py-1.5 text-[11px] transition ${
                      isSelected
                        ? "bg-emerald-50 border border-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-slate-800 truncate">
                          {p.nome || "Ponto sem nome"}
                        </span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {p.quantidadeColaboradores}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${larguraBarra}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}

              {topPontos.length === 0 && (
                <p className="text-[11px] text-slate-400">
                  Nenhum ponto encontrado com os filtros atuais.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
