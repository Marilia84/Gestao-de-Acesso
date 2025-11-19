import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import GoogleMapaRota from "../components/GoogleMapaRota";
import ModalColaboradores from "../components/ModalColaboradores";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import PinIcon from "../assets/icon.png";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

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

  const [trajetosByRota, setTrajetosByRota] = useState({});
  const [loadingTrajeto, setLoadingTrajeto] = useState({});
  const [openModalColabs, setOpenModalColabs] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] = useState(null);

  // loadings
  const [loadingAdicionarCidade, setLoadingAdicionarCidade] = useState(false);
  const [loadingCadastrarPonto, setLoadingCadastrarPonto] = useState(false);
  const [loadingListaPontos, setLoadingListaPontos] = useState(true);
  const [loadingCadastrarRota, setLoadingCadastrarRota] = useState(false);
  const [loadingRotasCadastradas, setLoadingRotasCadastradas] =
    useState(true);

  const [activeTab, setActiveTab] = useState("PONTOS");

  useEffect(() => {
    try {
      const t =
        localStorage.getItem("token") || sessionStorage.getItem("token");
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

  useEffect(() => {
    if (!tokenOk) return;

    const carregarTudo = async () => {
      setLoadingListaPontos(true);
      setLoadingRotasCadastradas(true);

      try {
        const [cidadesRes, pontosRes, rotasRes, colabsRes] = await Promise.all([
          api.get("/cidades"),
          api.get("/pontos"),
          api.get("/rotas"),
          api.get("/colaboradores"),
        ]);
        const rotasLista = rotasRes.data || [];

        setCidades(cidadesRes.data || []);
        setPontos(pontosRes.data || []);
        setRotas(rotasLista);
        setColaboradores(colabsRes.data || []);

        await prefetchTrajetos(rotasLista);
      } catch (err) {
        console.error(
          "Erro nas cargas iniciais:",
          err.response?.data || err.message || err
        );
        toast.error("Não foi possível carregar os dados iniciais.");
      } finally {
        setLoadingListaPontos(false);
        setLoadingRotasCadastradas(false);
      }
    };

    carregarTudo();
  }, [tokenOk]);

  async function prefetchTrajetos(rotasLista) {
    const pendentes = (rotasLista || [])
      .filter((r) => r?.idRota && !trajetosByRota[r.idRota])
      .map((r) => r.idRota);

    if (!pendentes.length) return;

    setLoadingTrajeto((prev) =>
      pendentes.reduce((acc, id) => ({ ...acc, [id]: true }), { ...prev })
    );

    const results = await Promise.allSettled(
      pendentes.map((idRota) =>
        api
          .get(`/rotas/${idRota}/trajeto`)
          .then((res) => ({ idRota, data: res.data }))
      )
    );

    const novos = {};
    for (const r of results) {
      if (r.status === "fulfilled") {
        const { idRota, data } = r.value;
        const pontos = (data || [])
          .map((p) => ({
            idPonto: p.idPonto ?? p.id_ponto,
            nome: p.nomePonto ?? p.nome ?? p.nome_ponto ?? "",
            ordem: Number(p.ordem),
            lat: Number(
              typeof p.latitude === "string"
                ? p.latitude.replace(",", ".")
                : p.latitude
            ),
            lng: Number(
              typeof p.longitude === "string"
                ? p.longitude.replace(",", ".")
                : p.longitude
            ),
            endereco: p.endereco,
          }))
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        novos[idRota] = pontos;
      } else {
        console.warn("Falha ao buscar trajeto:", r.reason);
      }
    }

    setTrajetosByRota((prev) => ({ ...prev, ...novos }));
    setLoadingTrajeto((prev) =>
      pendentes.reduce((acc, id) => ({ ...acc, [id]: false }), { ...prev })
    );
  }

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
      toast.warn("Preencha cidade e UF.");
      return;
    }

    setLoadingAdicionarCidade(true);
    try {
      const response = await api.post("/cidades", {
        nome: novaCidade.trim(),
        uf: novaUf.trim().toUpperCase(),
      });

      setCidades((prev) => [...prev, response.data]);
      setNovaCidade("");
      setNovaUf("");
      toast.success("Cidade adicionada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao cadastrar cidade.");
    } finally {
      setLoadingAdicionarCidade(false);
    }
  };

  const handleCadastrarPonto = async () => {
    if (
      !cidadeSelecionada ||
      !nomePonto.trim() ||
      !rua.trim() ||
      !numero.trim()
    ) {
      toast.warn("Preencha todos os campos do ponto.");
      return;
    }

    setLoadingCadastrarPonto(true);
    try {
      const cidadeObj = cidades.find(
        (c) => String(c.idCidade) === String(cidadeSelecionada)
      );
      if (!cidadeObj) {
        toast.warn("Cidade inválida.");
        setLoadingCadastrarPonto(false);
        return;
      }

      const enderecoCompleto = `${rua}, ${numero}, ${cidadeObj.nome} - ${cidadeObj.uf}`;
      const { lat, lng } = await getCoordenadas(enderecoCompleto);

      const response = await api.post("/pontos", {
        nome: nomePonto.trim(),
        endereco: `${rua.trim()}, ${numero.trim()} ${cidadeObj.nome}`,
        latitude: lat,
        longitude: lng,
        idCidade: Number(cidadeSelecionada),
      });

      setPontos((prev) => [...prev, response.data]);
      setNomePonto("");
      setRua("");
      setNumero("");
      toast.success("Ponto cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar ponto:", error.response?.data || error);
      toast.error("Erro ao cadastrar ponto.");
    } finally {
      setLoadingCadastrarPonto(false);
    }
  };

  const handleAdicionarPontoNaRota = () => {
    if (!pontoSelecionado) {
      toast.warn("Selecione um ponto.");
      return;
    }
    const ponto = pontos.find(
      (p) => String(p.idPonto) === String(pontoSelecionado)
    );
    if (!ponto) {
      toast.warn("Ponto inválido.");
      return;
    }
    if (pontosRota.some((p) => String(p.idPonto) === String(ponto.idPonto))) {
      toast.warn("Este ponto já foi adicionado à rota.");
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
      toast.warn("Preencha todos os campos obrigatórios da rota.");
      return;
    }

    const payload = {
      nome: novaRota.trim(),
      idCidade: Number(cidadeSelecionada),
      periodo,
      capacidade: Number(capacidade),
      ativo: true,
      horaPartida:
        horaPartida.length > 5 ? horaPartida.substring(0, 5) : horaPartida,
      horaChegada:
        horaChegada.length > 5 ? horaChegada.substring(0, 5) : horaChegada,
      pontos: pontosRota.map((p, i) => ({
        idPonto: Number(p.idPonto),
        ordem: i + 1,
      })),
    };

    setLoadingCadastrarRota(true);
    try {
      await api.post("/rotas", payload);
      toast.success("Rota cadastrada com sucesso!");
      setNovaRota("");
      setPeriodo("");
      setCapacidade("");
      setHoraPartida("");
      setHoraChegada("");
      setPontosRota([]);

      setLoadingRotasCadastradas(true);
      const rotasRes = await api.get("/rotas");
      const rotasLista = rotasRes.data || [];
      setRotas(rotasLista);
      await prefetchTrajetos(rotasLista);
    } catch (error) {
      const data = error.response?.data;
      console.error(
        "❌ Erro ao cadastrar rota:",
        data || error.message || error
      );
      toast.error(
        `Erro ao cadastrar rota.${
          data?.message ? `\nMensagem: ${data.message}` : ""
        }${data?.error ? `\nDetalhe: ${data.error}` : ""}`
      );
    } finally {
      setLoadingCadastrarRota(false);
      setLoadingRotasCadastradas(false);
    }
  };

  const pontosFiltrados = cidadeSelecionada
    ? pontos.filter((p) => String(p.idCidade) === String(cidadeSelecionada))
    : [];

  return (
    <main
      className="
        flex-1 min-h-screen bg-slate-50
        px-3 sm:px-4 lg:px-6
        py-4
        ml-16
      "
    >
      <div
        className="
          w-full
          space-y-6
        "
      >
        {/* Cabeçalho da página */}
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold  text-emerald-600">
            Gerenciar linhas e rotas
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Cadastre cidades, pontos de parada e rotas, visualize o trajeto no
            mapa e gerencie os colaboradores de cada linha.
          </p>
        </header>

        {/* NAV DE ABAS */}
        <nav className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("PONTOS")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                activeTab === "PONTOS"
                  ? "bg-[#d5efe0] text-green-600"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Pontos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ROTAS")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                activeTab === "ROTAS"
                  ? "bg-[#d5efe0] text-green-600"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              Rotas
            </button>
          </div>
        </nav>

        {/* ABA PONTOS */}
        {activeTab === "PONTOS" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Cadastrar ponto */}
            <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-5 md:p-7 h-full min-h-[500px]">
              {(loadingAdicionarCidade || loadingCadastrarPonto) && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-10">
                  <Loading size={80} message="" />
                </div>
              )}

              <div className="flex flex-col gap-1 mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Cadastrar ponto
                </h2>
                <p className="text-xs text-slate-500">
                  Adicione novos pontos de parada com endereço e
                  geolocalização automática.
                </p>
              </div>

              {/* Nova cidade */}
              <div className="flex flex-col md:flex-row md:items-end gap-3 mb-6">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700">
                    Nova cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Joaquim da Barra"
                    value={novaCidade}
                    onChange={(e) => setNovaCidade(e.target.value)}
                    className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <div className="flex flex-col gap-1 w-20">
                    <label className="text-xs font-medium text-slate-700">
                      UF
                    </label>
                    <input
                      type="text"
                      placeholder="SP"
                      maxLength={2}
                      value={novaUf}
                      onChange={(e) => setNovaUf(e.target.value.toUpperCase())}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3 py-2 text-sm text-center uppercase text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    onClick={handleAdicionarCidade}
                    disabled={loadingAdicionarCidade}
                    className="mt-6 md:mt-auto bg-[#21BE67] hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-semibold w-full md:w-40 px-4 py-2.5 rounded-full flex items-center justify-center gap-2 transition"
                  >
                    {loadingAdicionarCidade
                      ? "Salvando..."
                      : "Adicionar cidade"}
                  </button>
                </div>
              </div>

              {/* Cidade / Nome ponto / Endereço */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="cidade"
                    className="text-xs font-medium text-slate-700"
                  >
                    Cidade do ponto
                  </label>
                  <select
                    id="cidade"
                    value={cidadeSelecionada}
                    onChange={(e) => setCidadeSelecionada(e.target.value)}
                    className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70"
                  >
                    <option value="">Selecione uma cidade</option>
                    {cidades.map((cidade) => (
                      <option key={cidade.idCidade} value={cidade.idCidade}>
                        {cidade.nome} - {cidade.uf}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-700">
                    Nome do ponto
                  </label>
                  <input
                    className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                    placeholder="Ex: Portaria Principal"
                    value={nomePonto}
                    onChange={(e) => setNomePonto(e.target.value)}
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex flex-col flex-1 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Rua
                    </label>
                    <input
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder="Ex: Rua José Roberto Mioto"
                      value={rua}
                      onChange={(e) => setRua(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col w-full md:w-32 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Número
                    </label>
                    <input
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                      placeholder="Ex: 123"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-end mt-6">
                <button
                  className="bg-[#21BE67] hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-7 py-2.5 text-sm font-semibold rounded-full flex items-center justify-center gap-2 transition"
                  onClick={handleCadastrarPonto}
                  disabled={loadingCadastrarPonto}
                >
                  {loadingCadastrarPonto ? "Cadastrando..." : "Cadastrar ponto"}
                </button>
              </div>
            </div>

            {/* Card: Pontos cadastrados */}
            <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-5 md:p-7 h-full min-h-[500px]">
              {loadingListaPontos && pontos.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <DotLottieReact
                      src="https://lottie.host/92a335e7-724d-44df-a65e-30c7025c8516/xC1YOtonin.lottie"
                      loop
                      autoplay
                      style={{ width: 260, height: 260, borderRadius: "12px" }}
                    />
                    <span className="text-sm font-medium text-emerald-500">
                      Carregando pontos...
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1 mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  Pontos cadastrados
                </h2>
                <p className="text-xs text-slate-500">
                  Visualize os pontos existentes e seus endereços completos.
                </p>
              </div>

              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
                {pontos.map((ponto) => (
                  <div
                    key={ponto.idPonto}
                    className="
                      group
                      border border-slate-400
                      px-3.5 py-2.5 
                      rounded-xl
                      cursor-pointer
                      transition-colors duration-150
                      hover:bg-[#f8f7f7]
                    "
                  >
                    <div className="flex items-start gap-3">
                      {/* ÍCONE À ESQUERDA */}
                      <img
                        src={PinIcon}
                        alt="Ícone de ponto"
                        className="w-20 h-15 flex-shrink-0"
                      />

                      {/* TEXTOS */}
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-800 group-hover:text-emerald-800">
                          {ponto.nome}
                        </span>
                        <span className="text-xs text-slate-500 group-hover:text-slate-700">
                          {ponto.endereco}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {!pontos.length && !loadingListaPontos && (
                  <p className="text-sm text-slate-400">
                    Nenhum ponto cadastrado até o momento.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ABA ROTAS */}
        {activeTab === "ROTAS" && (
          <>
            {/* Card: Cadastrar rota */}
            <section className="w-full">
              <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 md:p-8">
                {loadingCadastrarRota && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-10">
                    <Loading size={90} message="Salvando rota..." />
                  </div>
                )}

                <div className="flex flex-col gap-1 mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Cadastrar rota
                  </h2>
                  <p className="text-xs text-slate-500">
                    Defina o nome, cidade, período, horários e pontos que
                    compõem a rota.
                  </p>
                </div>

                {/* Linha 1: Nome, cidade, período */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
                  <div className="flex flex-col flex-1 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Nome da rota
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rota Matinal"
                      value={novaRota}
                      onChange={(e) => setNovaRota(e.target.value)}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col flex-1 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Cidade
                    </label>
                    <select
                      value={cidadeSelecionada}
                      onChange={(e) => setCidadeSelecionada(e.target.value)}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                    >
                      <option value="">Selecione</option>
                      {cidades.map((cidade) => (
                        <option key={cidade.idCidade} value={cidade.idCidade}>
                          {cidade.nome} - {cidade.uf}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col flex-1 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Período
                    </label>
                    <select
                      value={periodo}
                      onChange={(e) => setPeriodo(e.target.value)}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                    >
                      <option value="">Selecione</option>
                      <option value="MANHA">Manhã</option>
                      <option value="TARDE">Tarde</option>
                      <option value="NOITE">Noite</option>
                      <option value="MADRUGADA">Madrugada</option>
                    </select>
                  </div>
                </div>

                {/* Linha 2: Capacidade e horários */}
                <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
                  <div className="flex flex-col w-full md:w-32 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Capacidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qtd"
                      value={capacidade}
                      onChange={(e) => setCapacidade(e.target.value)}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-center text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col flex-1 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Horário de partida
                    </label>
                    <input
                      type="time"
                      value={horaPartida}
                      onChange={(e) => setHoraPartida(e.target.value)}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                    />
                  </div>

                  <div className="flex flex-col flex-1 gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Horário de chegada
                    </label>
                    <input
                      type="time"
                      value={horaChegada}
                      onChange={(e) => setHoraChegada(e.target.value)}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
                    />
                  </div>
                </div>

                {/* Pontos da rota */}
                <div className="flex flex-col mb-4">
                  <label className="text-xs font-medium text-slate-700 mb-1">
                    Pontos da rota
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    <select
                      value={pontoSelecionado}
                      onChange={(e) => setPontoSelecionado(e.target.value)}
                      className="border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 flex-1"
                    >
                      <option value="">Selecione um ponto</option>
                      {pontosFiltrados.map((p) => (
                        <option key={p.idPonto} value={p.idPonto}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAdicionarPontoNaRota}
                      className="mt-6 md:mt-auto bg-[#21BE67] hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold w-full sm:w-auto transition"
                    >
                      Adicionar ponto
                    </button>
                  </div>

                  <ol className="list-decimal ml-5 text-xs sm:text-sm text-slate-700 space-y-1 max-h-40 overflow-y-auto pr-1">
                    {pontosRota.map((p) => (
                      <li key={p.idPonto}>{p.nome}</li>
                    ))}
                  </ol>
                </div>

                <button
                  onClick={handleCadastrarRota}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white w-full py-2.5 text-sm sm:text-base font-semibold rounded-xl flex items-center justify-center gap-3 transition"
                  disabled={loadingCadastrarRota}
                >
                  {loadingCadastrarRota
                    ? "Cadastrando rota..."
                    : "Cadastrar rota"}
                </button>
              </div>
            </section>

            {/* Rotas cadastradas */}
            <section className="w-full">
              <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-5 lg:p-8 w-full max-h-[770px] overflow-y-auto">
                {loadingRotasCadastradas && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-10">
                    <Loading size={90} message="Carregando rotas..." />
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Rotas cadastradas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Visualize todas as rotas, seus pontos e o trajeto no mapa.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {rotas.map((rota) => {
                    const pontosDaRota = trajetosByRota[rota.idRota] || [];
                    return (
                      <div
                        key={rota.idRota}
                        className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-5 relative"
                      >
                        {/* ESQUERDA */}
                        <div className="flex-1 flex flex-col">
                          <div className="mb-2">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {rota.nome}{" "}
                              {rota.cidade?.nome
                                ? `• ${rota.cidade.nome}`
                                : ""}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {pontosDaRota.length} ponto
                              {pontosDaRota.length === 1 ? "" : "s"} cadastrados
                            </p>
                          </div>

                          <div className="flex items-center flex-wrap gap-2 mb-3">
                            <span className="text-[11px] text-slate-600 font-medium">
                              Período:
                            </span>
                            <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 uppercase tracking-wide">
                              {rota.periodo}
                            </span>
                            {rota.periodoSecundario && (
                              <span className="px-3 py-1 text-[11px] font-semibold rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wide">
                                {rota.periodoSecundario}
                              </span>
                            )}
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-2">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className="text-emerald-600"
                              >
                                <path
                                  fill="currentColor"
                                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5"
                                />
                              </svg>
                              Pontos da rota
                            </div>

                            <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                              {pontosDaRota.map((p, i) => (
                                <li
                                  key={p.idPonto ?? i}
                                  className="flex items-center gap-2"
                                >
                                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center text-[11px]">
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        fill="currentColor"
                                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 11a4 4 0 1 1 0-8a4 4 0 0 1 0 8"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex items-center gap-2 rounded-lg px-1 py-1 flex-1">
                                    <span className="w-7 h-7 rounded-md bg-white text-slate-700 text-[11px] font-semibold grid place-items-center border border-slate-200 shadow-sm">
                                      {(p.ordem ?? i + 1)
                                        .toString()
                                        .padStart(2, "0")}
                                    </span>
                                    <span className="text-xs text-slate-700 truncate">
                                      {p.nome}
                                    </span>
                                  </div>
                                </li>
                              ))}
                              {pontosDaRota.length === 0 && (
                                <span className="text-[11px] text-slate-400">
                                  Nenhum ponto encontrado para essa rota.
                                </span>
                              )}
                            </ul>
                          </div>

                          <button
                            className="mt-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold py-2.5 rounded-xl transition"
                            onClick={() => {
                              setRotaSelecionada(rota);
                              setOpenModalColabs(true);
                            }}
                          >
                            Exibir colaboradores
                          </button>
                        </div>

                        {/* DIREITA: mini-mapa */}
                        <div className="w-full md:w-64 shrink-0 relative mt-2 md:mt-0">
                          {trajetosByRota[rota.idRota] &&
                          Array.isArray(trajetosByRota[rota.idRota]) ? (
                            <GoogleMapaRota
                              pontos={trajetosByRota[rota.idRota]}
                              height={220}
                              followRoads={true}
                            />
                          ) : (
                            <div className="h-[220px] w-full bg-white text-slate-400 text-xs grid place-items-center rounded-xl border border-dashed border-slate-200">
                              Sem trajeto cadastrado
                            </div>
                          )}

                          {loadingTrajeto[rota.idRota] && (
                            <div className="absolute inset-0 bg-white/60 grid place-items-center rounded-xl">
                              <Loading size={55} message="" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {!rotas.length && !loadingRotasCadastradas && (
                    <p className="text-sm text-slate-400">
                      Nenhuma rota cadastrada até o momento.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {openModalColabs && rotaSelecionada && (
          <ModalColaboradores
            open={openModalColabs}
            onClose={() => setOpenModalColabs(false)}
            rota={rotaSelecionada}
          />
        )}
      </div>
    </main>
  );
}
