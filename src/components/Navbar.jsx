import { Link } from "react-router-dom";
import bus from "../assets/bus.svg";
import dashboard from "../assets/dashboard.svg";
import users from "../assets/users.svg";
import registry from "../assets/registry.svg";
import record from "../assets/record.svg";
import door from "../assets/door.svg";
import logoV from "../assets/logoV.png";

export default function Navbar() {
  // Aqui você define seus ícones e links
  const menuItems = [
    { icon: dashboard, label: "Dashboard", path: "/home" },
    { icon: bus, label: "Gerenciar Linhas", path: "/gerenciar-linhas" },
    { icon: users, label: "Colaboradores", path: "/colaboradores" },
    { icon: registry, label: "Registro", path: "/registros" },
    { icon: record, label: "Relatorio", path: "/relatorio" },
    { icon: door, label: "Perfil", path: "/perfil" },
  ];
  //vou arrumar a logo depois, falta o traço embaixo dela, e ajeitar os icons
  return (
    <div className="h-screen w-[240px] pr-[20px] bg-white/30 text-white flex flex-col transition-all duration-300 items-center">
      {/* Logo */}
      <div className=" justify-center py-4 flex flex-col items-center mb-4">
        <img src={logoV} alt="logo" className=" rounded-full mx-auto ml-6" />
      </div>
      {/* Colocar aquele traço em baixo da logo aqui */}

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
      </nav>
    </div>
  );
}
