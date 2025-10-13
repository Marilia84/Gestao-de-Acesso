import Navbar from "../components/Navbar"

//cor de fundo E5EDE9
export default function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };
  return( 
  <div className="relative bg-[#E6E6E6] min-h-screen flex items-center gap-4 overflow-hidden">
    <div className="absolute right-0 bottom-10 w-[650px] h-[600px] bg-[#53A67F] rounded-tl-[400px] rounded-bl-[300px] rotate-[20deg] translate-x-1/4 -translate-y-1/4 z-0" />
    <div className="absolute right-0 top-[750px] w-[950px] h-[450px] bg-[#53A67F]  rounded-tl-[400px] rounded-br-[400px] rounded-tr-[400px] rotate-[-10deg] translate-x-1/4 -translate-y-1/4 z-0" />

      
      <Navbar />
     
    </div>
  );
}