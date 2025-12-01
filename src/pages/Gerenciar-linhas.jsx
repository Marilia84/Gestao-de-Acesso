import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import ModalColaboradores from "../components/ModalColaboradores";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import RotaInativaIcon from "../assets/rota-inativa.png";
import Toggle from "../components/Toggle";
import CadastroCidadeCard from "../components/CadastroCidadeCard";
import CadastroPontoCard from "../components/CadastroPontoCard";
import ListaPontosCard from "../components/ListaPontosCard";
import { Pencil,  X, Check } from "lucide-react";

const normalizarAtivo = (valor) => {
  return (
    valor === true ||
    valor === 1 ||
    valor === "ATIVO" ||
    valor === "ativo" ||
    valor === "Ativo"
  );
};

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

  const [pontosRota, setPontosRota] = useState([]);

  const [rotas, setRotas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const [trajetosByRota, setTrajetosByRota] = useState({});
  const [loadingTrajeto, setLoadingTrajeto] = useState({});
  const [openModalColabs, setOpenModalColabs] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] = useState(null);

  const [loadingAdicionarCidade, setLoadingAdicionarCidade] = useState(false);
  const [loadingCadastrarPonto, setLoadingCadastrarPonto] = useState(false);
  const [loadingListaPontos, setLoadingListaPontos] = useState(true);
  const [loadingCadastrarRota, setLoadingCadastrarRota] = useState(false);
  const [loadingRotasCadastradas, setLoadingRotasCadastradas] = useState(true);

  const [activeTab, setActiveTab] = useState("PONTOS");

  // ===== ESTADO / FUNÇÕES PARA EDITAR ROTA =====
  const [rotaEditando, setRotaEditando] = useState(null);
  const [editRotaNome, setEditRotaNome] = useState("");
  const [editRotaPeriodo, setEditRotaPeriodo] = useState("");
  const [editRotaHoraPartida, setEditRotaHoraPartida] = useState("");
  const [editRotaHoraChegada, setEditRotaHoraChegada] = useState("");
  const [editRotaCapacidade, setEditRotaCapacidade] = useState("");
  const [editRotaIdCidade, setEditRotaIdCidade] = useState("");
  const [editRotaModalAberto, setEditRotaModalAberto] = useState(false);
  const [salvandoRota, setSalvandoRota] = useState(false);

  const getIdCidadeFromRota = (rota) =>
    rota.idCidade ?? rota.cidade?.idCidade ?? rota.cidade_id ?? null;

  const abrirModalEdicaoRota = (rota) => {
    setRotaEditando(rota);
    setEditRotaNome(rota.nome || "");
    setEditRotaPeriodo(rota.periodo || "");
    setEditRotaHoraPartida(
      (rota.horaPartida && String(rota.horaPartida).substring(0, 5)) || ""
    );
    setEditRotaHoraChegada(
      (rota.horaChegada && String(rota.horaChegada).substring(0, 5)) || ""
    );
    setEditRotaCapacidade(
      rota.capacidade !== undefined && rota.capacidade !== null
        ? String(rota.capacidade)
        : ""
    );
    const idCidade = getIdCidadeFromRota(rota);
    setEditRotaIdCidade(idCidade ? String(idCidade) : "");

    setEditRotaModalAberto(true);
  };

  const fecharModalEdicaoRota = () => {
    if (salvandoRota) return;
    setEditRotaModalAberto(false);
    setRotaEditando(null);
    setEditRotaNome("");
    setEditRotaPeriodo("");
    setEditRotaHoraPartida("");
    setEditRotaHoraChegada("");
    setEditRotaCapacidade("");
    setEditRotaIdCidade("");

  };

  const handleSalvarEdicaoRota = async () => {
    if (!rotaEditando) return;

    if (!editRotaNome.trim()) {
      toast.warn("Informe o nome da rota.");
      return;
    }

    const payload = {};

    payload.nome = editRotaNome.trim();

    if (editRotaPeriodo) {
      payload.periodo = editRotaPeriodo;
    }

    if (editRotaHoraPartida) {
      payload.horaPartida =
        editRotaHoraPartida.length > 5
          ? editRotaHoraPartida.substring(0, 5)
          : editRotaHoraPartida;
    }

    if (editRotaHoraChegada) {
      payload.horaChegada =
        editRotaHoraChegada.length > 5
          ? editRotaHoraChegada.substring(0, 5)
          : editRotaHoraChegada;
    }

    if (editRotaCapacidade !== "") {
      const capNumber = Number(editRotaCapacidade);
      if (!Number.isNaN(capNumber)) {
        payload.capacidade = capNumber;
      }
    }

    if (editRotaIdCidade) {
      payload.idCidade = Number(editRotaIdCidade);
    }



    try {
      setSalvandoRota(true);
      await api.patch(`/rotas/${rotaEditando.idRota}`, payload);

      let cidadeObj = null;
      if (payload.idCidade) {
        cidadeObj = cidades.find((c) => c.idCidade === payload.idCidade) || null;
      }

      setRotas((prev) =>
        prev.map((r) =>
          r.idRota === rotaEditando.idRota
            ? {
              ...r,
              ...payload,
              ...(cidadeObj ? { cidade: cidadeObj } : {}),
            }
            : r
        )
      );

      toast.success("Rota atualizada com sucesso.");
      fecharModalEdicaoRota();
    } catch (err) {
      console.error("Erro ao atualizar rota:", err.response?.data || err);
      toast.error("Erro ao atualizar rota. Tente novamente.");
    } finally {
      setSalvandoRota(false);
    }
  };

  // =============================================

  const handleToggleAtivoRota = async (rota, novoAtivo) => {
    const ativoAnteriorBool = normalizarAtivo(rota.ativo);
    const novoAtivoBool = !!novoAtivo;

    if (novoAtivoBool === ativoAnteriorBool) return;

    setRotas((prev) =>
      prev.map((r) =>
        r.idRota === rota.idRota ? { ...r, ativo: novoAtivoBool } : r
      )
    );

    try {
      await api.patch(`/rotas/${rota.idRota}`, {
        ativo: novoAtivoBool,
      });

      toast.success(
        novoAtivoBool
          ? "Rota ativada com sucesso!"
          : "Rota inativada com sucesso!"
      );
    } catch (err) {
      console.error(
        "Erro ao atualizar status da rota:",
        err.response?.data || err
      );

      setRotas((prev) =>
        prev.map((r) =>
          r.idRota === rota.idRota ? { ...r, ativo: ativoAnteriorBool } : r
        )
      );

      toast.error("Não foi possível atualizar o status da rota.");
    }
  };

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

  const prefetchTrajetos = useCallback(
    async (rotasLista) => {
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
    },
    [trajetosByRota]
  );

  const carregarTudo = useCallback(
    async ({ showFullLoading = true } = {}) => {
      if (!tokenOk) return;

      if (showFullLoading) {
        setLoadingListaPontos(true);
        setLoadingRotasCadastradas(true);
      }

      try {
        const [cidadesRes, pontosRes, rotasRes, colabsRes] = await Promise.all([
          api.get("/cidades"),
          api.get("/pontos"),
          api.get("/rotas"),
          api.get("/colaboradores"),
        ]);

        const rotasBrutas = rotasRes.data || [];
        const rotasLista = rotasBrutas.map((rota) => ({
          ...rota,
          ativo: normalizarAtivo(rota.ativo),
        }));

        setCidades(cidadesRes.data || []);
        setPontos(pontosRes.data || []);
        setRotas(rotasLista);
        setColaboradores(colabsRes.data || []);

        await prefetchTrajetos(rotasLista);
      } catch (err) {
        console.error(
          "Erro nas cargas iniciais/refresh:",
          err.response?.data || err.message || err
        );
        if (showFullLoading) {
          toast.error("Não foi possível carregar os dados.");
        }
      } finally {
        if (showFullLoading) {
          setLoadingListaPontos(false);
          setLoadingRotasCadastradas(false);
        }
      }
    },
    [tokenOk, prefetchTrajetos]
  );

  useEffect(() => {
    if (!tokenOk) return;
    carregarTudo({ showFullLoading: true });
  }, [tokenOk, carregarTudo]);

  useEffect(() => {
    if (!tokenOk) return;

    const intervalId = setInterval(() => {
      carregarTudo({ showFullLoading: false });
    }, 15000);

    return () => clearInterval(intervalId);
  }, [tokenOk, carregarTudo]);

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

    const nomeCidade = novaCidade.trim();
    const ufCidade = novaUf.trim().toUpperCase();

    setLoadingAdicionarCidade(true);
    try {
      const response = await api.post("/cidades", {
        nome: nomeCidade,
        uf: ufCidade,
      });

      setCidades((prev) => [...prev, response.data]);
      setNovaCidade("");
      setNovaUf("");

      toast.success(
        `Cidade cadastrada! ${nomeCidade} - ${ufCidade} foi adicionada com sucesso.`
      );
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

      const nomePontoTrim = nomePonto.trim();
      const ruaTrim = rua.trim();
      const numeroTrim = numero.trim();

      const enderecoCompleto = `${ruaTrim}, ${numeroTrim}, ${cidadeObj.nome} - ${cidadeObj.uf}`;
      const { lat, lng } = await getCoordenadas(enderecoCompleto);

      const response = await api.post("/pontos", {
        nome: nomePontoTrim,
        endereco: `${ruaTrim}, ${numeroTrim} ${cidadeObj.nome}`,
        latitude: lat,
        longitude: lng,
        idCidade: Number(cidadeSelecionada),
      });

      setPontos((prev) => [...prev, response.data]);
      setNomePonto("");
      setRua("");
      setNumero("");

      toast.success(
        `Ponto cadastrado! O ponto "${nomePontoTrim}" foi cadastrado com sucesso.`
      );
    } catch (error) {
      console.error("Erro ao cadastrar ponto:", error.response?.data || error);
      toast.error("Erro ao cadastrar ponto.");
    } finally {
      setLoadingCadastrarPonto(false);
    }
  };

  const handleTogglePontoNaRota = (ponto) => {
    setPontosRota((prev) => {
      const jaExiste = prev.some(
        (p) => String(p.idPonto) === String(ponto.idPonto)
      );
      if (jaExiste) {
        return prev.filter((p) => String(p.idPonto) !== String(ponto.idPonto));
      }
      return [...prev, ponto];
    });
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

    const nomeRotaTrim = novaRota.trim();

    const payload = {
      nome: nomeRotaTrim,
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

      setNovaRota("");
      setPeriodo("");
      setCapacidade("");
      setHoraPartida("");
      setHoraChegada("");
      setPontosRota([]);

      setLoadingRotasCadastradas(true);
      const rotasRes = await api.get("/rotas");
      const rotasBrutas = rotasRes.data || [];
      const rotasLista = rotasBrutas.map((rota) => ({
        ...rota,
        ativo: normalizarAtivo(rota.ativo),
      }));
      setRotas(rotasLista);
      await prefetchTrajetos(rotasLista);

      toast.success(
        `Rota cadastrada! A rota "${nomeRotaTrim}" foi cadastrada com sucesso.`
      );
    } catch (error) {
      const data = error.response?.data;
      console.error("Erro ao cadastrar rota:", data || error.message || error);
      toast.error(
        `Erro ao cadastrar rota.${data?.message ? `\nMensagem: ${data.message}` : ""
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
        px-3 sm:px-4 lg:px-28
        py-4
        ml-16
      "
    >
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold  text-emerald-600">
            Gerenciar linhas e rotas
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Cadastre cidades, pontos de parada e rotas, visualize o trajeto no
            mapa e gerencie os colaboradores de cada linha.
          </p>
        </header>

        <nav className="border-b border-slate-200 pb-4">
          <div className="flex justify-start">
            <div className="relative inline-flex bg-slate-100 rounded-full p-1">
              <span
                className={`
                  absolute inset-y-1 left-1
                  w-24
                  rounded-full bg-white shadow-sm
                  transition-transform duration-300 ease-out
                  ${activeTab === "PONTOS"
                    ? "translate-x-0"
                    : "translate-x-[6.5rem]"
                  }
                `}
              />

              <button
                type="button"
                onClick={() => setActiveTab("PONTOS")}
                className={`
                  relative z-10
                  w-24
                  px-3 py-1.5
                  text-xs sm:text-base font-semibold
                  transition-colors
                  ${activeTab === "PONTOS"
                    ? "text-emerald-600"
                    : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                Pontos
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ROTAS")}
                className={`
                  relative z-10
                  w-24
                  px-3 py-1.5
                  text-xs sm:text-sm font-semibold
                  transition-colors
                  ${activeTab === "ROTAS"
                    ? "text-emerald-700"
                    : "text-slate-500 hover:text-slate-700"
                  }
                `}
              >
                Rotas
              </button>
            </div>
          </div>
        </nav>

        {activeTab === "PONTOS" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <CadastroCidadeCard
                novaCidade={novaCidade}
                setNovaCidade={setNovaCidade}
                novaUf={novaUf}
                setNovaUf={setNovaUf}
                onSubmit={handleAdicionarCidade}
                loading={loadingAdicionarCidade}
              />

              <CadastroPontoCard
                cidades={cidades}
                cidadeSelecionada={cidadeSelecionada}
                setCidadeSelecionada={setCidadeSelecionada}
                nomePonto={nomePonto}
                setNomePonto={setNomePonto}
                rua={rua}
                setRua={setRua}
                numero={numero}
                setNumero={setNumero}
                onSubmit={handleCadastrarPonto}
                loading={loadingCadastrarPonto}
              />
            </div>

            <ListaPontosCard
              pontos={pontos}
              loadingListaPontos={loadingListaPontos}
            />
          </section>
        )}

        {activeTab === "ROTAS" && (
          <section className="flex flex-col xl:flex-row gap-6 items-start">
            <div className="w-full xl:w-[35%]">
              <div
                className="
                  relative bg-white border border-slate-200 shadow-sm rounded-2xl
                  p-5 sm:p-6 md:p-7
                  flex flex-col
                  lg:h-[690px]
                "
              >
                {loadingCadastrarRota && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-10">
                    <Loading size={90} message="Salvando rota..." />
                  </div>
                )}

                <div className="flex flex-col gap-1 mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                    Cadastrar rota
                  </h2>
                  <p className="text-xs text-slate-500 max-w-md">
                    Defina o nome, cidade, período, horários e os pontos que
                    compõem o trajeto.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <label className="text-xs font-medium text-slate-700">
                        Nome da rota
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Rota Matinal"
                        value={novaRota}
                        onChange={(e) => setNovaRota(e.target.value)}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      />
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <label className="text-xs font-medium text-slate-700">
                        Cidade
                      </label>
                      <select
                        value={cidadeSelecionada}
                        onChange={(e) => setCidadeSelecionada(e.target.value)}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      >
                        <option value="">Selecione</option>
                        {cidades.map((cidade) => (
                          <option key={cidade.idCidade} value={cidade.idCidade}>
                            {cidade.nome} - {cidade.uf}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0">
                      <label className="text-xs font-medium text-slate-700">
                        Período
                      </label>
                      <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      >
                        <option value="">Selecione</option>
                        <option value="MANHA">Manhã</option>
                        <option value="TARDE">Tarde</option>
                        <option value="NOITE">Noite</option>
                        <option value="MADRUGADA">Madrugada</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-end">
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
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-center text-slate-900 placeholder:text-slate-400
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
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
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-900
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
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
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-900
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex-1 flex flex-col gap-1 overflow-hidden">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-700 mb-1">
                      Pontos da rota
                    </label>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 max-h-40 overflow-y-auto">
                      {pontosFiltrados.length ? (
                        pontosFiltrados.map((p) => {
                          const isChecked = pontosRota.some(
                            (pr) => String(pr.idPonto) === String(p.idPonto)
                          );

                          const indiceNaRota = pontosRota.findIndex(
                            (pr) => String(pr.idPonto) === String(p.idPonto)
                          );
                          const ordem =
                            indiceNaRota !== -1 ? indiceNaRota + 1 : null;

                          return (
                            <label
                              key={p.idPonto}
                              className="flex items-center gap-3 px-3.5 py-2 border-b last:border-b-0 border-slate-100 cursor-pointer hover:bg-white/70 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePontoNaRota(p)}
                                className="
                                  h-4 w-4 
                                  rounded 
                                  border-emerald-400
                                  text-emerald-600
                                  accent-emerald-600
                                  focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500
                                "
                              />

                              <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-800">
                                  {p.nome}
                                </span>

                                {ordem && (
                                  <span
                                    className="
                                      text-[13px] 
                                      px-3 py-0.5 
                                      rounded-full 
                                      bg-[#ffffff] 
                                      text-green-800
                                      border border-emerald-500
                                      font-semibold
                                    "
                                  >
                                    #{ordem}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="px-3.5 py-3">
                          <p className="text-xs text-slate-500">
                            Selecione uma cidade para listar os pontos
                            disponíveis.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <p className="text-[11px] text-slate-500 mb-1">
                      Ordem atual da rota
                    </p>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 max-h-32 overflow-y-auto">
                      {pontosRota.length ? (
                        <ul className="space-y-1">
                          {pontosRota.map((p, index) => (
                            <li
                              key={p.idPonto}
                              className="flex items-start gap-3"
                            >
                              <div className="flex flex-col items-center">
                                <span
                                  className="
                                    flex items-center justify-center
                                    h-6 w-6
                                    rounded-full
                                    bg-emerald-500
                                    text-[11px]
                                    font-semibold
                                    text-white
                                    shadow-sm
                                  "
                                >
                                  {index + 1}
                                </span>

                                {index !== pontosRota.length - 1 && (
                                  <span className="mt-1 h-3 w-px bg-emerald-200" />
                                )}
                              </div>

                              <div className="flex-1">
                                <p className="text-xs sm:text-sm font-medium text-slate-800">
                                  {p.nome}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Nenhum ponto selecionado para esta rota.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCadastrarRota}
                  className="
                    mt-2
                    bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400
                    text-white w-full
                    py-2.5
                    text-sm sm:text-base font-semibold
                    rounded-xl
                    flex items-center justify-center gap-3
                    transition-colors
                  "
                  disabled={loadingCadastrarRota}
                >
                  {loadingCadastrarRota
                    ? "Cadastrando rota..."
                    : "Cadastrar rota"}
                </button>
              </div>
            </div>

            <div className="w-full xl:flex-1">
              <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-5 lg:p-8 w-full max-h-[770px] overflow-y-auto">
                {loadingRotasCadastradas && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-10">
                    <Loading size={90} message="Carregando rotas..." />
                  </div>
                )}

                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Rotas cadastradas
                  </h2>
                  <p className="text-base text-slate-600">
                    Visualize todas as rotas, seus pontos e o trajeto no mapa.
                  </p>
                </div>

                <div className="flex flex-col gap-3 ">
                  {rotas.map((rota) => {
                    const pontosDaRota = trajetosByRota[rota.idRota] || [];

                    const isAtiva = normalizarAtivo(rota.ativo);

                    const horarioPartida = rota.horaPartida || "--:--";
                    const horarioChegada = rota.horaChegada || "--:--";

                    const origem =
                      pontosDaRota[0]?.nome || "Origem não definida";
                    const destino =
                      pontosDaRota[pontosDaRota.length - 1]?.nome ||
                      "Destino não definido";

                    return (
                      <div
                        key={rota.idRota}
                        className="
                          group
                          relative
                          flex flex-col md:flex-row items-stretch gap-7
                          rounded-lg
                          border border-slate-200
                          bg-white/95
                          px-4 py-4
                          shadow-sm
                          hover:bg-slate-50
                          transition-colors
                          min-h-[240px]
                        "
                      >
                        <div className="absolute top-2 right-1 z-10">
                          <div className="absolute top-1 right-1 z-10 flex items-center gap-1 sm:gap-2">
                            {/* EDITAR ROTA */}
                            <button
                              type="button"
                              onClick={() => abrirModalEdicaoRota(rota)}
                              className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border border-transparent hover:border-emerald-100 transition"
                              title="Editar rota"
                            >
                              <Pencil className="w-6 h-6" />
                            </button>

                       

                            {/* ATIVAR / INATIVAR */}
                            <Toggle
                              checked={isAtiva}
                              onChange={(checked) =>
                                handleToggleAtivoRota(rota, !!checked)
                              }
                              offLabel="Inativar"
                              onLabel="Ativar"
                              showPrefixText={false}
                            />
                          </div>
                        </div>

                        <div
                          className="
                            md:w-45
                            flex flex-col justify-between
                            border-b md:border-b-0 md:border-r border-slate-100
                            pr-4 md:pr-14
                            pb-3 md:pb-0
                          "
                        >
                          <div className="text-xs font-medium text-slate-600">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full ${isAtiva ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                              />
                              <span className="truncate">
                                {isAtiva
                                  ? "Disponível para trajeto"
                                  : "Rota inativa"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                              {rota.nome}
                            </h3>
                            {rota.cidade?.nome && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {rota.cidade.nome} • {rota.cidade.uf}
                              </p>
                            )}
                          </div>

                          <div className="mt-8 space-x-0 text-[11px] text-slate-600">
                            <p className="flex justify-between">
                              <span className="text-slate-500">Período</span>
                              <span className="font-medium text-slate-800">
                                {rota.periodo || "—"}
                              </span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-500">Pontos</span>
                              <span className="font-medium text-slate-800">
                                {pontosDaRota.length}
                              </span>
                            </p>
                            {rota.capacidade && (
                              <p className="flex justify-between">
                                <span className="text-slate-500">
                                  Capacidade
                                </span>
                                <span className="font-medium text-slate-800 pl-2">
                                  {rota.capacidade} colaboradores
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
                          <div className="flex-1 flex flex-col h-full justify-between">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-base font-semibold text-[#2fb868]">
                                  {origem} — {destino}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Itinerário com {pontosDaRota.length} ponto
                                  {pontosDaRota.length === 1 ? "" : "s"}{" "}
                                  cadastrado
                                </p>
                              </div>

                              <div className="text-right pt-10 ">
                                <p className="text-[11px] text-slate-500">
                                  Horário
                                </p>
                                <p className="text-xs font-semibold text-slate-800">
                                  {horarioPartida} — {horarioChegada}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 bg-slate-50/80 rounded-xl border border-slate-100 px-3 py-2 max-h-24 overflow-y-auto">
                              {pontosDaRota.length ? (
                                <ul className="text-[11px] text-slate-700 space-y-0.5">
                                  {pontosDaRota.slice(0, 4).map((p, i) => (
                                    <li
                                      key={p.idPonto ?? i}
                                      className="truncate"
                                    >
                                      {i + 1}. {p.nome}
                                    </li>
                                  ))}
                                  {pontosDaRota.length > 4 && (
                                    <li className="text-[10px] text-slate-500">
                                      + {pontosDaRota.length - 4} pontos
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  Nenhum ponto encontrado para essa rota.
                                </span>
                              )}
                            </div>

                            <button
                              className="
                                mt-3
                                inline-flex items-end 
                                px-3.5 py-2
                                rounded-full
                                text-[14px] font-semibold
                                bg-[#71CE97]
                                text-[white]
                                hover:bg-[#039155]
                                transition-colors
                                w-max
                              "
                              onClick={() => {
                                setRotaSelecionada(rota);
                                setOpenModalColabs(true);
                              }}
                            >
                              Exibir colaboradores
                            </button>
                          </div>

                          {isAtiva ? (
                            <div className="w-32 sm:w-40 md:w-44 h-24 sm:h-28 md:h-32 flex items-center justify-center mt-3">
                              <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                                <DotLottieReact
                                  src="https://lottie.host/bde87682-f5b8-4ed1-896c-b023c08f1945/dA2yWnF6TS.lottie"
                                  loop
                                  autoplay
                                  style={{ width: "200%", height: "120%" }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-32 sm:w-40 md:w-44 h-24 sm:h-28 md:h-32 flex items-center justify-center">
                              <div className="w-full h-full bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                                <img
                                  src={RotaInativaIcon}
                                  alt="Rota inativa"
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {!rotas.length && !loadingRotasCadastradas && (
                    <div className="w-full">
                      <div className="border border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/40">
                        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-white border border-slate-200 grid place-items-center">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            className="text-slate-500"
                          >
                            <path
                              fill="currentColor"
                              d="M4 6h16v2H4zm2 4h12v2H6zm-2 4h16v2H4z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          Nenhuma rota cadastrada ainda.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Crie uma nova rota ao lado para começar a visualizar o
                          trajeto aqui.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MODAL EDIÇÃO DE ROTA */}
        {editRotaModalAberto && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-5 md:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900">
                    Editar rota
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500">
                    Atualize as informações gerais desta rota.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fecharModalEdicaoRota}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nome da rota
                  </label>
                  <input
                    type="text"
                    value={editRotaNome}
                    onChange={(e) => setEditRotaNome(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Período
                  </label>
                  <select
                    value={editRotaPeriodo}
                    onChange={(e) => setEditRotaPeriodo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                  >
                    <option value="">Selecione</option>
                    <option value="MANHA">Manhã</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOITE">Noite</option>
                    <option value="MADRUGADA">Madrugada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Cidade
                  </label>
                  <select
                    value={editRotaIdCidade}
                    onChange={(e) => setEditRotaIdCidade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                  >
                    <option value="">Selecione uma cidade</option>
                    {cidades.map((cidade) => (
                      <option
                        key={cidade.idCidade}
                        value={String(cidade.idCidade)}
                      >
                        {cidade.nome} - {cidade.uf}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hora de partida
                  </label>
                  <input
                    type="time"
                    value={editRotaHoraPartida}
                    onChange={(e) => setEditRotaHoraPartida(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hora de chegada
                  </label>
                  <input
                    type="time"
                    value={editRotaHoraChegada}
                    onChange={(e) => setEditRotaHoraChegada(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Capacidade (colaboradores)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editRotaCapacidade}
                    onChange={(e) => setEditRotaCapacidade(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500"
                  />
                </div>


              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={fecharModalEdicaoRota}
                  disabled={salvandoRota}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-xs md:text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvarEdicaoRota}
                  disabled={salvandoRota}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-4 py-1.5 text-xs md:text-sm font-medium hover:bg-emerald-700 disabled:opacity-70"
                >
                  <Check className="w-4 h-4" />
                  {salvandoRota ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        )}

        {openModalColabs && rotaSelecionada && (
          <ModalColaboradores
            open={openModalColabs}
            onClose={() => setOpenModalColabs(false)}
            rota={rotaSelecionada}
            pontosMapa={
              trajetosByRota[rotaSelecionada.idRota]
                ? trajetosByRota[rotaSelecionada.idRota]
                : []
            }
            loadingTrajeto={loadingTrajeto[rotaSelecionada.idRota] || false}
          />
        )}
      </div>
    </main>
  );
}
