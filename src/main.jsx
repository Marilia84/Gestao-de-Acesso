import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import Colaboradores from "./pages/Colaboradores";
import GerenciarLinhas from "./pages/Gerenciar-linhas";
import Visitantes from "./pages/Visitantes";
import RegistroViagem from "./pages/Registro-viagem";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/colaboradores"
          element={
            <PrivateRoute>
              <Colaboradores />
            </PrivateRoute>
          }
        />
        <Route
          path="/gerenciar-linhas"
          element={
            <PrivateRoute>
              <GerenciarLinhas />
            </PrivateRoute>
          }
        />
        <Route
          path="/visitantes"
          element={
            <PrivateRoute>
              <Visitantes />
            </PrivateRoute>
          }
        />
        <Route
          path="/registro-viagem"
          element={
            <PrivateRoute>
              <RegistroViagem />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
