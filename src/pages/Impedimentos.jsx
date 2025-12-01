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
} from "lucide-react";

export default function Impedimentos() {
  const [activeTab, setActiveTab] = useState("REGISTROS"); // REGISTROS | MAPA
  const [activeMapaTab, setActiveMapaTab] = useState("COLABORADORES");

  const [lista, setLista] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

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
            Impedimentos na operação
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Visualize ocorrências, consulte detalhes e acompanhe no mapa.
          </p>
        </header>

        {/* ABAS PRINCIPAIS */}
        <nav className="border-b border-slate-200 pb-4">
          <div className="flex justify-start">
            <div className="relative inline-flex bg-slate-100 rounded-full p-1 shadow-inner">
              {/* fundo animado */}
              <span
                className={`
                  absolute inset-y-1 left-1
                  w-24 rounded-full bg-white shadow-sm
                  transition-transform duration-300 ease-out
                  ${
                    activeTab === "REGISTROS"
                      ? "translate-x-0"
                      : "translate-x-[6.5rem]"
                  }
                `}
              />

              <button
                onClick={() => setActiveTab("REGISTROS")}
                className={`
                  relative z-10 w-24 px-3 py-1.5 text-xs sm:text-sm font-semibold
                  ${
                    activeTab === "REGISTROS"
                      ? "text-emerald-600"
                      : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                Registros
              </button>

              <button
                onClick={() => setActiveTab("MAPA")}
                className={`
                  relative z-10 w-24 px-3 py-1.5 text-xs sm:text-sm font-semibold
                  ${
                    activeTab === "MAPA"
                      ? "text-emerald-700"
                      : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                Mapa
              </button>
            </div>
          </div>
        </nav>

        {/* ============================================= */}
        {/*              ABA REGISTROS                    */}
        {/* ============================================= */}
        {activeTab === "REGISTROS" && (
          <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            {/* CARD LISTA */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[660px]">
              {/* Cabeçalho */}
              <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Lista de impedimentos
                  </h2>
                  <p className="text-xs text-slate-500">
                    Todas as ocorrências registradas.
                  </p>
                </div>

                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full pl-9 pr-2 py-1.5 text-sm border rounded-lg bg-slate-50 border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Conteúdo scrollável, altura fixa do card */}
              <div className="relative flex-1 overflow-y-auto">
                {loadingLista && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                    <Loading size={60} />
                  </div>
                )}

                {listaFiltrada.length === 0 && !loadingLista ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    <AlertTriangle className="w-5 h-5 mx-auto text-amber-500 mb-2" />
                    Nenhum impedimento encontrado.
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {listaFiltrada.map((imp) => {
                      const motivoFmt = imp.motivo?.replace(/_/g, " ");
                      const rotaFmt =
                        imp.rotaNome || imp.rota?.nome || "—";
                      const dataFmt = imp.ocorridoEm
                        ? new Date(imp.ocorridoEm).toLocaleString("pt-BR")
                        : "—";

                      const sev = (imp.severidade || "—").toUpperCase();
                      const badgeClass =
                        {
                          ALTA: "bg-red-100 text-red-700 border-red-300",
                          MÉDIA:
                            "bg-amber-100 text-amber-700 border-amber-300",
                          MEDIA:
                            "bg-amber-100 text-amber-700 border-amber-300",
                          BAIXA:
                            "bg-emerald-100 text-emerald-700 border-emerald-300",
                        }[sev] ||
                        "bg-slate-100 text-slate-700 border-slate-300";

                      // ÍCONE POR TIPO DE IMPEDIMENTO
                      const tipo = (imp.motivo || "").toUpperCase();
                      let TipoIcon = AlertTriangle;
                      let iconWrapperClass =
                        "bg-slate-50 text-slate-600 border-slate-200";

                      if (tipo === "ACIDENTE") {
                        TipoIcon = Car;
                        iconWrapperClass =
                          "bg-red-50 text-red-600 border-red-200";
                      } else if (tipo === "SOCORRO_MEDICO") {
                        TipoIcon = Stethoscope;
                        iconWrapperClass =
                          "bg-rose-50 text-rose-600 border-rose-200";
                      } else if (tipo === "QUEBRA_ONIBUS") {
                        TipoIcon = Cog;
                        iconWrapperClass =
                          "bg-amber-50 text-amber-600 border-amber-200";
                      }

                      return (
                        <li
                          key={imp.id}
                          onClick={() => setSelectedId(imp.id)}
                          className={`
                            cursor-pointer p-4 transition-all
                            ${
                              selectedId === imp.id
                                ? "bg-emerald-50 border-l-4 border-emerald-600"
                                : "hover:bg-slate-50"
                            }
                          `}
                        >
                          {/* linha 1: ícone “quadradinho” + motivo + badge */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`
                                  w-8 h-8 rounded-lg border flex items-center justify-center
                                  shadow-[0_1px_2px_rgba(15,23,42,0.05)]
                                  text-xs ${iconWrapperClass}
                                `}
                              >
                                <TipoIcon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 text-sm">
                                  {motivoFmt}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {rotaFmt}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`
                                text-[11px] px-2 py-0.5 rounded-full border 
                                font-medium ${badgeClass}
                              `}
                            >
                              {sev}
                            </span>
                          </div>

                          {/* linha 3: motorista / veículo */}
                          <div className="text-xs text-slate-500 mt-1">
                            {imp.motoristaNome && (
                              <>
                                Motorista:{" "}
                                <span className="text-slate-700">
                                  {imp.motoristaNome}
                                </span>{" "}
                                •{" "}
                              </>
                            )}
                            {imp.veiculoNome && (
                              <>
                                Veículo:{" "}
                                <span className="text-slate-700">
                                  {imp.veiculoNome}
                                </span>
                              </>
                            )}
                          </div>

                          {/* linha 4: descrição */}
                          {imp.descricao && (
                            <p className="text-[12px] text-slate-500 mt-2 line-clamp-2">
                              {imp.descricao}
                            </p>
                          )}

                          {/* linha 5: data */}
                          <div className="text-[11px] text-slate-400 mt-2">
                            {dataFmt}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* CARD DETALHES */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[660px]">
              <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-800">
                  Detalhes
                </h2>
                <p className="text-xs text-slate-500">
                  Dados completos do impedimento.
                </p>
              </div>

              {/* Conteúdo com scroll, altura do card fixa */}
              <div className="flex-1 p-4 overflow-y-auto">
                <ImpedimentoDetalhes id={selectedId} />
              </div>
            </div>
          </section>
        )}

        {/* ============================================= */}
        {/*                      MAPA                      */}
        {/* ============================================= */}
        {activeTab === "MAPA" && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
            {/* SUB-ABAS */}
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

            {/* MAPA */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <div className="w-full h-[520px] md:h-[640px]">
                {activeMapaTab === "COLABORADORES" ? (
                  <MapaRotaColaborador />
                ) : (
                  <MapaImpedimentos
                    onSelect={(id) => setSelectedId(id)}
                    selectedId={selectedId}
                  />
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
