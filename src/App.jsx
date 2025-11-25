import React from "react";
import { Routes, Route, Outlet } from "react-router-dom"; // Importe o <Outlet />

// Importe suas páginas e componentes
import Login from "./pages/Login";
import ChatBot from "./pages/Chat-bot";
import PrivateRoute from "./components/PrivateRoute";
import Colaboradores from "./pages/Colaboradores";
import GerenciarLinhas from "./pages/Gerenciar-linhas";
import Visitantes from "./pages/Visitantes";
import RegistroViagem from "./pages/Registro-viagem";
import Portaria from "./pages/Portaria";
import Navbar from "./components/Navbar";
import Impedimentos from "./pages/Impedimentos" 

/**
 * Este é o nosso componente de Layout.
 * Ele renderiza o Navbar e um "placeholder" <Outlet />
 * O React Router irá renderizar a página da rota atual (Home, Portaria, etc.)
 * no lugar do <Outlet />.
 */
const MainLayout = () => {
  return (
    // Este é o container flex que você tinha em cada página
    <div className="flex bg-[#F4F7F6] min-h-screen">
      <Navbar />
      {/* O 'flex-1' faz a <main> ocupar todo o espaço restante */}
      <main className="flex-1">
        <Outlet /> {/* <-- A MÁGICA ACONTECE AQUI */}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Routes>
      {/* Rota de Login (página inteira, sem layout) */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
==
      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        {/* Todas as suas páginas agora são "filhas" do MainLayout */}
        <Route path="/home" element={<Impedimentos />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/gerenciarLinhas" element={<GerenciarLinhas />} />
        <Route path="/visitantes" element={<Visitantes />} />
        <Route path="/registro-viagem" element={<RegistroViagem />} />
        <Route path="/portaria" element={<Portaria />} />
        <Route path="/chat-bot" element={<ChatBot />} />
        {/* Adicione suas outras rotas aqui (ex: /relatorio, /perfil) */}
      </Route>
    </Routes>
  );
}
