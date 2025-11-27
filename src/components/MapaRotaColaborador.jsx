import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import api from "../api/axios";
import Loading from "./Loading";
import "leaflet/dist/leaflet.css";

const LEGEND_ITEMS = [
  { cor: "#22c55e", faixa: "0 – 2" },
  { cor: "#a3e635", faixa: "3 – 4" },
  { cor: "#facc15", faixa: "5 – 6" },
  { cor: "#fb923c", faixa: "7 – 10" },
  { cor: "#f97373", faixa: "10+" },
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
    if (qtd <= 2) return "#22c55e";
    if (qtd <= 4) return "#a3e635";
    if (qtd <= 6) return "#facc15";
    if (qtd <= 10) return "#fb923c";
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
    const size = getBubbleSize(qtd);
    const borderColor = color;
    const shadow =
      "0 0 0 1px rgba(148,163,184,0.35), 0 10px 22px rgba(15,23,42,0.2)";
    const background = `${color}33`;

    return L.divIcon({
      className: "",
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:999px;
          background:${background};
          border:2px solid ${borderColor};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:11px;
          font-weight:600;
          color:#0f172a;
          box-shadow:${shadow};
          backdrop-filter: blur(2px);
          opacity:${isSelected ? 1 : 0.9};
          transform:${isSelected ? "scale(1.05)" : "scale(1)"};
          transition:transform 150ms ease-out, opacity 150ms ease-out;
        ">
          ${qtd}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const createClusterCustomIcon = (cluster) => {
    const count = cluster.getChildCount();
    const color = getColorByQuantidade(count);

    const size = getBubbleSize(count) + 8;
    const shadow =
      "0 0 0 1px rgba(148,163,184,0.35), 0 10px 22px rgba(15,23,42,0.2)";
    const background = `${color}33`;

    return L.divIcon({
      className: "",
      html: `
        <div style="
          width:${size}px;
          height:${size}px;
          border-radius:999px;
          background:${background};
          border:2px solid ${color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          font-weight:700;
          color:#0f172a;
          box-shadow:${shadow};
          backdrop-filter: blur(2px);
          opacity:0.96;
        ">
          ${count}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
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

  if (loadingMapa) {
    return (
      <div className="w-full h-[48vh] md:h-[56vh] lg:h-[60vh] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
        <Loading size={120} />
      </div>
    );
  }

  if (errorMapa) {
    return (
      <div className="w-full h-[48vh] md:h-[56vh] lg:h-[60vh] flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-sm text-red-500 text-center px-4 whitespace-pre-line">
          {errorMapa}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(92vh-180px)] rounded-xl border border-slate-200 bg-white relative overflow-hidden flex flex-col">
      <div className="px-4 pt-3 pb-2 border-b border-slate-200 bg-white/95 backdrop-blur-sm flex flex-wrap gap-3 items-center justify-between z-[10]">
        <div>
          <p className="text-xs font-semibold text-slate-800">
            Mapa de Colaboradores por Ponto
          </p>
          <p className="text-[11px] text-slate-500">
            Use os filtros para refinar a visualização por rota e período.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px] items-center">
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
            className={`text-[13px] px-2.5 py-1 rounded-full border transition 
              ${
                !rotaSelecionada && !periodoSelecionado
                  ? "border-slate-200 text-slate-300 cursor-default"
                  : "border-emerald-500/60 text-emerald-700 hover:bg-emerald-50"
              }`}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        <div className="relative flex-1">
          <div className="absolute left-3 bottom-3 z-[1000] flex flex-col gap-1">
            <button
              type="button"
              onClick={handleResetView}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/95 border border-slate-200 shadow-sm hover:bg-slate-50 transition"
            >
              Visão inicial
            </button>

            {pontos.length > 0 && (
              <button
                type="button"
                onClick={handleZoomToAllPoints}
                className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition"
              >
                Enquadrar pontos
              </button>
            )}
          </div>

          {pontos.length === 0 && !loadingMapa && !errorMapa && (
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
            style={{ width: "100%", height: "100%" }}
          >
            <MapController
              action={mapAction}
              pontos={pontos}
              defaultCenter={defaultCenter}
              defaultZoom={defaultZoom}
            />

            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution="&copy; OpenStreetMap &copy; CartoDB"
            />

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
          </MapContainer>
        </div>

        <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 flex flex-col gap-3">
          {pontos.length > 0 && stats && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Visão Geral
              </p>
              <div className="flex gap-4 text-[11px] mb-3">
                <div>
                  <p className="text-slate-400">Pontos</p>
                  <p className="font-semibold text-slate-800">
                    {stats.totalPontos}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Colaboradores</p>
                  <p className="font-semibold text-slate-800">
                    {stats.totalColabs}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Máx. por ponto</p>
                  <p className="font-semibold text-slate-800">
                    {stats.maxColab}
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Top pontos com mais colaboradores
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
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
                      className={`w-full text-left rounded-lg px-2 py-1.5 text-[11px] transition ${
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
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-3 py-3 text-[11px]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-semibold text-slate-800">Legenda</p>
              {stats && (
                <span className="text-[10px] text-slate-400">
                  {stats.totalPontos} pts · {stats.totalColabs} colabs
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-500 mb-1">
              Faixas de colaboradores por ponto
            </p>

            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
              {LEGEND_ITEMS.map((item) => (
                <div
                  key={item.faixa}
                  className="flex-1 h-full"
                  style={{ backgroundColor: item.cor }}
                />
              ))}
            </div>

            <div className="mt-1.5 flex justify-between text-[9px] text-slate-500">
              {LEGEND_ITEMS.map((item) => (
                <span key={item.faixa} className="text-center flex-1">
                  {item.faixa}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
