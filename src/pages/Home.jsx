import Navbar from "../components/Navbar"

//cor de fundo E5EDE9
export default function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };
  return( 
  <div className="bg-[#E5EDE9]   flex flex-col justify-center  h-screen gap-4">
      <Navbar />
     
    </div>
  );
}