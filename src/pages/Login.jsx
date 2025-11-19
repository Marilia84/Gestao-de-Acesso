// src/pages/Login.jsx
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logoB.png";
import Fundo from "../assets/fundo.png";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";

const loginSchema = z.object({
  username: z
    .string()
    .nonempty("Informe o e-mail.")
    .email("Formato de e-mail inválido."),
  senha: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .regex(/[a-z]/, "A senha deve conter letra minúscula.")
    .regex(/[A-Z]/, "A senha deve conter letra maiúscula.")
    .regex(/\d/, "A senha deve conter número.")
    .regex(
      /[@$!%*?&._]/,
      "A senha deve conter caractere especial (@$!%*?&._)."
    ),
});

// Reaproveitando as regras do schema para feedback em tempo real
const emailSchema = loginSchema.shape.username;
const senhaSchema = loginSchema.shape.senha;

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [senha, setSenha] = useState("");

  // error = mensagem do erro interno (servidor/network)
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState(false);

  // authError = mensagem de erro de autenticação (403, credencial inválida, acesso não permitido)
  const [authError, setAuthError] = useState("");

  const [loading, setLoading] = useState(false);

  // controle visual (quando o campo já foi "tocado")
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedSenha, setTouchedSenha] = useState(false);

  // progresso do alerta (0 a 100)
  const [alertProgress, setAlertProgress] = useState(0);

  const Spinner = () => (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
  );

  // --- FEEDBACK EM TEMPO REAL USANDO ZOD ---
  const emailStatus =
    touchedEmail && username.length > 0
      ? emailSchema.safeParse(username)
      : null;

  const senhaStatus =
    touchedSenha && senha.length > 0 ? senhaSchema.safeParse(senha) : null;

  const emailMessage = () => {
    if (!touchedEmail) return "Digite seu e-mail corporativo";
    if (username.length === 0) return "Informe o e-mail.";
    if (!emailStatus) return "Digite seu e-mail corporativo";

    if (emailStatus.success) return "E-mail em formato válido.";
    return emailStatus.error.issues[0]?.message ?? "E-mail inválido.";
  };

  const senhaMessage = () => {
    if (!touchedSenha) return "Digite sua senha de acesso";
    if (senha.length === 0) return "Informe a senha.";
    if (!senhaStatus) return "Digite sua senha de acesso";

    if (senhaStatus.success) return "Senha forte e dentro do padrão.";
    return senhaStatus.error.issues[0]?.message ?? "Senha inválida.";
  };

  const handleEmailChange = (e) => {
    setUsername(e.target.value);
    if (!touchedEmail) setTouchedEmail(true);
  };

  const handleSenhaChange = (e) => {
    setSenha(e.target.value);
    if (!touchedSenha) setTouchedSenha(true);
    // Limpando erro de autenticação enquanto o usuário digita de novo
    if (authError) setAuthError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // zera qualquer alerta anterior
    setError("");
    setServerError(false);
    setAuthError("");
    setAlertProgress(0);
    setLoading(true);

    const result = loginSchema.safeParse({ username, senha });

    if (!result.success) {
      // Apenas marca como tocados para os erros aparecerem nos inputs
      setTouchedEmail(true);
      setTouchedSenha(true);
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/login", { username, senha });

      if (response.status === 403) {
        setServerError(false);
        setAuthError("Email ou senha inválidos.");
        setLoading(false);
        return;
      }

      if (response.data.role !== "GESTOR") {
        setServerError(false);
        setAuthError("Acesso permitido somente para gestores.");
        setLoading(false);
        return;
      }

      const token = response.data.token;
      localStorage.setItem("token", token);
      navigate("/home");
    } catch (err) {
      console.error("Erro na requisição de login:", err);

      const status = err.response?.status;

      // 👉 Se o backend NÃO retornar (sem response = erro de rede, timeout, CORS, servidor offline etc.)
      if (!err.response) {
        setServerError(true);
        setError(
          "Não foi possível se conectar ao servidor. Tente novamente em alguns instantes."
        );
      } else if (status && status >= 500) {
        // Erros 5xx
        setServerError(true);
        setError(
          "Ocorreu um erro interno no servidor. Tente novamente em alguns instantes."
        );
      } else {
        // Erros "normais" (401, 403, 404, etc.) -> erro de credencial
        setServerError(false);
        setAuthError("Email ou senha inválidos.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Flags para bordas dos inputs (apenas Zod)
  const emailHasError =
    touchedEmail && username.length > 0 && emailStatus && !emailStatus.success;
  const emailIsValid =
    touchedEmail && username.length > 0 && emailStatus?.success;

  const senhaHasError =
    touchedSenha && senha.length > 0 && senhaStatus && !senhaStatus.success;
  const senhaIsValid =
    touchedSenha && senha.length > 0 && senhaStatus?.success;

  const baseInputClasses =
    "bg-white/15 w-full text-sm text-white placeholder-white/60 px-3 py-2.5 rounded-lg outline-none border border-white/10 focus:ring-2 transition-all";

  // --- CONTROLE DO ALERT (auto-close + barra de progresso) ---
  useEffect(() => {
    const hasAlert = (serverError && error) || (!serverError && authError);
    if (!hasAlert) {
      setAlertProgress(0);
      return;
    }

    const duration = 5000; // 5 segundos
    const stepMs = 100;
    const step = 100 / (duration / stepMs);

    setAlertProgress(0);

    const intervalId = setInterval(() => {
      setAlertProgress((prev) => {
        const next = prev + step;
        return next >= 100 ? 100 : next;
      });
    }, stepMs);

    const timeoutId = setTimeout(() => {
      setAlertProgress(0);
      if (serverError) {
        setServerError(false);
        setError("");
      } else if (authError) {
        setAuthError("");
      }
    }, duration);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [serverError, error, authError]);

  const handleCloseAlert = () => {
    setAlertProgress(0);
    if (serverError) {
      setServerError(false);
      setError("");
    }
    if (authError) {
      setAuthError("");
    }
  };

  // Componente visual do alerta (continua NO CANTO SUPERIOR DIREITO)
  const renderAlert = (title, message) => (
    <div className="fixed top-4 right-4 z-30 flex w-full max-w-sm overflow-hidden bg-white rounded-lg shadow-md border border-red-100">
      <div className="flex items-center justify-center w-12 bg-red-500">
        <svg
          className="w-6 h-6 text-white fill-current"
          viewBox="0 0 40 40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20 3.36667C10.8167 3.36667 3.3667 10.8167 3.3667 20C3.3667 29.1833 10.8167 36.6333 20 36.6333C29.1834 36.6333 36.6334 29.1833 36.6334 20C36.6334 10.8167 29.1834 3.36667 20 3.36667ZM19.1334 33.3333V22.9H13.3334L21.6667 6.66667V17.1H27.25L19.1334 33.3333Z" />
        </svg>
      </div>

      <div className="px-4 py-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="mx-1">
            <span className="font-semibold text-red-600 text-sm">{title}</span>
            <p className="text-sm text-gray-700 mt-0.5">{message}</p>
          </div>

          <button
            type="button"
            onClick={handleCloseAlert}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
            aria-label="Fechar alerta"
          >
            ✕
          </button>
        </div>

        {/* Barra de progresso na base do alerta */}
        <div className="mt-2 h-1 w-full bg-red-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${alertProgress}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="relative h-screen w-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${Fundo})` }}
    >
      {/* overlay escuro */}
      <div className="absolute inset-0 bg-slate-950/70" />

      {/* ALERTA DE ERRO INTERNO (CANTO SUPERIOR DIREITO) */}
      {serverError && error && renderAlert("Erro", error)}

      {/* ALERTA DE ERRO DE CREDENCIAL (MESMO ESTILO, MESMA POSIÇÃO) */}
      {!serverError && authError && renderAlert("Credenciais", authError)}

      {/* CARD PRINCIPAL DE LOGIN */}
      <div className="relative z-10 w-full max-w-md px-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/40 w-full px-8 py-10 flex flex-col items-center space-y-6"
        >
          <div className="flex flex-col items-center gap-2 mb-2">
            <img
              className="w-28 h-20 object-contain"
              src={Logo}
              alt="Logo de ônibus"
            />
            <h2 className="text-white text-3xl font-semibold tracking-wide">
              TrackPass
            </h2>
          </div>

          <div className="w-full space-y-4 mt-2">
            {/* CAMPO E-MAIL */}
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor="email"
                className="text-xs font-medium text-white/80 tracking-wide"
              >
                E-mail corporativo
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                className={`${baseInputClasses} ${
                  emailHasError
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/70"
                    : emailIsValid
                    ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/70"
                    : "focus:border-emerald-400 focus:ring-emerald-400/70"
                } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
                value={username}
                onChange={handleEmailChange}
                disabled={loading}
              />
              <span
                className={`mt-1 text-[11px] ${
                  !touchedEmail
                    ? "text-white/60"
                    : emailStatus?.success
                    ? "text-emerald-300"
                    : "text-amber-200"
                }`}
              >
                {emailMessage()}
              </span>
            </div>

            {/* CAMPO SENHA */}
            <div className="flex flex-col gap-1 w-full">
              <label
                htmlFor="senha"
                className="text-xs font-medium text-white/80 tracking-wide"
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                className={`${baseInputClasses} ${
                  senhaHasError
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/70"
                    : senhaIsValid
                    ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/70"
                    : "focus:border-emerald-400 focus:ring-emerald-400/70"
                } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
                value={senha}
                onChange={handleSenhaChange}
                disabled={loading}
              />
              <span
                className={`mt-1 text-[11px] ${
                  !touchedSenha
                    ? "text-white/60"
                    : senhaStatus?.success
                    ? "text-emerald-300"
                    : "text-amber-200"
                }`}
              >
                {senhaMessage()}
              </span>
            </div>
          </div>

          <div className="w-full flex justify-between items-center text-[11px] text-white/60 mt-1">
            <span>Ambiente restrito a gestores</span>
            <span className="italic">TrackPass · Gestão de Acesso</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center transition-all shadow-lg ${
              loading
                ? "bg-emerald-700/40 text-white/70 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-600 hover:shadow-emerald-900/40"
            }`}
          >
            {loading ? <Spinner /> : "ENTRAR"}
          </button>
        </form>
      </div>

      <ToastContainer />
    </div>
  );
}
