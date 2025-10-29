import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Lupa from "../assets/lupa.svg";

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/colaboradores")
      .then((res) => setColaboradores(res.data))
      .catch((err) => console.error("Erro ao buscar colaboradores:", err));
  }, []);

  const colaboradoresFiltrados = colaboradores.filter((colab) =>
    colab.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative bg-[#E6E6E6] min-h-screen flex overflow-hidden">
      {/* Fundos decorativos */}

      <div className="absolute right-0 top-[750px] w-[1200px] h-[550px] bg-[#53A67F] rounded-tl-[400px] rounded-br-[400px] rounded-tr-[400px] rotate-[-10deg] translate-x-1/4 -translate-y-1/4 z-0" />

      {/* Navbar sobre os fundos (fixa à esquerda) */}
      <div className="absolute top-0 left-0 h-full z-20 w-56"></div>

      {/* Conteúdo principal: usa margin-left para criar somente espaçamento lateral entre navbar e tabela */}
      <div className="flex-1 relative z-10 p-8 ml-60 overflow-auto">
        <div className="relative z-10 bg-[#EDEDED] shadow-md rounded-[32px] w-full max-w-[1200px] mx-auto p-8">
          <h1 className="text-3xl font-bold text-[#3B7258] mb-8">
            Gerenciar Colaboradores
          </h1>

          {/* Campo de busca */}
          <div className="relative mt-2 w-full max-w-[600px] mb-[35px]">
            <img
              src={Lupa}
              alt="lupa de busca"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              className="pl-12 w-full rounded-[8px] placeholder-[#859990] h-8 bg-[#53A67F]/15 transition-border focus:outline-none focus:ring-1 focus:ring-[#038C3E]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full table-auto bg-white/30 rounded-lg">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-8 py-4 text-center">Colaborador</th>
                  <th className="px-4 py-2 text-center">Matricula</th>
                  <th className="px-4 py-2 text-center">Função</th>
                  <th className="px-4 py-2 text-center">Linha</th>
                  <th className="px-4 py-2 text-center">Turno</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {colaboradoresFiltrados.length > 0 ? (
                  colaboradoresFiltrados.map((colab) => (
                    <tr key={colab.id}>
                      <td className="px-8 py-2 text-center">{colab.nome}</td>
                      <td className="px-4 py-2 text-center">
                        {colab.matricula}
                      </td>
                      <td className="px-4 py-2 text-center">{colab.role}</td>
                      <td className="px-4 py-2 text-center">Linha D</td>
                      <td className="px-4 py-2 text-center">Diurno</td>
                      <td className="px-4 py-2 text-center">
                        {colab.ativo ? "Ativo" : "Inativo"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      Nenhum colaborador encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
