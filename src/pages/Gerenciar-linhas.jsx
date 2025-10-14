import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function GerenciarLinhas() {
  const [tokenOk, setTokenOk] = useState(false);

  const [cidades, setCidades] = useState([]);
  const [novaCidade, setNovaCidade] = useState("");
  const [novaUf, setNovaUf] = useState("");

  const [pontos, setPontos] = useState([]);
  const [nomePonto, setNomePonto] = useState("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");

  const [novaRota, setNovaRota] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [horaPartida, setHoraPartida] = useState("");
  const [horaChegada, setHoraChegada] = useState("");
  const [periodo, setPeriodo] = useState("");

  const [pontoSelecionado, setPontoSelecionado] = useState("");
  const [pontosRota, setPontosRota] = useState([]);

  const [rotas, setRotas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [motoristas, setMotoristas] = useState([]);

  // Garante token no header da instância api
  useEffect(() => {
    try {
      const t = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (t) {
        api.defaults.headers.common.Authorization = `Bearer ${t}`;
        setTokenOk(true);
      } else {
        console.warn("Token não encontrado em local/sessionStorage.");
      }
    } catch (e) {
      console.warn("Não foi possível ler o token do storage:", e);
    }
  }, []);

  // Cargas iniciais
  useEffect(() => {
    if (!tokenOk) return;

    const carregarTudo = async () => {
      try {
        const [cidadesRes, pontosRes, rotasRes, colabsRes, motosRes] = await Promise.all([
          api.get("/cidades"),
          api.get("/pontos"),
          api.get("/rotas"),
          api.get("/colaboradores"),
          api.get("/motorista?status=ativo"),
        ]);

        setCidades(cidadesRes.data || []);
        setPontos(pontosRes.data || []);
        setRotas(rotasRes.data || []);
        setColaboradores(colabsRes.data || []);
        setMotoristas(motosRes.data || []);
      } catch (err) {
        console.error("Erro nas cargas iniciais:", err.response?.data || err.message || err);
      }
    };

    carregarTudo();
  }, [tokenOk]);

  // Util: normaliza “HH:mm” -> “HH:mm:ss”
  const toHMS = (hhmm) => {
    if (!hhmm) return "";
    return /^\d{2}:\d{2}$/.test(hhmm) ? `${hhmm}:00` : hhmm;
  };

  const getCoordenadas = async (enderecoCompleto) => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      enderecoCompleto
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    throw new Error("Endereço não encontrado.");
  };

  const handleAdicionarCidade = async () => {
    if (!novaCidade.trim() || !novaUf.trim()) {
      alert("Preencha cidade e UF.");
      return;
    }

    try {
      const response = await api.post("/cidades", {
        nome: novaCidade.trim(),
        uf: novaUf.trim().toUpperCase(),
      });

      setCidades((prev) => [...prev, response.data]);
      setNovaCidade("");
      setNovaUf("");
      alert("Cidade adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar cidade:", error.response?.data || error);
      alert("Erro ao cadastrar cidade.");
    }
  };

  const handleCadastrarPonto = async () => {
    if (!cidadeSelecionada || !nomePonto.trim() || !rua.trim() || !numero.trim()) {
      alert("Preencha todos os campos do ponto.");
      return;
    }

    try {
      const cidadeObj = cidades.find((c) => String(c.idCidade) === String(cidadeSelecionada));
      if (!cidadeObj) {
        alert("Cidade inválida.");
        return;
      }

      const enderecoCompleto = `${rua}, ${numero}, ${cidadeObj.nome} - ${cidadeObj.uf}`;
      const { lat, lng } = await getCoordenadas(enderecoCompleto);

      const response = await api.post("/pontos", {
        nome: nomePonto.trim(),
        endereco: `${rua.trim()}, ${numero.trim()}`,
        latitude: lat,
        longitude: lng,
        idCidade: Number(cidadeSelecionada),
      });

      setPontos((prev) => [...prev, response.data]);
      setNomePonto("");
      setRua("");
      setNumero("");
      alert("Ponto cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar ponto:", error.response?.data || error);
      alert("Erro ao cadastrar ponto.");
    }
  };

  const handleAdicionarPontoNaRota = () => {
    if (!pontoSelecionado) {
      alert("Selecione um ponto.");
      return;
    }
    const ponto = pontos.find((p) => String(p.idPonto) === String(pontoSelecionado));
    if (!ponto) {
      alert("Ponto inválido.");
      return;
    }
    if (pontosRota.some((p) => String(p.idPonto) === String(ponto.idPonto))) {
      alert("Este ponto já foi adicionado à rota.");
      return;
    }
    setPontosRota((prev) => [...prev, ponto]);
    setPontoSelecionado("");
  };

  const handleCadastrarRota = async () => {
    if (
      !novaRota.trim() ||
      !cidadeSelecionada ||
      !periodo ||
      !capacidade ||
      !horaPartida ||
      !horaChegada ||
      pontosRota.length === 0
    ) {
      alert("Preencha todos os campos obrigatórios da rota.");
      return;
    }

    // Ajusta tipos/formato
    const payload = {
      nome: novaRota.trim(),
      idCidade: Number(cidadeSelecionada),
      periodo,                          // certifique-se que casa com o enum do backend
      capacidade: Number(capacidade),
      ativo: true,
       horaPartida: horaPartida.length > 5 ? horaPartida.substring(0, 5) : horaPartida, // Garante que seja "HH:mm"
      horaChegada: horaChegada.length > 5 ? horaChegada.substring(0, 5) : horaChegada, // Garante que seja "HH:mm" // HH:mm:ss
      pontos: pontosRota.map((p, i) => ({
        idPonto: Number(p.idPonto),
        ordem: i + 1,
      })),
    };

    try {
      // log de depuração útil
      console.log(" Payload rota:", payload);
      const res = await api.post("/rotas", payload);
      alert("Rota cadastrada com sucesso!");
      console.log(" Resposta:", res.data);

      // limpa
      setNovaRota("");
      setPeriodo("");
      setCapacidade("");
      setHoraPartida("");
      setHoraChegada("");
      setPontosRota([]);

      // atualiza lista
      const rotasRes = await api.get("/rotas");
      setRotas(rotasRes.data || []);
    } catch (error) {
      const data = error.response?.data;
      console.error("❌ Erro ao cadastrar rota:", data || error.message || error);
      alert(
        `Erro ao cadastrar rota.${
          data?.message ? `\nMensagem: ${data.message}` : ""
        }${data?.error ? `\nDetalhe: ${data.error}` : ""}`
      );
    }
  };

  return (
    <div className="bg-[#E6E6E6] min-h-screen flex flex-col lg:flex-row items-start gap-4">
      <Navbar />
      <div className="flex flex-1 flex-col justify-center items-center mr-[10px] w-full">
        <h1 className="text-3xl font-bold mb-10 text-[#3B7258] mt-10">Gerenciar Linhas</h1>

        {/* CADASTRO DE PONTOS */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[600px] h-[500px]">
            <h1 className="text-xl font-semibold mb-4">Cadastrar ponto</h1>
            <p className="text-sm text-gray-600 mb-4">
              Adicione novos pontos de parada com geolocalização automática
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nova cidade"
                value={novaCidade}
                onChange={(e) => setNovaCidade(e.target.value)}
                className="border border-gray-500 rounded-lg px-4 py-2 w-full text-base"
              />
              <input
                type="text"
                placeholder="UF"
                maxLength={2}
                value={novaUf}
                onChange={(e) => setNovaUf(e.target.value.toUpperCase())}
                className="border border-gray-500 rounded-lg px-4 py-2 w-24 text-base text-center uppercase"
              />
              <button
                onClick={handleAdicionarCidade}
                className="bg-[#038C3E] text-white w-40 px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#027a36] transition"
              >
                Adicionar
              </button>
            </div>

            <div className="flex flex-col mb-4">
              <label htmlFor="cidade" className="text-sm font-semibold text-gray-800 mb-1">
                Cidade
              </label>
              <select
                id="cidade"
                className="border border-gray-500 rounded-md px-3 py-2 text-sm text-gray-600"
                value={cidadeSelecionada}
                onChange={(e) => setCidadeSelecionada(e.target.value)}
              >
                <option value="">Selecione</option>
                {cidades.map((cidade) => (
                  <option key={cidade.idCidade} value={cidade.idCidade}>
                    {cidade.nome} - {cidade.uf}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col mb-4">
              <label className="text-sm font-semibold text-gray-800 mb-1">Nome do Ponto</label>
              <input
                className="border border-gray-500 rounded-lg p-2 w-full text-sm"
                placeholder="Nome do ponto"
                value={nomePonto}
                onChange={(e) => setNomePonto(e.target.value)}
              />
            </div>

            <div className="flex flex-col mb-4">
              <div className="flex gap-4">
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-semibold text-gray-800 mb-1">Rua</label>
                  <input
                    className="border border-gray-500 rounded-lg p-2 w-full text-sm"
                    placeholder="Rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-semibold text-gray-800 mb-1">Número</label>
                  <input
                    className="border border-gray-500 rounded-lg p-2 w-full text-sm"
                    placeholder="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              className="bg-[#038C3E] text-white w-full py-2 text-lg rounded-lg flex items-center justify-center gap-3 hover:bg-[#027a36] transition"
              onClick={handleCadastrarPonto}
            >
              <img src="src/assets/map-pin.svg" alt="location" className="w-6 h-6" />
              Cadastrar Ponto
            </button>
          </div>

          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[600px] h-[500px]">
            <h1 className="text-xl font-semibold mb-4">Pontos cadastrados</h1>
            <p className="text-sm text-gray-600 mb-4">Lista de todos os pontos</p>
            <div className="flex flex-col gap-2 h-[350px] overflow-y-auto">
              {pontos.map((ponto) => (
                <div
                  key={ponto.idPonto}
                  className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                >
                  {ponto.nome}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROTAS */}
        <div className="mb-6">
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[1220px]">
            <h1 className="text-xl font-semibold mb-6">Cadastrar Rota</h1>

            <div className="flex gap-4 mb-3 items-end">
              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">Nome da Rota</label>
                <input
                  type="text"
                  placeholder="Ex: Rota Matinal"
                  value={novaRota}
                  onChange={(e) => setNovaRota(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 w-full text-base"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">Cidade</label>
                <select
                  value={cidadeSelecionada}
                  onChange={(e) => setCidadeSelecionada(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600"
                >
                  <option value="">Selecione</option>
                  {cidades.map((cidade) => (
                    <option key={cidade.idCidade} value={cidade.idCidade}>
                      {cidade.nome} - {cidade.uf}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">Período</label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600"
                >
                  <option value="">Selecione</option>
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOITE">Noite</option>
                  <option value="MADRUGADA">Madrugada</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mb-3 items-end">
              <div className="flex flex-col w-32">
                <label className="text-sm font-semibold text-gray-800 mb-1">Capacidade</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  value={capacidade}
                  onChange={(e) => setCapacidade(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-center"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">Horário de Partida</label>
                <input
                  type="time"
                  value={horaPartida}
                  onChange={(e) => setHoraPartida(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">Horário de Chegada</label>
                <input
                  type="time"
                  value={horaChegada}
                  onChange={(e) => setHoraChegada(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="flex flex-col mb-3">
              <label className="text-sm font-semibold text-gray-800 mb-1">Pontos da Rota</label>
              <div className="flex gap-3 mb-3">
                <select
                  value={pontoSelecionado}
                  onChange={(e) => setPontoSelecionado(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600 flex-1"
                >
                  <option value="">Selecione um ponto</option>
                  {pontos.map((p) => (
                    <option key={p.idPonto} value={p.idPonto}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAdicionarPontoNaRota}
                  className="bg-[#038C3E] text-white px-6 py-2 rounded-lg hover:bg-[#027a36]"
                >
                  Adicionar
                </button>
              </div>
              <ol className="list-decimal ml-6 text-sm text-gray-700">
                {pontosRota.map((p, i) => (
                  <li key={p.idPonto}>{i + 1}. {p.nome}</li>
                ))}
              </ol>
            </div>

            <button
              onClick={handleCadastrarRota}
              className="bg-[#038C3E] text-white w-full py-4 text-lg rounded-lg hover:bg-[#027a36] transition"
            >
              Cadastrar Rota
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
