import Navbar from "../components/Navbar";

//cor de fundo E5EDE9
export default function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };
  return (
    <div className="relative bg-[#E6E6E6] min-h-screen flex items-start gap-4 overflow-hidden">
      <div id="fundo" className="absolute right-0 bottom-10 w-[650px] h-[600px] bg-[#53A67F] rounded-tl-[400px] rounded-bl-[300px] rotate-[20deg] translate-x-1/4 -translate-y-1/4 z-0" />
      <div id="fundo" className="absolute right-0 top-[750px] w-[950px] h-[450px] bg-[#53A67F]  rounded-tl-[400px] rounded-br-[400px] rounded-tr-[400px] rotate-[-10deg] translate-x-1/4 -translate-y-1/4 z-0" />

      <Navbar />

      <div className="relative flex flex-1 flex-col items-start justify-start">
        <div className="relative w-full pt-6 px-8">
          {/* container que alinha 3 cards na mesma linha; responde em telas pequenas */}
          <div className="flex flex-wrap gap-6 justify-start items-start mt-2">
            <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[150px] w-[350px] flex-shrink-0"></div>
            <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[150px] w-[350px] flex-shrink-0"></div>
            <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[150px] w-[350px] flex-shrink-0"></div>
          </div>
        </div>
        <div className="relative w-full pt-6 px-8">
          {/* container que alinha 3 cards na mesma linha; responde em telas pequenas */}
          <div className="flex flex-wrap gap-6 justify-start items-start mt-2">
            <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[230px] w-[1100px] flex-shrink-0"></div>
           
          </div>
        </div>
        <div className="relative w-full pt-6 px-8">
          {/* container que alinha 3 cards na mesma linha; responde em telas pequenas */}
          <div className="flex flex-wrap gap-6 justify-start items-start mt-2">
            <div className="bg-[#EDEDED] shadow-md rounded-[32px] h-[470px] w-[1100px] flex-shrink-0"></div>
           
          </div>
        </div>
      </div>
      <aside className="hidden lg:flex flex-col gap-6 w-[320px] pr-8 pt-6">
        <div className="bg-[#EDEDED] shadow-md rounded-[24px] h-[200px] w-full"></div>
        <div className="bg-[#EDEDED] shadow-md rounded-[24px] h-[200px] w-full"></div>
        <div className="bg-[#EDEDED] shadow-md rounded-[24px] h-[120px] w-full"></div>
      </aside>
    </div>
  );
}
