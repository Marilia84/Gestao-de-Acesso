import { useState } from "react";
import api from "../api/axios"
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logoB.png";

export default function Login() {
  const navigate = useNavigate();
  const [username, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", { username, senha });

      const token = response.data.token;
      localStorage.setItem("token", token);//se pegar o token vai p home
      navigate("/home");
    } catch (err) {
      setError("Email ou senha inválidos.");
    }
  };
// tem que barrar as outras roles, permitir somente gestor no front web
// colocar toarst
   return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#859990]  to-[#003918] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/15 p-10 border border-white/30 rounded-3xl shadow-md  w-96 h-120 flex flex-col items-center"
      >
        <img className="w-28 h-20"  src={Logo} alt="Logo de onibus"/>
        <h2 className="text-white text-3xl font-bold mb-12 text-center">TrackPass</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

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
          className="bg-white/30 w-full text-white placeholder-white/70 p-2 rounded-lg mb-8"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          type="submit"
          className="w-40 bg-white/40 text-white/70 p-2 rounded-lg hover:bg-green-600"
        >
          ENTRAR
        </button>
      </form>
    </div>
  );
}