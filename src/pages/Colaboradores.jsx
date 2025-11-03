// src/pages/Colaboradores.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
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
        setError("Não foi possível carregar os colaboradores.");
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
    <main className="flex-1 p-6 md:p-10">
      <div className="relative z-10 bg-white shadow-md rounded-xl w-full mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold text-[#3B7258] mb-6">
          Gerenciar Colaboradores
        </h1>

        {/* Campo de busca */}
        <div className="relative mt-2 w-full max-w-md mb-6">
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
              <Loading
                message="Carregando colaboradores..."
                size={180}         // 👈 aumentei o tamanho
                className="[&_p]:mt-1" // 👈 aproxima o texto usando Tailwind arbitrário
              />
            </div>
          ) : error ? (
            <p className="text-center text-red-500 py-4">{error}</p>
          ) : (
            <table className="w-full table-auto bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matrícula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função (Role)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {colaboradoresFiltrados.length > 0 ? (
                  colaboradoresFiltrados.map((colab) => (
                    <tr
                      key={colab.idColaborador || colab.id || colab.matricula}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {colab.nome || "Sem nome"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colab.matricula || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colab.role || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colab.cidadeNome || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colab.ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {colab.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      {search
                        ? "Nenhum colaborador encontrado."
                        : "Nenhum colaborador cadastrado."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
