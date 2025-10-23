import Navbar from "../components/Navbar";

// cor de fundo E5EDE9
export default function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };

  return (
    <div className="relative bg-[#E6E6E6] min-h-screen flex overflow-hidden">
        {/* Fundos decorativos */}
        <div className="absolute right-0 bottom-10 w-[650px] h-[600px] bg-[#53A67F] rounded-tl-[400px] rounded-bl-[300px] rotate-[20deg] translate-x-1/4 -translate-y-1/4 z-0" />
        <div className="absolute right-0 top-[750px] w-[950px] h-[450px] bg-[#53A67F] rounded-tl-[400px] rounded-br-[400px] rounded-tr-[400px] rotate-[-10deg] translate-x-1/4 -translate-y-1/4 z-0" />

        {/* Navbar sobre os fundos (fixa à esquerda) */}
        <div className="absolute top-0 left-0 h-full z-20 w-56">
          <Navbar />
        </div>

      {/* Conteúdo centralizado */}
      <div className="flex-1 relative z-10 p-8 pl-[240px] overflow-auto">
          <div className="relative z-10 max-w-[1200px] mx-auto">
            {/* Primeira linha de cards */}
            <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6 w-full">
              <div className="bg-[#EDEDED] shadow-md rounded-[16px] md:rounded-[32px] h-[120px] md:h-[150px] w-full md:w-[300px]" />
              <div className="bg-[#EDEDED] shadow-md rounded-[16px] md:rounded-[32px] h-[120px] md:h-[150px] w-full md:w-[300px]" />
              <div className="bg-[#EDEDED] shadow-md rounded-[16px] md:rounded-[32px] h-[120px] md:h-[150px] w-full md:w-[300px]" />
            </div>

            {/* Segunda linha */}
            <div className="w-full mt-4 md:mt-6">
              <div className="bg-[#EDEDED] shadow-md rounded-[16px] md:rounded-[32px] h-[180px] md:h-[230px] w-full" />
            </div>

            {/* Terceira linha */}
            <div className="w-full mt-4 md:mt-6">
              <div className="bg-[#EDEDED] shadow-md rounded-[16px] md:rounded-[32px] h-[350px] md:h-[470px] w-full" />
            </div>
          </div>
        </div>
      </div>
  );
}
