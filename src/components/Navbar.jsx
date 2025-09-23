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
    { icon: bus, label: "Ônibus", path: "/onibus" },
    { icon: users, label: "Usuarios", path: "/colaboradores" },
    { icon: registry, label: "Registro", path: "/registros" },
    { icon: record , label: "Relatorio", path: "/relatorio" },
    { icon: door, label: "Perfil", path: "/perfil" },


  ];
//vou arrumar a logo depois, falta o traço embaixo dela, e ajeitar os icons
  return (
    <div
      className={`h-screen w-[220px] pr-[20px] bg-white/30 text-white flex flex-col transition-all duration-300 items-center `}
      onMouseLeave={() => setIsExpanded(true)}
    >
      {/* Logo */}
      <div className=" justify-center py-4 flex flex-col items-center mb-4">
        <img src={logoV} alt="logo" className=" rounded-full mx-auto ml-6" /> 
      </div>
      {/* Colocar aquele traço em baixo da logo aqui */}

      {/* Itens do Menu */}
      <nav className=" ml-4 rouded-lg flex-1 flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="flex items-center gap-4 p-3 hover:bg-[#038C4C] transition-colors rounded-lg"
          >
            <img src={item.icon} alt={item.label} className="w-6 h-6 ml-2 text-black" />
            {isExpanded && <span className="text-[#B1D4C4]">{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
