import { Link, useNavigate } from "react-router-dom";
import bus from "../assets/bus.svg";
import dashboard from "../assets/dashboard.svg";
import users from "../assets/users.svg";
import registry from "../assets/registry.svg";
import record from "../assets/record.svg";
import door from "../assets/door.svg";
import logoV from "../assets/logoV.png";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const menuItems = [
    { icon: dashboard, label: "Dashboard", path: "/home" },
    { icon: bus, label: "Gerenciar Linhas", path: "/gerenciarLinhas" },
    { icon: users, label: "Colaboradores", path: "/colaboradores" },
    { icon: users, label: "Portaria", path: "/portaria" },
    { icon: users, label: "Visitantes", path: "/visitantes" },
    { icon: registry, label: "Registro", path: "/registro-viagem" },
    { icon: record, label: "Relatório", path: "/relatorio" },
  ];

  return (
    <div className="h-screen w-[240px] pr-[20px] bg-[#EDEDED]/30 text-white flex flex-col transition-all duration-300 items-center">
      {/* Logo */}
      <div className="justify-center py-4 flex flex-col items-center mb-4">
        <img src={logoV} alt="logo" className="rounded-full mx-auto ml-6" />
      </div>

      {/* Itens do Menu */}
      <nav className="ml-4 rounded-lg flex-1 flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="group flex items-center gap-4 p-3 hover:bg-[#038C4C] transition-colors rounded-lg"
          >
            <img
              src={item.icon}
              alt={item.label}
              className="w-6 h-6 ml-2 text-black group-hover:filter group-hover:brightness-0 group-hover:invert"
            />
            <span className="text-black group-hover:text-white transition-colors">
              {item.label}
            </span>
          </Link>
        ))}

        {/* Botão de Sair (colado ao Relatório) */}
        <button
          onClick={handleLogout}
          className="group flex items-center gap-4 p-3 mt-0 hover:bg-red-600 transition-colors rounded-lg"
        >
          <img
            src={door}
            alt="Sair"
            className="w-6 h-6 ml-2 text-black group-hover:filter group-hover:brightness-0 group-hover:invert"
          />
          <span className="text-black group-hover:text-white transition-colors">
            Sair
          </span>
        </button>
      </nav>
    </div>
  );
}
