// src/pages/Impedimentos.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import "leaflet/dist/leaflet.css";

import Navbar from "../components/Navbar";
import { getImpedimentos } from "../api/impedimentosService";
import Loading from "../components/Loading";
import MapaRotaColaborador from "../components/MapaRotaColaborador";

const getSeveridadeProps = (severidade) => {
  switch (severidade) {
    case "ALTA":
      return {
        className: "bg-orange-100 text-orange-800",
        label: "Alta",
      };
    case "MEDIA":
      return {
        className: "bg-yellow-100 text-yellow-800",
        label: "Média",
      };
    case "BAIXA":
      return {
        className: "bg-blue-100 text-blue-800",
        label: "Baixa",
      };
    default:
      return {
        className: "bg-red-100 text-red-800",
        label: severidade || "N/A",
      };
  }
};

const formatarData = (isoString) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "Data inválida";
  }
};

const formatarMotivo = (motivo) => {
  if (!motivo) return "—";
  return motivo
    .split("_")
    .map((palavra) => palavra.charAt(0) + palavra.slice(1).toLowerCase())
    .join(" ");
};

export default function Impedimentos() {
  const [impedimentos, setImpedimentos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("LISTA");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getImpedimentos();
        setImpedimentos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar impedimentos:", err);
        const errorMsg = "Não foi possível carregar os impedimentos.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const impedimentosFiltrados = useMemo(() => {
    const term = search.toLowerCase();

    return impedimentos.filter((imp) => {
      const motivo = imp?.motivo?.toLowerCase?.() || "";
      const descricao = imp?.descricao?.toLowerCase?.() || "";
      return motivo.includes(term) || descricao.includes(term);
    });
  }, [impedimentos, search]);

  return (
    <main
      className="
        flex-1 min-h-screen bg-slate-50
        px-3 sm:px-4 lg:px-28
        py-4
        ml-16
      "
    >
      <Navbar />

      <div className="w-full space-y-6">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-600">
              Registro de Impedimentos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Acompanhe os registros de impedimentos, suas severidades e status
              em tempo real.
            </p>
          </div>
        </header>

        <nav className="border-b border-slate-200 pb-4">
          <div className="flex justify-start">
            <div className="relative inline-flex bg-slate-100 rounded-full p-1">
              <span
                className={`
                  absolute inset-y-1 left-1
                  w-24
                  rounded-full bg-white shadow-sm
                  transition-transform duration-300 ease-out
                  ${
                    activeTab === "LISTA"
                      ? "translate-x-0"
                      : "translate-x-[6.5rem]"
                  }
                `}
              />

              <button
                type="button"
                onClick={() => setActiveTab("LISTA")}
                className={`
                  relative z-10
                  w-24
                  px-3 py-1.5
                  text-xs sm:text-sm font-semibold
                  transition-colors
                  ${
                    activeTab === "LISTA"
                      ? "text-emerald-600"
                      : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                Registros
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("MAPA")}
                className={`
                  relative z-10
                  w-24
                  px-3 py-1.5
                  text-xs sm:text-sm font-semibold
                  transition-colors
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

        {activeTab === "LISTA" && (
          <section
            className="
              bg-white border border-slate-200 shadow-sm rounded-2xl
              p-4 sm:p-6 md:p-7
              space-y-4 sm:space-y-6
            "
          >
            <div className="relative w-full max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                strokeWidth={2.5}
              />
              <input
                type="text"
                placeholder="Buscar por motivo ou descrição..."
                className="
                  pl-10 pr-4 py-2.5 w-full
                  rounded-xl
                  border border-slate-300 bg-slate-50
                  text-sm text-slate-900 placeholder:text-slate-400
                  focus:bg-white focus:outline-none
                  focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                "
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto min-h-[150px]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loading size={180} className="[&_p]:mt-1" />
                </div>
              ) : error ? (
                <p className="text-center text-red-500 py-4 text-sm sm:text-base">
                  {error}
                </p>
              ) : (
                <div className="w-full">
                  {impedimentosFiltrados.length > 0 ? (
                    <table className="w-full border-collapse md:table text-sm sm:text-base">
                      <thead className="hidden md:table-header-group bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Severidade
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Descrição
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Ocorrido em
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="block md:table-row-group divide-y divide-slate-200">
                        {impedimentosFiltrados.map((imp) => {
                          const severidadeProps = getSeveridadeProps(
                            imp.severidade
                          );
                          return (
                            <tr
                              key={imp.id}
                              className="
                                block md:table-row
                                mb-4 md:mb-0
                                border md:border-0
                                rounded-xl md:rounded-none
                                p-4 md:p-0
                                bg-white md:bg-transparent
                                shadow-sm md:shadow-none
                              "
                            >
                              <td className="block md:table-cell px-4 py-2 text-sm sm:text-base font-medium text-slate-900">
                                <span className="md:hidden font-semibold text-slate-500">
                                  Motivo:{" "}
                                </span>
                                {formatarMotivo(imp.motivo)}
                              </td>
                              <td className="block md:table-cell px-4 py-2 text-sm sm:text-base">
                                <span className="md:hidden font-semibold text-slate-500">
                                  Severidade:{" "}
                                </span>
                                <span
                                  className={`
                                    px-2 sm:px-3 py-1 inline-flex
                                    text-xs sm:text-sm leading-5 font-semibold rounded-full
                                    ${severidadeProps.className}
                                  `}
                                >
                                  {severidadeProps.label}
                                </span>
                              </td>
                              <td className="block md:table-cell px-4 py-2 text-sm sm:text-base text-slate-600 max-w-[220px] truncate">
                                <span className="md:hidden font-semibold text-slate-500">
                                  Descrição:{" "}
                                </span>
                                {imp.descricao || "—"}
                              </td>
                              <td className="block md:table-cell px-4 py-2 text-sm sm:text-base text-slate-600">
                                <span className="md:hidden font-semibold text-slate-500">
                                  Ocorrido em:{" "}
                                </span>
                                {formatarData(imp.ocorridoEm)}
                              </td>
                              <td className="block md:table-cell px-4 py-2 text-sm sm:text-base">
                                <span className="md:hidden font-semibold text-slate-500">
                                  Status:{" "}
                                </span>
                                <span
                                  className={`
                                    px-2 sm:px-3 py-1 inline-flex
                                    text-xs sm:text-sm leading-5 font-semibold rounded-full
                                    ${
                                      imp.ativo
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }
                                  `}
                                >
                                  {imp.ativo ? "Ativo" : "Finalizado"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/60">
                      <p className="text-sm font-medium text-slate-700">
                        {search
                          ? "Nenhum impedimento encontrado."
                          : "Nenhum impedimento registrado."}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Os registros aparecerão aqui conforme forem criados.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "MAPA" && (
          <section
            className="
              bg-white border border-slate-200 shadow-sm rounded-2xl
              p-4 sm:p-6 md:p-7
            "
          >
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Visualização no mapa
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Analise a distribuição dos impedimentos utilizando o mapa
                interativo.
              </p>
            </div>

            <div className="mt-2">
              <MapaRotaColaborador />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
