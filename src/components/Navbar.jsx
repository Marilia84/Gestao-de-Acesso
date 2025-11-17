import { useLocation, useNavigate, Link } from "react-router-dom";
import logoV from "../assets/logoV.png";
import {
  LayoutDashboard,
  Bus,
  Users,
  Building,
  UserCheck,
  ClipboardList,
  FileText,
  LogOut,
  Menu,
  X,
  Flag,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Home", path: "/home" },
  { icon: Bus, label: "Gerenciar Linhas", path: "/gerenciarLinhas" },
  { icon: Users, label: "Colaboradores", path: "/colaboradores" },
  { icon: Building, label: "Portaria", path: "/portaria" },
  { icon: UserCheck, label: "Visitantes", path: "/visitantes" },
  { icon: ClipboardList, label: "Registro", path: "/registro-viagem" },
  { icon: FileText, label: "Relatório", path: "/relatorio" },
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
    <>
      {/* SIDEBAR */}
      <div
        className={`
          group fixed top-0 left-0 h-screen bg-white shadow-lg z-40
          transition-all duration-300
          ${
            scrolled
              ? "-translate-x-full pointer-events-none"
              : "w-[72px] hover:w-60 translate-x-0"
          }
        `}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <img
            src={logoV}
            alt="logo"
            className="h-12 w-12 rounded-full object-contain"
          />
          <span className="text-sm font-semibold text-emerald-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-200 whitespace-nowrap">
            TrackPass
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-2 py-4 h-[calc(100vh-130px)] overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 mb-1
                  transition-colors
                  ${
                    isActive
                      ? "bg-[#038C4C] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Icon
                  className="w-5 h-5 shrink-0"
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-sm font-medium opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-150">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Sair
            </span>
          </button>
        </div>
      </div>

      {/* TOPBAR */}
      <div
        className={`
    fixed top-0 left-0 right-0 z-30
    bg-white/90 backdrop-blur-md border-b border-gray-200
    transition-all duration-300
    ${scrolled ? "translate-y-0" : "-translate-y-full"}
  `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            {/* MENU + Sair */}
            <div className="hidden sm:flex flex-1 gap-5 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {menuItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition
                ${
                  isActive
                    ? "bg-[#038C4C] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Botão Sair */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sair</span>
              </button>
            </div>

            {/* MENU MOBILE */}
            <div className="sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* MENU MOBILE EXPANDIDO */}
          {mobileMenuOpen && (
            <div className="sm:hidden flex flex-col gap-2 pb-3 mt-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {menuItems.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition
                ${
                  isActive
                    ? "bg-[#038C4C] text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Botão Sair no menu mobile */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
