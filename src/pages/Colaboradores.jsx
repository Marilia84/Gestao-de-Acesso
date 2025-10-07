import Navbar from "../components/Navbar";
import { use, useEffect, useState } from "react";
import api from "../api/axios";
import Lupa from "../assets/lupa.svg";
import Add from "../assets/add.svg";

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Exemplo de chamada à API
    api
      .get("/colaboradores") // seu endpoint
      .then((res) => {
        setColaboradores(res.data); // assume que res.data é um array
      })
      .catch((err) => {
        console.error("Erro ao buscar colaboradores:", err);
      });
  }, []);
  // Filtra colaboradores pelo nome
  const colaboradoresFiltrados = colaboradores.filter((colab) =>
    colab.nome.toLowerCase().includes(search.toLowerCase())
  );
  return (
     <div className="relative bg-[#E6E6E6] min-h-screen flex items-center gap-4 overflow-hidden">
    <div className="absolute right-0 top-10 w-[750px] h-[800px] bg-[#53A67F] rounded-tl-[400px] rounded-bl-[300px] rotate-[20deg] translate-x-1/4 -translate-y-1/4 z-0" />
    <div className="absolute right-0 top-[750px] w-[2050px] h-[450px] bg-[#53A67F]  rounded-tl-[400px] rounded-br-[400px] rounded-tr-[400px] rotate-[-10deg] translate-x-1/4 -translate-y-1/4 z-0" />
    <Navbar />
    <div className="flex flex-1 flex-col justify-center items-center  relative z-10">
      <h1 className="text-3xl font-bold text-[#3B7258]">
        Gerenciar Colaboradores
      </h1>
        <div className="bg-[#EDEDED] shadow-md shadow  rounded-[32px] h-[880px] w-[1700px] mb-8 mt-8 p-8">
          <div className="relative mt-2 w-[600px] mb-[35px] ">
            
            <button className="absolute right-[-65em] top-1/2 -translate-y-1/2 bg-[#038C3E] border-2 border-[#1FC96A] rounded-full p-3 flex items-center justify-center shadow-md">
              <img src={Add} alt="Atribuir líder" className="w-4 h-4" />
            </button>
          </div>
          <div className="relative mt-2 w-[600px] mb-[35px]  ">
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
          <table className="w-full table-auto bg-white/30  rounded-lg  ">
            <thead>
              <tr className=" border-b border-gray-300">
                <th className="px-8 py-4 text-center">Colaborador</th>
                <th className="px-4 py-2 text-center">Matricula</th>
                <th className="px-4 py-2 text-center">Função</th>
                <th className="px-4 py-2 text-center">Linha</th>
                <th className="px-4 py-2 text-center">Turno</th>
              </tr>
            </thead>
            <tbody>
              {colaboradoresFiltrados.length > 0 ? (
                colaboradoresFiltrados.map((colab) => (
                  <tr key={colab.id}>
                    <td className="px-8 py-2 text-center">{colab.nome}</td>
                    <td className="px-4 py-2 text-center">{colab.matricula}</td>
                    <td className="px-4 py-2 text-center">{colab.role}</td>
                    <td className="px-4 py-2 text-center">linha D</td>
                    <td className="px-4 py-2 text-center">Diurno</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Nenhum colaborador encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
