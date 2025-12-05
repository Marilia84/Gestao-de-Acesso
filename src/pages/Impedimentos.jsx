// src/pages/Impedimentos.jsx
import React, { useState, useEffect, useMemo } from "react";

import api from "../api/axios";
import Loading from "../components/Loading";

import MapaRotaColaborador from "../components/MapaRotaColaborador";
import MapaImpedimentos from "../components/MapaImpedimentos";
import ImpedimentoDetalhes from "../components/ImpedimentoDetalhes";
import {
  Search,
  AlertTriangle,
  Car,
  Stethoscope,
  Cog,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Impedimentos() {
  const [activeMapaTab, setActiveMapaTab] = useState("COLABORADORES");

  const [lista, setLista] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  // "LIST" | "DETAIL" (apenas para o container da lista)
  const [viewMode, setViewMode] = useState("LIST");

  // ===============================
  // BUSCAR LISTA DE IMPEDIMENTOS
  // ===============================
  async function carregarLista() {
    try {
      setLoadingLista(true);
      const res = await api.get("/impedimentos", {
        params: { apenasAtivos: true },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setLista(data);

      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar impedimentos:", err);
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    carregarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listaFiltrada = useMemo(() => {
    if (!search) return lista;
    const s = search.toLowerCase();

    return lista.filter((imp) => {
      return (
        (imp.motivo || "").toLowerCase().includes(s) ||
        (imp.descricao || "").toLowerCase().includes(s) ||
        (imp.rotaNome || imp.rota?.nome || "").toLowerCase().includes(s) ||
        (imp.motoristaNome || "").toLowerCase().includes(s)
      );
    });
  }, [search, lista]);

  // --- componente de lista (que agora vira LIST / DETAIL no mesmo container)
  const ListaImpedimentos = (
  <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full">
    {/* HEADER */}
    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        {viewMode === "DETAIL" && (
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-300 bg-white hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </button>
        )}

        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {viewMode === "LIST" ? "Impedimentos" : "Detalhamento do impedimento"}
          </h2>
        </div>
      </div>

      {viewMode === "LIST" ? (
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar motivo..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => selectedId && setViewMode("DETAIL")}
            disabled={!selectedId}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition
              ${
                selectedId
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
          >
            <span>Detalhar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <span className="text-[11px] text-slate-500">
          {selectedId ? "Impedimento selecionado" : "Nenhum impedimento selecionado"}
        </span>
      )}
    </div>

    {/* CONTEÚDO */}
    <div className="relative flex-1 overflow-y-auto">
      {loadingLista && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <Loading size={60} />
        </div>
      )}

      {viewMode === "DETAIL" ? (
        <div className="h-full">
          {selectedId ? (
            <ImpedimentoDetalhes id={selectedId} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-500 px-4 py-6">
              Nenhum impedimento selecionado.
            </div>
          )}
        </div>
      ) : listaFiltrada.length === 0 && !loadingLista ? (
        <div className="p-6 text-center text-slate-500 text-sm">
          <AlertTriangle className="w-5 h-5 mx-auto text-slate-400 mb-2" />
          Nenhum impedimento encontrado.
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">
          {listaFiltrada.map((imp) => {
            const motivoFmt = imp.motivo?.replace(/_/g, " ");
            const dataFmt = imp.ocorridoEm
              ? new Date(imp.ocorridoEm).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).replace(".", "")
              : "—";

            const sev = (imp.severidade || "—").toUpperCase();

            const sevStyles =
              {
                ALTA: "bg-rose-100 text-rose-800",
                MÉDIA: "bg-amber-100 text-amber-800",
                MEDIA: "bg-amber-100 text-amber-800",
                BAIXA: "bg-emerald-100 text-emerald-800",
              }[sev] || "bg-slate-100 text-slate-700";

            return (
              <button
                key={imp.id}
                type="button"
                onClick={() => {
                  setSelectedId((prev) => (prev === imp.id ? null : imp.id));
                }}
                className={`
                  w-full flex items-center gap-6 px-5 py-3.5 rounded-lg border text-xs sm:text-[13px] text-slate-800
                  transition-all
                  ${
                    selectedId === imp.id
                      ? "bg-white border-emerald-400 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                      : "bg-white/90 border-slate-100 hover:border-slate-200 hover:shadow-md hover:-translate-y-[1px]"
                  }
                `}
              >
                {/* Motivo */}
                <div className="flex-[1.8] text-left">
                  <div className="font-medium text-slate-900 truncate">
                    {motivoFmt || "Motivo não informado"}
                  </div>
                </div>

                {/* Severidade */}
                <div className="flex-[1] flex justify-center">
                  <span
                    className={`
                      inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium
                      ${sevStyles}
                    `}
                  >
                    {sev}
                  </span>
                </div>

                {/* Data */}
                <div className="flex-[1] text-right text-[11px] text-slate-500 whitespace-nowrap">
                  {dataFmt}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  </div>
);


  return (
    <main
      className="
        flex-1 min-h-screen bg-slate-50
        px-3 sm:px-4 lg:px-28
        py-4
        ml-16
      "
    >
      <div className="w-full space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-600">
            Mapas
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Visualize ocorrências, consulte detalhes e acompanhe tudo pelo mapa.
          </p>
        </header>

        {/* ABA ÚNICA: MAPA */}
        <section className="space-y-4">
          {/* SUB-ABAS (COLABORADORES / IMPEDIMENTOS) */}
          <div className="relative inline-flex bg-slate-100 rounded-full p-1 w-max shadow-inner">
            <span
              className={`
                absolute inset-y-1 left-1
                w-32 rounded-full bg-white shadow-sm
                transition-transform duration-300 ease-out
                ${
                  activeMapaTab === "COLABORADORES"
                    ? "translate-x-0"
                    : "translate-x-[8.5rem]"
                }
              `}
            />
            <button
              onClick={() => setActiveMapaTab("COLABORADORES")}
              className={`
                relative z-10 w-32 px-4 py-1.5 text-sm font-semibold
                ${
                  activeMapaTab === "COLABORADORES"
                    ? "text-emerald-600"
                    : "text-slate-500 hover:text-slate-700"
                }
              `}
            >
              Colaboradores
            </button>

            <button
              onClick={() => setActiveMapaTab("IMPEDIMENTOS")}
              className={`
                relative z-10 w-32 px-4 py-1.5 text-sm font-semibold
                ${
                  activeMapaTab === "IMPEDIMENTOS"
                    ? "text-emerald-600"
                    : "text-slate-500 hover:text-slate-700"
                }
              `}
            >
              Impedimentos
            </button>
          </div>

          {/* CONTEÚDO DA ABA MAPA */}
          {activeMapaTab === "COLABORADORES" && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <div className="w-full h-[calc(100vh-190px)]">
                <MapaRotaColaborador />
              </div>
            </div>
          )}

          {activeMapaTab === "IMPEDIMENTOS" && (
            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)] gap-6">
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <div className="w-full h-[calc(100vh-190px)]">
                  <MapaImpedimentos
                    onSelect={(id) => setSelectedId(id)}
                    selectedId={selectedId}
                  />
                </div>
              </div>

              {/* COLUNA LATERAL: APENAS LISTA (que troca para DETALHE) */}
              <div className="flex flex-col h-[640px]">
                {ListaImpedimentos}
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
