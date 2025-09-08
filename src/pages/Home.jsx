export default function Home() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // redireciona para login
  };
  return( 
  <div className="flex flex-col justify-center items-center h-screen gap-4">
      <h1 className="text-3xl font-bold">Você entrou com sucesso!</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Sair
      </button>
    </div>
  );
}