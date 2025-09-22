import { useState } from "react";
import { Link } from "react-router-dom";
import bus from "../assets/bus.png";
import dashboard from "../assets/dashboard.png";
import users from "../assets/users.png";
import registry from "../assets/registry.png";
import record from "../assets/record.png";
import door from "../assets/door.png";
import logoV from "../assets/logoV.png";


export default function Navbar() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Aqui você define seus ícones e links
  const menuItems = [
    { icon: dashboard, label: "Dashboard", path: "/home" },
    { icon: bus, label: "Lista de Onibus", path: "/perfil" },
    { icon: users, label: "Usuario", path: "/colaboradores" },
    { icon: registry, label: "registro", path: "/logout" },
    { icon: record , label: "Relatorio", path: "/logout" },
    { icon: door, label: "Sair", path: "/logout" },


  ];
//vou arrumar a logo depois
  return (
    <div
      className={`h-screen mr-12 text-white flex flex-col transition-all duration-300 ${
        isExpanded ? "w-48" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className=" justify-center py-4">
        <img src={logoV} alt="logo" className="w-66 h-45 rounded-full" /> 
      </div>

      {/* Itens do Menu */}
      <nav className="flex-1">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="flex items-center gap-4 p-3 hover:bg-[#004b21] transition-colors"
          >
            <img src={item.icon} alt={item.label} className="w-6 h-6" />
            {isExpanded && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
