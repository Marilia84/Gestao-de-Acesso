import Navbar from "../components/Navbar"
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Colaboradores() {
   const [colaboradores, setColaboradores] = useState([]);

   useEffect(() => {
    // Exemplo de chamada à API
    api.get("/colaboradores") // seu endpoint
      .then((res) => {
        setColaboradores(res.data); // assume que res.data é um array
      })
      .catch((err) => {
        console.error("Erro ao buscar colaboradores:", err);
      });
  }, []);

  return( 
  <div className="bg-[#E5EDE9] min-h-screen flex items-center gap-4">
      <Navbar />
      <div className="flex flex-1 flex-col justify-center items-center mr-[10px]  ">
      <div className="bg-white/10 shadow-md shadow-white  rounded-[32px] h-[895px] w-[1740px] mb-8 mt-8 p-8">
        {/* Adicione o conteúdo da lista aqui */}
         <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Colaborador</th>
                <th className="px-4 py-2">Matricula</th>
                <th className="px-4 py-2">Turno</th>
                <th className="px-4 py-2">linha</th>
                <th className="px-4 py-2">Função</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.length > 0 ? (
                colaboradores.map((colab) => (
                  <tr key={colab.id}>
                    <td className="px-4 py-2">{colab.nome}</td>
                    <td className="px-4 py-2">{colab.matricula}</td>
                    <td className="px-4 py-2">{colab.turno}</td>
                    <td className="px-4 py-2">{colab.linha}</td>
                    <td className="px-4 py-2">{colab.role}</td>
                    <td className="px-4 py-2">{colab.turno}</td>
                    <td className="px-4 py-2">{colab.status}</td>
                    <td className="px-4 py-2">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded">
                        Editar
                      </button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded ml-2">
                        Deletar
                      </button>
                    </td>
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