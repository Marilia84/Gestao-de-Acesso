import Navbar from "../components/Navbar";

// cor de fundo E5EDE9
export default function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };

  return (
    <div className="relative bg-[#E6E6E6] min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Fundos verdes decorativos */}
      <div
        id="fundo"
        className="absolute right-0 bottom-10 w-[650px] h-[600px] bg-[#53A67F] rounded-tl-[400px] rounded-bl-[300px] rotate-[20deg] translate-x-1/4 -translate-y-1/4 z-0"
      />
      <div
        id="fundo"
        className="absolute right-0 top-[750px] w-[950px] h-[450px] bg-[#53A67F] rounded-tl-[400px] rounded-br-[400px] rounded-tr-[400px] rotate-[-10deg] translate-x-1/4 -translate-y-1/4 z-0"
      />

      {/* Navbar fixa no topo */}
      <div className="absolute top-0 left-0 w-full z-20">
        <Navbar />
      </div>

      {/* Conteúdo centralizado */}
      <div className="relative flex flex-col items-center justify-center gap-10 z-10 pt-4">
        {/* Primeira linha de cards */}
        <div className="flex flex-wrap justify-center gap-6">
          <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[150px] w-[350px]"></div>
          <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[150px] w-[350px]"></div>
          <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[150px] w-[350px]"></div>
        </div>

        {/* Segunda linha */}
        <div className="flex justify-center">
          <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[230px] w-[1100px]"></div>
        </div>

        {/* Terceira linha */}
        <div className="flex justify-center">
          <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[470px] w-[1100px]"></div>
        </div>
      </div>
    </div>
  );
}
