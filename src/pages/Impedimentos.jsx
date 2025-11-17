import React, { useEffect, useState, useMemo } from "react";
import { Search, AlertTriangle } from "lucide-react";

// 1. Importa o seu serviço de impedimentos e o loader real
import { getImpedimentos } from "../api/impedimentosService";
import Loading from "../components/Loading"; // 👈 reusando seu loader

// --- Helpers de Formatação (para os badges) ---

// Formata o badge de severidade
const getSeveridadeProps = (severidade) => {
  switch (severidade) {
    case "ALTA":
      return {
        className: "bg-orange-100 text-orange-800",
        label: "Alta",
      };
    case "MEDIA": // Assumindo que "MEDIA" possa existir
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

// Formata a data para pt-BR
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

// Formata o motivo (ex: "QUEBRA_ONIBUS" -> "Quebra Onibus")
const formatarMotivo = (motivo) => {
  if (!motivo) return "—";
  return motivo
    .split("_")
    .map((palavra) => palavra.charAt(0) + palavra.slice(1).toLowerCase())
    .join(" ");
};

// --- Componente Principal ---

export default function Impedimentos() {
  // 2. Estados adaptados para "impedimentos"
  const [impedimentos, setImpedimentos] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 3. Chama a função (agora o import real do service)
        const data = await getImpedimentos();
        setImpedimentos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar impedimentos:", err);
        setError("Não foi possível carregar os impedimentos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 4. Lógica de filtro adaptada para "motivo" e "descricao"
  const impedimentosFiltrados = useMemo(() => {
    const term = search.toLowerCase();

    return impedimentos.filter((imp) => {
      const motivo = imp?.motivo?.toLowerCase?.() || "";
      const descricao = imp?.descricao?.toLowerCase?.() || "";
      return motivo.includes(term) || descricao.includes(term);
    });
  }, [impedimentos, search]);

  return (
    <main className="flex-1 p-4 md:p-10 ml-16">
      <div className="relative z-10 bg-white shadow-md rounded-xl w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        {/* 5. Título da página atualizado */}
        <div className="flex items-center space-x-3 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3B7258]">
            Registo de Impedimentos
          </h1>
        </div>

        {/* 6. Placeholder da busca atualizado */}
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

        {/* 7. Área da tabela / loading / erro (lógica idêntica) */}
        <div className="overflow-x-auto min-h-[150px]">
          {loading ? (
            <div className="flex justify-center py-8">
              {/* Usa o componente Loading real */}
              <Loading size={180} className="[&_p]:mt-1" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-4">{error}</p>
          ) : (
            <div className="w-full">
              {/* 8. Tabela adaptada para "impedimentos" */}
              {impedimentosFiltrados.length > 0 ? (
                <table className="w-full border-collapse md:table">
                  <thead className="hidden md:table-header-group bg-gray-50">
                    <tr>
                      {/* 9. Colunas da tabela atualizadas */}
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
                    {/* 10. Map e key atualizados */}
                    {impedimentosFiltrados.map((imp) => {
                      const severidadeProps = getSeveridadeProps(
                        imp.severidade
                      );
                      return (
                        <tr
                          key={imp.id}
                          className="block md:table-row mb-4 md:mb-0 border md:border-0 rounded-lg md:rounded-none p-4 md:p-0"
                        >
                          {/* 11. Células da tabela atualizadas com os novos dados */}
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
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
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
                // 12. Mensagens de "vazio" atualizadas
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
