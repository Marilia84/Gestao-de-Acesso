// src/pages/Gerenciar-linhas.jsx

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import GoogleMapaRota from "../components/GoogleMapaRota";
import ModalColaboradores from "../components/ModalColaboradores";
import { toast } from "react-toastify";
import Loading from "../components/Loading"; // 👈 usa o seu loading

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

  // 👇 novos loadings por bloco
  const [loadingAdicionarCidade, setLoadingAdicionarCidade] = useState(false);
  const [loadingCadastrarPonto, setLoadingCadastrarPonto] = useState(false);
  const [loadingListaPontos, setLoadingListaPontos] = useState(true);
  const [loadingCadastrarRota, setLoadingCadastrarRota] = useState(false);
  const [loadingRotasCadastradas, setLoadingRotasCadastradas] = useState(true);

  // Garante token
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

  // Cargas iniciais
  useEffect(() => {
    if (!tokenOk) return;

    const carregarTudo = async () => {
      // quando começar: lista de pontos e rotas estão carregando
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

  // prefetch de trajetos
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

  // ====== ADICIONAR CIDADE ======
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

  // ====== CADASTRAR PONTO ======
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
        endereco: `${rua.trim()}, ${numero.trim()}`,
        latitude: lat,
        longitude: lng,
        idCidade: Number(cidadeSelecionada),
      });

      // atualiza a lista do card ao lado
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

  // ====== ADICIONAR PONTO NA ROTA (lista local) ======
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

  // ====== CADASTRAR ROTA ======
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

      // limpa formulário
      setNovaRota("");
      setPeriodo("");
      setCapacidade("");
      setHoraPartida("");
      setHoraChegada("");
      setPontosRota([]);

      // recarrega rotas + mostra loading no card de rotas cadastradas
      setLoadingRotasCadastradas(true);
      const rotasRes = await api.get("/rotas");
      const rotasLista = rotasRes.data || [];
      setRotas(rotasLista);
      await prefetchTrajetos(rotasLista);
    } catch (error) {
      const data = error.response?.data;
      console.error("❌ Erro ao cadastrar rota:", data || error.message || error);
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
    <div className="min-h-screen flex flex-col lg:flex-row items-start px-4 lg:px-12">
      <div className="flex flex-1 flex-col justify-center items-center w-full">
        <h1 className="text-3xl font-bold mb-10 text-[#3B7258] mt-10">
          Gerenciar Linhas
        </h1>

        {/* CADASTRO DE PONTOS */}
        {/* CADASTRO DE PONTOS */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 w-full">
  {/* CARD 1 - adicionar cidade / cadastrar ponto */}
  <div className="relative bg-white shadow-md rounded-lg p-10 w-full">
    {/* overlay de loading do card 1 */}
    {(loadingAdicionarCidade || loadingCadastrarPonto) && (
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-10">
        <Loading size={80} message="" />
      </div>
    )}

    <h1 className="text-2xl font-semibold text-[#3B7258] mb-2">
      Cadastrar ponto
    </h1>
    <p className="text-sm text-gray-600 mb-4">
      Adicione novos pontos com localização automática
    </p>

    {/* Inputs cidade + botão adicionar (agora dentro do card) */}
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <input
        type="text"
        placeholder="Nova cidade"
        value={novaCidade}
        onChange={(e) => setNovaCidade(e.target.value)}
        className="border border-gray-400 rounded-lg px-4 py-2 flex-1"
      />
      <input
        type="text"
        placeholder="UF"
        maxLength={2}
        value={novaUf}
        onChange={(e) => setNovaUf(e.target.value.toUpperCase())}
        className="border border-gray-400 rounded-lg px-4 py-2 w-20 text-center uppercase"
      />
      <button
        onClick={handleAdicionarCidade}
        className="bg-[#038C3E] text-white px-5 py-2 rounded-lg hover:bg-[#027a36] transition w-full sm:w-auto"
      >
        Adicionar Cidade
      </button>
    </div>

    {/* Cidade e Ponto */}
    <div className="flex flex-col gap-3 mb-4">
      <select
        value={cidadeSelecionada}
        onChange={(e) => setCidadeSelecionada(e.target.value)}
        className="border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-600"
      >
        <option value="">Selecione a cidade</option>
        {cidades.map((c) => (
          <option key={c.idCidade} value={c.idCidade}>
            {c.nome} - {c.uf}
          </option>
        ))}
      </select>

      <input
        placeholder="Nome do ponto"
        value={nomePonto}
        onChange={(e) => setNomePonto(e.target.value)}
        className="border border-gray-400 rounded-lg px-3 py-2 text-sm"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Rua"
          value={rua}
          onChange={(e) => setRua(e.target.value)}
          className="border border-gray-400 rounded-lg px-3 py-2 flex-1 text-sm"
        />
        <input
          placeholder="Número"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          className="border border-gray-400 rounded-lg px-3 py-2 w-24 text-sm"
        />
      </div>
    </div>

    {/* Botão principal de cadastrar ponto */}
    <div className="flex justify-end mt-auto">
      <button
        onClick={handleCadastrarPonto}
        className="bg-[#038C3E] text-white px-8 py-2 rounded-lg hover:bg-[#027a36] transition"
      >
        Cadastrar Ponto
      </button>
    </div>
  </div>

  {/* CARD 2 - pontos cadastrados */}
  <div className="relative bg-white shadow-md rounded-xl p-8 overflow-y-auto max-h-[500px] w-full">
    {loadingListaPontos && (
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
        <Loading size={60} message="Carregando pontos..." />
      </div>
    )}

    <h1 className="text-2xl font-semibold text-[#3B7258] mb-2">
      Pontos cadastrados
    </h1>
    <p className="text-sm text-gray-600 mb-4">
      Lista de todos os pontos disponíveis
    </p>

    <div className="flex flex-col gap-2 overflow-y-auto max-h-80">
      {pontos.length ? (
        pontos.map((p) => (
          <div
            key={p.idPonto}
            className="bg-white border border-emerald-300 px-3 py-2 rounded-md text-gray-800 text-sm"
          >
            {p.nome}
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm">Nenhum ponto cadastrado.</p>
      )}
    </div>
  </div>
</div>


      {/* === SEÇÃO: CADASTRAR ROTA === */}
      <div className="relative bg-white shadow-md rounded-xl p-8 w-full mb-12">
  {loadingCadastrarRota && (
    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
      <Loading size={80} message="Salvando rota..." />
    </div>
  )}

  <h1 className="text-2xl font-semibold text-[#3B7258] mb-6">
    Cadastrar Rota
  </h1>

  {/* Inputs principais */}
  <div className="flex flex-col md:flex-row gap-4 mb-5">
    <input
      placeholder="Nome da rota"
      value={novaRota}
      onChange={(e) => setNovaRota(e.target.value)}
      className="border border-gray-400 rounded-lg px-3 py-2 flex-1 text-sm"
    />
    <select
      value={cidadeSelecionada}
      onChange={(e) => setCidadeSelecionada(e.target.value)}
      className="border border-gray-400 rounded-lg px-3 py-2 flex-1 text-sm text-gray-600"
    >
      <option value="">Cidade</option>
      {cidades.map((c) => (
        <option key={c.idCidade} value={c.idCidade}>
          {c.nome} - {c.uf}
        </option>
      ))}
    </select>
    <select
      value={periodo}
      onChange={(e) => setPeriodo(e.target.value)}
      className="border border-gray-400 rounded-lg px-3 py-2 flex-1 text-sm text-gray-600"
    >
      <option value="">Período</option>
      <option value="MANHA">Manhã</option>
      <option value="TARDE">Tarde</option>
      <option value="NOITE">Noite</option>
    </select>
  </div>

  <div className="flex flex-col md:flex-row gap-4 mb-5">
    <input
      type="number"
      min="1"
      placeholder="Capacidade"
      value={capacidade}
      onChange={(e) => setCapacidade(e.target.value)}
      className="border border-gray-400 rounded-lg px-3 py-2 text-sm w-full md:w-32 text-center"
    />
    <input
      type="time"
      value={horaPartida}
      onChange={(e) => setHoraPartida(e.target.value)}
      className="border border-gray-400 rounded-lg px-3 py-2 text-sm flex-1"
    />
    <input
      type="time"
      value={horaChegada}
      onChange={(e) => setHoraChegada(e.target.value)}
      className="border border-gray-400 rounded-lg px-3 py-2 text-sm flex-1"
    />
  </div>

  {/* Adicionar pontos */}
  <div className="flex flex-col gap-4">
    <label className="text-sm font-semibold text-gray-700">
      Pontos da Rota
    </label>
    <div className="flex flex-col sm:flex-row gap-3">
      <select
        value={pontoSelecionado}
        onChange={(e) => setPontoSelecionado(e.target.value)}
        className="border border-gray-400 rounded-lg px-3 py-2 text-sm flex-1 text-gray-600"
      >
        <option value="">Selecione</option>
        {pontosFiltrados.map((p) => (
          <option key={p.idPonto} value={p.idPonto}>
            {p.nome}
          </option>
        ))}
      </select>
      <button
        onClick={handleAdicionarPontoNaRota}
        className="bg-[#038C3E] text-white px-5 py-2 rounded-lg hover:bg-[#027a36] transition w-full sm:w-auto"
      >
        Adicionar
      </button>
    </div>

    <ol className="list-decimal ml-5 text-sm text-gray-700 mt-2 space-y-1">
      {pontosRota.map((p, i) => (
        <li key={p.idPonto}>{p.nome}</li>
      ))}
    </ol>
  </div>

  <button
    onClick={handleCadastrarRota}
    className="bg-[#038C3E] text-white w-full py-2 mt-6 rounded-lg hover:bg-[#027a36] transition"
  >
    Cadastrar Rota
  </button>
</div>

{/* === SEÇÃO: ROTAS CADASTRADAS === */}
<div className="relative bg-white shadow-md rounded-xl p-8 w-full mt-10 mb-10">
  <h1 className="text-2xl font-semibold text-[#3B7258] mb-6">
    Rotas cadastradas
  </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {rotas.map((rota) => (
            <div
              key={rota.idRota}
              className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row gap-5"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {rota.nome}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {rota.periodo?.toLowerCase()}
                </p>
                <ul className="text-sm text-gray-700 space-y-1 max-h-32 overflow-y-auto">
                  {(trajetosByRota[rota.idRota] || []).map((p, i) => (
                    <li key={i}>• {p.nome}</li>
                  ))}
                </ul>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 px-4 mt-4 rounded-lg">
                  Exibir Colaboradores
                </button>
              </div>

              <div className="md:w-64 w-full">
                <GoogleMapaRota
                  pontos={trajetosByRota[rota.idRota] || []}
                  height={200}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {openModalColabs && rotaSelecionada && (
      <ModalColaboradores
        open={openModalColabs}
        onClose={() => setOpenModalColabs(false)}
        rota={rotaSelecionada}
      />
    )}
      </div>
    
  );
}
