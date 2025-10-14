import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import api from "../api/axios";

export default function GerenciarLinhas() {
  const [cidades, setCidades] = useState([]);
  const [novaCidade, setNovaCidade] = useState("");
  const [novaUf, setNovaUf] = useState("");
  const [pontos, setPontos] = useState([]);
  const [nomePonto, setNomePonto] = useState("");
  const [cidadeSelecionada, setCidadeSelecionada] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [novaRota, setNovaRota] = useState("");
  const [motoristas, setMotoristas] = useState([]);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [horaPartida, setHoraPartida] = useState("");
  const [horaChegada, setHoraChegada] = useState("");
  const [pontoSelecionado, setPontoSelecionado] = useState("");
  const [pontosRota, setPontosRota] = useState([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("");
  const [colaboradoresRota, setColaboradoresRota] = useState([]);
  const [liderSelecionado, setLiderSelecionado] = useState("");
  const [rotas, setRotas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  useEffect(() => {
    api
      .get("/cidades")
      .then((res) => {
        setCidades(res.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar cidades:", err);
      });
  }, []);
useEffect(() => {
  api
    api.get("/motorista?status=ativo")// 👈 verifique se sua rota é "/motoristas" (no plural)
    .then((res) => setMotoristas(res.data))
    .catch((err) => console.error("Erro ao buscar motoristas:", err));
}, []);
      // Garante que cada motorista tenha id e nome válidos
      // 🔹 Busca motoristas ativos
useEffect(() => {
  api
    .get("/motorista") // ✅ Corrigido (singular)
    .then((res) => setMotoristas(res.data))
    .catch((err) => {
      console.error("Erro ao buscar motoristas:", err.response?.data || err.message);
    });
}, []);

  useEffect(() => {
    api
      .get("/rotas")
      .then((res) => {
        setRotas(res.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar rotas", err);
      });
  }, []);
  useEffect(() => {
    api
      .get("/colaboradores")
      .then((res) => {
        setColaboradores(res.data);
      })
      .catch((err) => {
        console.error("Erro ao buscar colaboradores", err);
      });
  }, []);

  const handleAdicionarCidade = async () => {
    if (!novaCidade.trim() || !novaUf.trim()) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const response = await api.post("/cidades", {
        nome: novaCidade,
        uf: novaUf.toUpperCase(),
      });

      setCidades([...cidades, response.data]);
      setNovaCidade("");
      setNovaUf("");
      alert("Cidade adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar cidade:", error);
      alert("Erro ao cadastrar cidade.");
    }
  };

  useEffect(() => {
    api
      .get("/pontos")
      .then((res) => setPontos(res.data))
      .catch((err) => console.error("Erro ao buscar pontos:", err));
  }, []);

  const getCoordenadas = async (enderecoCompleto) => {
    const apiKey = "AIzaSyCrNiQt-qPLaFQRKrLJtAeGYMx8eZLB-4U";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      enderecoCompleto
    )}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      throw new Error("Endereço não encontrado.");
    }
  };

  const handleCadastrarPonto = async () => {
    if (
      !cidadeSelecionada ||
      !nomePonto.trim() ||
      !rua.trim() ||
      !numero.trim()
    ) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const cidadeObj = cidades.find(
        (c) => c.idCidade === Number(cidadeSelecionada)
      );
      const enderecoCompleto = `${rua}, ${numero}, ${cidadeObj.nome} - ${cidadeObj.uf}`;

      // Converte o endereço em latitude e longitude
      const { lat, lng } = await getCoordenadas(enderecoCompleto);

      const response = await api.post("/pontos", {
        nome: nomePonto,
        endereco: `${rua}, ${numero}`,
        latitude: lat,
        longitude: lng,
        idCidade: cidadeSelecionada,
      });

      setPontos([...pontos, response.data]);
      setNomePonto("");
      setRua("");
      setNumero("");
      alert("Ponto cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar ponto:", error);
      alert("Erro ao cadastrar ponto.");
    }
  };

  const handleAdicionarPontoNaRota = () => {
    if (!pontoSelecionado) return alert("Selecione um ponto!");
    const ponto = pontos.find((p) => p.idPonto === Number(pontoSelecionado));
    if (!pontosRota.some((p) => p.idPonto === ponto.idPonto)) {
      setPontosRota([...pontosRota, ponto]);
    }
  };

  const handleAdicionarColaborador = () => {
    if (!colaboradorSelecionado) return alert("Selecione um colaborador!");
    if (colaboradoresRota.length >= capacidade)
      return alert("Capacidade máxima atingida!");
    const colaborador = colaboradores.find(
      (c) => c.idColaborador === Number(colaboradorSelecionado)
    );
    if (
      !colaboradoresRota.some(
        (c) => c.idColaborador === colaborador.idColaborador
      )
    ) {
      setColaboradoresRota([...colaboradoresRota, colaborador]);
    }
  };

  const handleCadastrarRota = async () => {
    if (!novaRota || !cidadeSelecionada || !motoristaSelecionado)
      return alert("Preencha todos os campos obrigatórios!");

    try {
      const response = await api.post("/rotas", {
        nome: novaRota,
        idCidade: cidadeSelecionada,
        idMotorista: motoristaSelecionado,
        capacidade,
        horaPartida,
        horaChegada,
        pontos: pontosRota.map((p) => p.idPonto),
        colaboradores: colaboradoresRota.map((c) => c.idColaborador),
        lider: liderSelecionado,
      });
      alert("Rota cadastrada com sucesso!");
      console.log(response.data);
    } catch (error) {
      console.error("Erro ao cadastrar rota:", error);
      alert("Erro ao cadastrar rota.");
    }
  };

  return (
    <div className="bg-[#E6E6E6] min-h-screen flex flex-col lg:flex-row items-start gap-4">
      <Navbar />
      <div className="flex flex-1 flex-col justify-center items-center mr-[10px] w-full">
        <h1 className="text-3xl font-bold mb-10  text-[#3B7258] mt-10">
          Gerenciar Linhas
        </h1>

        {/* CADASTRO DE PONTOS */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[600px] h-[500px]">
            <h1 className="text-xl font-semibold mb-4">Cadastrar ponto</h1>
            <p className="text-sm text-gray-600 mb-4">
              Adicione novos pontos de parada com geolocalização automática
            </p>
            {/* primeira linha */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nova cidade"
                value={novaCidade}
                onChange={(e) => setNovaCidade(e.target.value)}
                className="border border-gray-500 rounded-lg px-4 py-2 w-full text-base "
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
{/* segunda linha */}
            <div className="flex flex-col mb-4">
              <label
                htmlFor="cidade"
                className="text-sm font-semibold text-gray-800 mb-1"
              >
                Cidade
              </label>

              <select
                id="cidade"
                className="border border-gray-500 rounded-md px-3 py-2 text-sm text-gray-600"
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
              <label className="text-sm font-semibold text-gray-800 mb-1">
                Nome do Ponto
              </label>
              <input
                className="border border-gray-500 rounded-lg p-2  w-full text-sm"
                placeholder="Nome do ponto"
                value={nomePonto}
                onChange={(e) => setNomePonto(e.target.value)}
              />
            </div>

            <div className="flex flex-col mb-4">
              <div className="flex gap-4">
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-semibold text-gray-800 mb-1">
                    Rua
                  </label>
                  <input
                    className="border border-gray-500 rounded-lg p-2 w-full text-sm"
                    placeholder="Rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-semibold text-gray-800 mb-1">
                    Número
                  </label>
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
              className="bg-[#038C3E] text-white w-full py-2 text-lg rounded-lg flex items-center justify-center gap-3 hover:bg-[#027a36] transition
              "
              onClick={handleCadastrarPonto}
            >
              <img
                src="src/assets/map-pin.svg"
                alt="location"
                className="w-6 h-6"
              />
              Cadastrar Ponto
            </button>
          </div>

          {/* Lista */}
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[600px] h-[500px]">
            <h1 className="text-xl font-semibold mb-4">Pontos cadastrados</h1>
            <p className="text-sm text-gray-600 mb-4">
              Lista de todos os pontos
            </p>
            <div className="flex flex-col gap-2 h-[350px] overflow-y-auto">
              {pontos.map((ponto, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="src/assets/map-pin.svg"
                      alt="ponto"
                      className="w-5 h-5"
                    />
                    <span>{ponto.nome}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ROTAS */}
        <div className="mb-6">
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[1220px]">
            <h1 className="text-xl font-semibold mb-6">Cadastrar Rota</h1>

            {/* Linha 1 - Nome, Cidade, Motorista */}
            <div className="flex gap-4 mb-3 items-end">
              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Nome da Rota
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rota Matinal"
                  value={novaRota}
                  onChange={(e) => setNovaRota(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 w-full text-base"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Cidade
                </label>
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
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Motorista
                </label>
                <select
                  value={motoristaSelecionado}
                  onChange={(e) => setMotoristaSelecionado(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600"
                >
                  <option value="">Selecione</option>
                  {motoristas.map((m) => (
                    <option key={m.idMotorista} value={m.idMotorista}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha 2 - Capacidade e horários */}
            <div className="flex gap-4 mb-3 items-end">
              <div className="flex flex-col w-32">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Capacidade
                </label>
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
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Horário de Partida
                </label>
                <input
                  type="time"
                  value={horaPartida}
                  onChange={(e) => setHoraPartida(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Horário de Chegada
                </label>
                <input
                  type="time"
                  value={horaChegada}
                  onChange={(e) => setHoraChegada(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            {/* Linha 3 - Pontos da rota */}
            <div className="flex flex-col mb-3">
              <label className="text-sm font-semibold text-gray-800 mb-1">
                Pontos da Rota
              </label>
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
              <ul className="list-disc ml-6 text-sm text-gray-700">
                {pontosRota.map((p, i) => (
                  <li key={i}>{p.nome}</li>
                ))}
              </ul>
            </div>

            {/*  Colaboradores */}
            <div className="flex flex-col mb-3">
              <label className="text-sm font-semibold text-gray-800 mb-1">
                Colaboradores ({colaboradoresRota.length}/{capacidade})
              </label>
              <div className="flex gap-3 mb-3">
                <select
                  value={colaboradorSelecionado}
                  onChange={(e) => setColaboradorSelecionado(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600 flex-1"
                >
                  <option value="">Selecione um colaborador</option>
                  {colaboradores.map((c) => (
                    <option key={c.idColaborador} value={c.idColaborador}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAdicionarColaborador}
                  disabled={colaboradoresRota.length >= capacidade}
                  className={`px-6 py-2 rounded-lg ${
                    colaboradoresRota.length >= capacidade
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#038C3E] text-white hover:bg-[#027a36]"
                  }`}
                >
                  Adicionar
                </button>
              </div>
              <ul className="list-disc ml-6 text-sm text-gray-700">
                {colaboradoresRota.map((c, i) => (
                  <li key={i}>{c.nome}</li>
                ))}
              </ul>
            </div>

            {/* Lideres */}
            <div className="flex flex-col mb-4">
              <label className="text-sm font-semibold text-gray-800 mb-2">
                Selecionar Líderes
              </label>
              <select
                value={liderSelecionado}
                onChange={(e) => setLiderSelecionado(e.target.value)}
                className="border border-gray-500 rounded-lg px-4 py-3 text-gray-600 flex-1"
              >
                <option value="">Selecione um líder</option>
                {colaboradoresRota.map((c) => (
                  <option key={c.idColaborador} value={c.idColaborador}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão de cadastrar rota */}
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
