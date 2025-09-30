import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import api from "../api/axios";
import Lupa from "../assets/lupa.svg";
import Add from "../assets/add.svg";

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);

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

  return (
    <div className="bg-[#E5EDE9] min-h-screen flex items-center gap-4">
      <Navbar />
      <div className="flex flex-1 flex-col justify-center items-center mr-[10px]  ">
        <div className="bg-white/10 shadow-md shadow-white  rounded-[32px] h-[895px] w-[1740px] mb-8 mt-8 p-8">
          <div className="relative mt-2 w-[600px] mb-[35px] ">
            <h1 className="text-3xl font-bold mb-6 text-black">
              Gerenciar Colaboradores
            </h1>
            <button className="absolute right-[-65em] top-1/2 -translate-y-1/2 bg-[#038C3E] border-2 border-[#1FC96A] rounded-full p-3 flex items-center justify-center shadow-md">
              <img src={Add} alt="Atribuir líder" className="w-4 h-4" />
            </button>
          </div>
          <div className="relative mt-2 w-[600px] mb-[35px] ">
            <img
              src={Lupa}
              alt="lupa de busca"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5"
            />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              className="pl-12 w-full rounded-[8px] placeholder-[#859990] h-8 bg-white/40"
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
              {colaboradores.length > 0 ? (
                colaboradores.map((colab) => (
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
