import { useState } from "react";
import { Link } from "react-router-dom";
import bus from "../assets/bus.png";
import dashboard from "../assets/dashboard.png";
import users from "../assets/users.png";
import registry from "../assets/registry.png";
import record from "../assets/record.png";
import door from "../assets/door.png";
import logoB from "../assets/logoB.png";


export default function Navbar() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Aqui você define seus ícones e links
  const menuItems = [
    { icon: dashboard, label: "Dashboard", path: "/home" },
    { icon: bus, label: "Lista de Onibus", path: "/perfil" },
    { icon: users, label: "Usuario", path: "/config" },
    { icon: registry, label: "registro", path: "/logout" },
    { icon: record , label: "Sei la oq", path: "/logout" },
    { icon: door, label: "Sair", path: "/logout" },


  ];

  return (
    <div
      className={`h-screen bg-gradient-to-br from-[#859990] to-[#003918] text-white flex flex-col transition-all duration-300 ${
        isExpanded ? "w-48" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center py-4">
        <img src={logoB} alt="logo" className="w-10 h-10 rounded-full" />
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
