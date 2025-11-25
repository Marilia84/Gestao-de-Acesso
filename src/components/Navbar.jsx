// src/components/Navbar.jsx
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

  const activeIndex = menuItems.findIndex((item) => item.path === currentPath);

  return (
    <div
      className="
        fixed top-0 left-0
        h-screen
        z-40
        flex
      "
    >
      {/* SIDEBAR VERDE */}
      <aside
        className="
          group
          bg-[#0D896F]
          flex flex-col
          w-[80px] hover:w-40
          transition-[width] duration-300
          rounded-r-3xl
          overflow-visible
          shadow-xl
        "
      >
        {/* LOGO */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-emerald-500/40">
          <img
            src={logoK}
            alt="logo"
            className="h-12 w-12 rounded-full object-contain bg-white shadow-md"
          />
          <span
            className="
              text-sm font-semibold text-white
              opacity-0 -translate-x-2
              group-hover:opacity-100 group-hover:translate-x-0
              transition-all duration-200 whitespace-nowrap
            "
          >
            TrackPass
          </span>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-0 py-4">
          <div
            className="relative"
            style={
              activeIndex >= 0
                ? { "--active-index": activeIndex }
                : { "--active-index": 0 }
            }
          >
            {activeIndex >= 0 && (
              <span className="tp-nav-highlight" aria-hidden="true" />
            )}

            <ul className="tp-nav-list">
              {menuItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;

                return (
                  <li
                    key={item.path}
                    className={`
                      tp-nav-item
                      ${isActive ? "tp-nav-item--active" : ""}
                    `}
                  >
                    <Link
                      to={item.path}
                      className="
                        tp-nav-link
                        flex items-center gap-3
                        px-4
                        h-11
                        text-sm font-medium
                      "
                    >
                      <Icon
                        className={`
                          w-5 h-5 shrink-0
                          transition-transform transition-colors duration-200
                          ${isActive ? "scale-110" : "scale-100"}
                        `}
                        strokeWidth={isActive ? 2.4 : 2}
                      />
                      <span
                        className="
                          opacity-0 -translate-x-2
                          group-hover:opacity-100 group-hover:translate-x-0
                          transition-all duration-150
                          whitespace-nowrap
                        "
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* BOTÃO SAIR */}
        <div className="px-4 pb-5 pt-3 border-t border-emerald-500/40">
          <button
            onClick={handleLogout}
            className="
              flex items-center gap-3 w-full
              px-4 py-2.5
              rounded-full
              text-sm font-medium
              text-red-50
              hover:text-red-600 hover:bg-red-50/10
              transition-colors
            "
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              className="
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
      </aside>
    </div>
  );
}
