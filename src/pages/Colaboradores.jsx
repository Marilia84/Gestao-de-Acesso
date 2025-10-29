// src/pages/Colaboradores.jsx

import React, { useEffect, useState, useMemo } from "react";
// import { useNavigate } from "react-router-dom"; // Não está sendo usado, podemos remover por enquanto
import { Search } from "lucide-react"; // 1. Importa o ícone do Lucide
import { getColaboradores } from "../api/colaboradorService"; // 2. Importa nosso novo serviço de API

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [search, setSearch] = useState("");
  // 3. Adiciona estados de Loading e Erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 4. Lógica de busca de dados refatorada
    const fetchData = async () => {
      try {
        setLoading(true); // Inicia o loading
        setError(null); // Limpa erros anteriores
        const data = await getColaboradores(); // Chama o serviço
        setColaboradores(Array.isArray(data) ? data : []); // Garante que seja um array
      } catch (err) {
        console.error("Erro ao buscar colaboradores:", err);
        setError("Não foi possível carregar os colaboradores."); // Define msg de erro
      } finally {
        setLoading(false); // Finaliza o loading
      }
    };

    fetchData();
  }, []); // Roda apenas uma vez na montagem

  // 5. Otimização: Memoiza a filtragem para não rodar a cada renderização
  const colaboradoresFiltrados = useMemo(
    () =>
      colaboradores.filter(
        (colab) =>
          colab.nome.toLowerCase().includes(search.toLowerCase()) ||
          colab.matricula.toLowerCase().includes(search.toLowerCase()) // Bônus: filtra por matrícula também
      ),
    [colaboradores, search] // Recalcula apenas se 'colaboradores' ou 'search' mudar
  );

  // 6. O return agora começa direto no <main>, sem Navbar ou divs de layout
  return (
    <main className="flex-1 p-6 md:p-10">
      {" "}
      {/* Padding consistente */}
      {/* Removemos os fundos decorativos absolutos para um visual mais limpo */}
      {/* O fundo geral já é controlado pelo App.jsx -> MainLayout */}
      <div className="relative z-10 bg-white shadow-md rounded-xl w-full mx-auto p-6 md:p-8">
        <h1 className="text-3xl font-bold text-[#3B7258] mb-6">
          Gerenciar Colaboradores
        </h1>

        {/* Campo de busca */}
        <div className="relative mt-2 w-full max-w-md mb-6">
          <Search // 7. Usa o ícone Lucide
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou matrícula..." // Texto atualizado
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* 8. Tabela com estados de Loading e Erro */}
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-4">Carregando...</p>
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
                    // 9. Key corrigida para idColaborador
                    <tr key={colab.idColaborador} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {colab.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colab.matricula}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colab.role}
                      </td>
                      {/* 10. Colunas ajustadas para dados reais da API */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {colab.cidadeNome || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            colab.ativo
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
