// src/components/Navbar.jsx

import { Link, useNavigate, useLocation } from "react-router-dom";
import logoV from "../assets/logoV.png";

// 1. Importe os ícones que você precisa do lucide-react
import {
  LayoutDashboard,
  Bus,
  Users,
  Building, // Ícone para Portaria
  UserCheck, // Ícone para Visitantes
  ClipboardList, // Ícone para Registro
  FileText, // Ícone para Relatório
  LogOut, // Ícone para Sair
} from "lucide-react";

// 2. Mapeie os ícones importados para os itens do menu
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/home" },
  { icon: Bus, label: "Gerenciar Linhas", path: "/gerenciarLinhas" },
  { icon: Users, label: "Colaboradores", path: "/colaboradores" },
  { icon: Building, label: "Portaria", path: "/portaria" },
  { icon: UserCheck, label: "Visitantes", path: "/visitantes" },
  { icon: ClipboardList, label: "Registro", path: "/registro-viagem" },
  { icon: FileText, label: "Relatório", path: "/relatorio" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para saber a rota atual
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    // 3. UI Limpa: Fundo branco, sombra, largura fixa e padding
    <div className="h-screen w-60 bg-white shadow-lg flex flex-col">
      {/* Logo */}
      <div className="flex justify-center items-center py-6 px-4 mb-2">
        <img
          src={logoV}
          alt="logo"
          className="h-16 w-auto rounded-full" // Tamanho ajustado
        />
      </div>

      {/* Divisor */}
      <hr className="border-t border-gray-200 mx-4" />

      {/* 4. Itens do Menu (com scroll se necessário) */}
      <nav className="flex-1 flex flex-col gap-2 px-4 py-4 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentPath === item.path;
          // Renderiza o ícone como um componente
          const IconComponent = item.icon;

          return (
            <Link
              key={item.path} // Use o path como key
              to={item.path}
              // 5. Lógica de Ativação (UI Intuitiva)
              className={`
                group flex items-center gap-3 p-3 transition-colors rounded-lg
                ${
                  isActive
                    ? "bg-[#038C4C] text-white shadow-md" // Estilo ATIVO
                    : "text-gray-700 hover:bg-gray-100" // Estilo INATIVO
                }
              `}
            >
              <IconComponent
                className="w-5 h-5 shrink-0" // Tamanho padrão do Lucide
                strokeWidth={isActive ? 2.5 : 2} // Destaque sutil no ícone ativo
              />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 6. Botão Sair (movido para o rodapé do Navbar para melhor UX) */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 p-3 w-full text-red-600 hover:bg-red-50 transition-colors rounded-lg"
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </div>
    </div>
  );
}
