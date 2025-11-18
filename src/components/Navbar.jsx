import { useLocation, useNavigate, Link } from "react-router-dom";
import logoK from "../assets/logoK.png";
import {
  LayoutDashboard,
  Bus,
  Users,
  Building,
  UserCheck,
  ClipboardList,
  FileText,
  LogOut,
  Flag,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Chat-Bot", path: "/home" },
  { icon: Bus, label: "Gerenciar Linhas", path: "/gerenciarLinhas" },
  { icon: Users, label: "Colaboradores", path: "/colaboradores" },
  { icon: Building, label: "Portaria", path: "/portaria" },
  { icon: UserCheck, label: "Visitantes", path: "/visitantes" },
  { icon: ClipboardList, label: "Registro", path: "/registro-viagem" },
  { icon: Flag, label: "Impedimentos", path: "/impedimentos" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div
      className={`
        group fixed top-0 left-0 h-screen z-40
        bg-white shadow-lg
        flex flex-col
        w-[72px] hover:w-60
        transition-[width] duration-300
      `}
    >
      {/* LOGO */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <img
          src={logoK}
          alt="logo"
          className="h-12 w-12 rounded-full object-contain"
        />
        <span
          className="
            text-sm font-semibold text-emerald-800
            opacity-0 -translate-x-2
            group-hover:opacity-100 group-hover:translate-x-0
            transition-all duration-200 whitespace-nowrap
          "
        >
          TrackPass
        </span>
      </div>

      {/* MENU */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 ">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 rounded-2xl px-3 py-2.5 mb-1
                transition-colors
                ${
                  isActive
                    ? "bg-[#CEECE4] text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <Icon
              className={`w-6 h-6 shrink-0 ${
                isActive ? "text-green-700" : "text-emerald-500"
              }`}
              strokeWidth={isActive ? 2.5 : 2}
            />

              <span
                className="
                  text-sm font-medium
                  opacity-0 -translate-x-2
                  group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-150
                  whitespace-nowrap
                "
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* BOTÃO SAIR */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-3 w-full
            text-red-600 hover:bg-red-50
            px-3 py-2 rounded-lg
            transition-colors
          "
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span
            className="
              text-sm font-medium
              opacity-0
              group-hover:opacity-100
              transition-opacity duration-150
              whitespace-nowrap
            "
          >
            Sair
          </span>
        </button>
      </div>
    </div>
  );
}
