import Navbar from "../components/Navbar"

export default function Colaboradores() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };
  return( 
  <div className="bg-[#E5EDE9]   flex flex-col justify-center  h-screen gap-4">
      <Navbar />
      <div className="bg-transparent shadow-xl  rounded-lg h-[1094px] w-[1590px] mx-auto mb-8">
        {/* Adicione o conteúdo da lista aqui */}
        <table className="min-w-full table-auto">
          <thead>
           
          </thead>
          <tbody>
            {/* Adicione os dados da tabela aqui */}
            <tr>
              <td className="px-4 py-2">Linha C</td>
              <td className="px-4 py-2">Guará</td>
              <td className="px-4 py-2">Noturno</td>
              <td className="px-4 py-2">Ativo</td>
              <td className="px-4 py-2">Ações</td>
            </tr>
            {/* Mais linhas da tabela */}
          </tbody>
        </table>
      </div>
    </div>
  );
}