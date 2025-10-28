import { useState } from "react";
import api from "../api/axios"
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logoB.png";
import Fundo from "../assets/fundo.png";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const navigate = useNavigate();
  const [username, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [forcaSenha, setForcaSenha] = useState("");
  const [loading, setLoading] = useState(false); // 👈 novo estado

  function validarSenhaForte(senha) {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._])[A-Za-z\d@$!%*?&._]{8,}$/;
    return regex.test(senha);
  }

  function avaliarForcaSenha(senha) {
    if (senha.length === 0) return "";
    let score = 0;
    if (senha.length >= 8) score++;
    if (/[A-Z]/.test(senha)) score++;
    if (/[a-z]/.test(senha)) score++;
    if (/\d/.test(senha)) score++;
    if (/[@$!%*?&._]/.test(senha)) score++;

    if (score <= 2) return "Fraca";
    if (score <= 4) return "Média";
    return "Forte";
  }

  const handleSenhaChange = (e) => {
    setSenha(e.target.value);
    setForcaSenha(avaliarForcaSenha(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // 👈 começa o carregamento


    try {
      const response = await api.post("/auth/login", { username, senha });

      if(response.status === 403){
        setError("Email ou senha inválidos.");
        setLoading(false);
        return;
      }
      if(response.data.role !== "GESTOR"){
        setError("Acesso permitido somente para gestores.");
        setLoading(false);
        return;
      }

      const token = response.data.token;
      localStorage.setItem("token", token);
      navigate("/home");
    } catch (err) {
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false); // 👈 encerra o carregamento sempre
    }
  };

  const corForcaSenha = {
    "Fraca": "bg-red-500",
    "Média": "bg-yellow-400",
    "Forte": "bg-green-500"
  };

  const Spinner = () => (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
  );

  return (
    <div
      className="h-screen w-screen bg-cover flex items-center justify-center"
      style={{ backgroundImage: `url(${Fundo})` }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white/15 cursor-white p-10 border border-white/30 rounded-3xl shadow-md w-96 h-120 flex flex-col items-center"
      >
        <img className="w-28 h-20" src={Logo} alt="Logo de onibus"/>
        <h2 className="text-white text-3xl font-bold mb-12 text-center">TrackPass</h2>

        {error && (
          <div className="bg-red-200/80 border border-red-400 text-red-700 p-4 rounded-md mb-4 text-center">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="m-50 bg-white/30 w-full text-white placeholder-white/70 p-2 rounded-lg mb-8"
          value={username}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="bg-white/30 w-full text-white placeholder-white/70 p-2 rounded-lg mb-2"
          value={senha}
          onChange={handleSenhaChange}
        />

        {forcaSenha && (
          <div className="w-full mb-4">
            <div className="h-2 rounded-full bg-gray-300">
              <div
                className={`h-2 rounded-full ${corForcaSenha[forcaSenha]}`}
                style={{ width: forcaSenha === "Fraca" ? "33%" : forcaSenha === "Média" ? "66%" : "100%" }}
              ></div>
            </div>
            <p className="text-white text-sm mt-1 text-center">{forcaSenha}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-40 p-2 rounded-lg transition-colors duration-300 flex items-center justify-center ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-white/40 text-white/70 hover:bg-green-600"
          }`}
        >
          {loading ? <Spinner /> : "ENTRAR"}
        </button>

      </form>
      <ToastContainer />
    </div>
  );
}
