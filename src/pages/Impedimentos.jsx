// src/pages/Impedimentos.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";

import { getImpedimentos } from "../api/impedimentosService";
import Loading from "../components/Loading";

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
      
      {/* CARD PRINCIPAL (igual padrão Colaboradores) */}
      <div className="w-full space-y-6 bg-white shadow-md rounded-xl  mx-auto p-4 sm:p-6 md:p-8">
        {/* HEADER DENTRO DO CARD */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3B7258]">
              Registo de Impedimentos
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Acompanhe os registros de impedimentos e suas severidades.
            </p>
          </div>
        </div>

        {/* BUSCA */}
        <div className="relative mt-2 w-full max-w-md mb-4 sm:mb-6">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Buscar por motivo ou descrição..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABELA / LISTA */}
        <div className="overflow-x-auto min-h-[150px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading size={180} className="[&_p]:mt-1" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-4">{error}</p>
          ) : (
            <div className="w-full">
              {impedimentosFiltrados.length > 0 ? (
                <table className="w-full border-collapse md:table">
                  <thead className="hidden md:table-header-group bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Severidade
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Ocorrido Em
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group divide-y divide-gray-200">
                    {impedimentosFiltrados.map((imp) => {
                      const severidadeProps = getSeveridadeProps(
                        imp.severidade
                      );
                      return (
                        <tr
                          key={imp.id}
                          className="block md:table-row mb-4 md:mb-0 border md:border-0 rounded-lg md:rounded-none p-4 md:p-0"
                        >
                          <td className="block md:table-cell px-4 py-2 text-sm sm:text-base font-medium text-gray-900">
                            <span className="md:hidden font-semibold">
                              Motivo:{" "}
                            </span>
                            {formatarMotivo(imp.motivo)}
                          </td>
                          <td className="block md:table-cell px-4 py-2 text-sm sm:text-base">
                            <span className="md:hidden font-semibold">
                              Severidade:{" "}
                            </span>
                            <span
                              className={`px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${severidadeProps.className}`}
                            >
                              {severidadeProps.label}
                            </span>
                          </td>
                          <td className="block md:table-cell px-4 py-2 text-sm sm:text-base text-gray-500 max-w-[200px] truncate">
                            <span className="md:hidden font-semibold">
                              Descrição:{" "}
                            </span>
                            {imp.descricao || "—"}
                          </td>
                          <td className="block md:table-cell px-4 py-2 text-sm sm:text-base text-gray-500">
                            <span className="md:hidden font-semibold">
                              Ocorrido Em:{" "}
                            </span>
                            {formatarData(imp.ocorridoEm)}
                          </td>
                          <td className="block md:table-cell px-4 py-2 text-sm sm:text-base">
                            <span className="md:hidden font-semibold">
                              Status:{" "}
                            </span>
                            <span
                              className={`px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${
                                imp.ativo
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
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
                <p className="text-center py-4 text-gray-500 text-sm sm:text-base">
                  {search
                    ? "Nenhum impedimento encontrado."
                    : "Nenhum impedimento registado."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
