import Navbar from "../components/Navbar"


export default function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };
  return( 
  <div className="flex flex-col justify-center  h-screen gap-4">
      <Navbar />
     
    </div>
  );
}