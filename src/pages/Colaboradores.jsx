// src/pages/Colaboradores.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { toast } from "react-toastify"; // 👈 Importamos o toast
import { getColaboradores } from "../api/colaboradorService";
import Loading from "../components/Loading"; // 👈 importa seu loader

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true); // já começa carregando
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getColaboradores();
        setColaboradores(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar colaboradores:", err);
        const errorMsg = "Não foi possível carregar os colaboradores.";
        setError(errorMsg); // Mantém o erro no estado para a UI
        toast.error(errorMsg); // 👈 Dispara o toast de erro
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // evita erro se algum registro vier sem nome/matricula
  const colaboradoresFiltrados = useMemo(() => {
    const term = search.toLowerCase();

    return colaboradores.filter((colab) => {
      const nome = colab?.nome?.toLowerCase?.() || "";
      const matricula = colab?.matricula?.toLowerCase?.() || "";
      return nome.includes(term) || matricula.includes(term);
    });
  }, [colaboradores, search]);

  return (
    <main className="flex-1 p-4 md:p-10 ml-16">
      <div className="relative z-10 bg-white shadow-md rounded-xl w-full max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3B7258] mb-4 sm:mb-6">
          Gerenciar Colaboradores
        </h1>

        {/* Campo de busca */}
        <div className="relative mt-2 w-full max-w-md mb-4 sm:mb-6">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou matrícula..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Área da tabela / loading / erro */}
        <div className="overflow-x-auto min-h-[150px]">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading size={180} className="[&_p]:mt-1" />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-4">{error}</p>
          ) : (
            <div className="w-full">
              {colaboradoresFiltrados.length > 0 ? (
                <table className="w-full border-collapse md:table">
                  <thead className="hidden md:table-header-group bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Colaborador
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Função
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Cidade
                      </th>
                      <th className="px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="block md:table-row-group divide-y divide-gray-200">
                    {colaboradoresFiltrados.map((colab) => (
                      <tr
                        key={colab.idColaborador || colab.id || colab.matricula}
                        className="block md:table-row mb-4 md:mb-0 border md:border-0 rounded-lg md:rounded-none p-4 md:p-0"
                      >
                        <td className="block md:table-cell px-4 py-2 text-sm sm:text-base font-medium text-gray-900">
                          <span className="md:hidden font-semibold">
                            Colaborador:{" "}
                          </span>
                          {colab.nome || "Sem nome"}
                        </td>
                        <td className="block md:table-cell px-4 py-2 text-sm sm:text-base text-gray-500">
                          <span className="md:hidden font-semibold">
                            Matrícula:{" "}
                          </span>
                          {colab.matricula || "—"}
                        </td>
                        <td className="block md:table-cell px-4 py-2 text-sm sm:text-base text-gray-500">
                          <span className="md:hidden font-semibold">
                            Função:{" "}
                          </span>
                          {colab.role || "—"}
                        </td>
                        <td className="block md:table-cell px-4 py-2 text-sm sm:text-base text-gray-500">
                          <span className="md:hidden font-semibold">
                            Cidade:{" "}
                          </span>
                          {colab.cidadeNome || "N/A"}
                        </td>
                        <td className="block md:table-cell px-4 py-2 text-sm sm:text-base">
                          <span className="md:hidden font-semibold">
                            Status:{" "}
                          </span>
                          <span
                            className={`px-2 sm:px-3 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${
                              colab.ativo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {colab.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center py-4 text-gray-500 text-sm sm:text-base">
                  {search
                    ? "Nenhum colaborador encontrado."
                    : "Nenhum colaborador cadastrado."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
