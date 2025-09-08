import { useState } from "react";
import api from "../api/axios"
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/login", { email, senha });

      const token = response.data.token;
      localStorage.setItem("token", token);//se pegar o token vai p home
      navigate("/home");
    } catch (err) {
      setError("Email ou senha inválidos.");
    }
  };

   return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#859990] to-[#003918] flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white/20 p-6 rounded-2xl shadow-md w-96 flex flex-col items-center"
      >
        <h2 className="text-white text-2xl font-semi-bold mb-4 text-center">TrackPass</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="m-50 bg-white/30 w-full text-white placeholder-white p-2 rounded-lg mb-8"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="bg-white/30 w-full text-white placeholder-white p-2 rounded-lg mb-8"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          type="submit"
          className="w-40 bg-white/40 text-white p-2 rounded-md hover:bg-green-600"
        >
          ENTRAR
        </button>
      </form>
    </div>
  );
}