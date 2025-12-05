// src/pages/RegistroViagem.jsx
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

import { getRotas } from "../api/rotaService";
import {
  getViagensPorRota,
  getEmbarquesDaViagem,
  createViagem,
  updateViagem,
} from "../api/viagemService";
import { getColaboradorById } from "../api/colaboradorService";
import { getMotoristas } from "../api/motoristaService";
import { getVeiculos } from "../api/veiculoService";

import Loading from "../components/Loading";
import Navbar from "../components/Navbar";

import {
  Users,
  Clock,
  Route,
  Calendar,
  Plus,
  X,
  Save,
  Search,
  Truck,
  User,
  Power,
  AlertTriangle,
} from "lucide-react";

import {
  formatSimpleTime,
  formatTimestamp,
  getInitials,
} from "../utils/formatters";

// =======================
// CONFIGURAÇÃO DOS TOASTS
// =======================
const toastConfig = {
  position: "bottom-right",
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
};

const notifySuccess = (message) => toast.success(message, toastConfig);
const notifyError = (message) => toast.error(message, toastConfig);
const notifyWarning = (message) => toast.warn(message, toastConfig);

const RegistroViagem = () => {
  const [rotas, setRotas] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);

  const [selectedRotaId, setSelectedRotaId] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [embarques, setEmbarques] = useState([]);

  const [embarqueDateFilter, setEmbarqueDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingViagens, setLoadingViagens] = useState(false);
  const [loadingEmbarques, setLoadingEmbarques] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tripToToggle, setTripToToggle] = useState(null);
  const [togglingId, setTogglingId] = useState(null); // controla viagem em processamento

  const [newTripData, setNewTripData] = useState({
    idMotorista: "",
    idVeiculo: "",
    data: new Date().toISOString().split("T")[0],
    saidaPrevista: "",
    chegadaPrevista: "",
    tipoViagem: "ida",
  });

  // ===========================
  // CARREGAMENTO DADOS INICIAIS
  // ===========================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitial(true);

        const [rotasData, motoristasData, veiculosData] = await Promise.all([
          getRotas(),
          getMotoristas(),
          getVeiculos(),
        ]);

        setRotas(rotasData || []);
        setMotoristas(motoristasData || []);
        setVeiculos(veiculosData || []);

        if ((rotasData || []).length > 0) {
          setSelectedRotaId(rotasData[0].idRota);
          notifySuccess("Dados iniciais carregados com sucesso.");
        } else {
          notifyWarning("Nenhuma rota encontrada. Cadastre uma rota primeiro.");
        }
      } catch (error) {
        console.error(error);
        notifyError(
          error?.response?.data?.message ||
            "Erro ao carregar dados iniciais. Tente novamente."
        );
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchInitialData();
  }, []);

  // =====================
  // BUSCAR VIAGENS DA ROTA
  // =====================
  const fetchViagens = async () => {
    if (!selectedRotaId) return;

    try {
      setLoadingViagens(true);
      const viagensData = await getViagensPorRota(selectedRotaId);
      setViagens(viagensData || []);

      const currentTripExists = (viagensData || []).find(
        (v) => v.idViagem === selectedTripId
      );

      if ((viagensData || []).length > 0 && !currentTripExists) {
        setSelectedTripId(viagensData[0].idViagem);
      } else if ((viagensData || []).length === 0) {
        setSelectedTripId(null);
      }
    } catch (error) {
      console.error(error);
      notifyError(
        error?.response?.data?.message || "Falha ao carregar viagens da rota."
      );
    } finally {
      setLoadingViagens(false);
    }
  };

  useEffect(() => {
    fetchViagens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRotaId]);

  // =========================
  // BUSCAR EMBARQUES VIAGEM
  // =========================
  useEffect(() => {
    if (!selectedTripId) {
      setEmbarques([]);
      return;
    }

    const fetchEmbarques = async () => {
      try {
        setLoadingEmbarques(true);
        const embarquesData = await getEmbarquesDaViagem(selectedTripId);

        if (!embarquesData || embarquesData.length === 0) {
          setEmbarques([]);
          return;
        }

        const colaboradores = await Promise.all(
          embarquesData.map((e) => getColaboradorById(e.idColaborador))
        );

        const embarquesComNomes = embarquesData.map((e, i) => ({
          ...e,
          nomeColaborador: colaboradores[i]?.nome || "Colaborador não identificado",
          cargoColaborador: colaboradores[i]?.role || "N/A",
        }));

        setEmbarques(embarquesComNomes);
      } catch (error) {
        console.error(error);
        setEmbarques([]);
        notifyError(
          error?.response?.data?.message ||
            "Não foi possível carregar os embarques desta viagem."
        );
      } finally {
        setLoadingEmbarques(false);
      }
    };

    fetchEmbarques();
  }, [selectedTripId]);

  // ==========
  // MEMOIZADOS
  // ==========
  const filteredEmbarques = useMemo(() => {
    if (!embarqueDateFilter) return embarques;
    return embarques.filter(
      (e) => e.dataEmbarque && e.dataEmbarque.startsWith(embarqueDateFilter)
    );
  }, [embarques, embarqueDateFilter]);

  const selectedTrip = viagens.find((v) => v.idViagem === selectedTripId);
  const selectedVeiculoDetails = veiculos.find(
    (v) =>
      v.id === selectedTrip?.idVeiculo ||
      v.idVeiculo === selectedTrip?.idVeiculo
  );

  const totalViagensRota = useMemo(() => (viagens || []).length, [viagens]);

  const totalViagensAtivas = useMemo(
    () => (viagens || []).filter((v) => v.ativo).length,
    [viagens]
  );

  const totalEmbarquesDiaSelecionado = useMemo(
    () => filteredEmbarques.length,
    [filteredEmbarques]
  );

  // ==========
  // HANDLERS
  // ==========
  const handleInputChange = (e) => {
    setNewTripData({ ...newTripData, [e.target.name]: e.target.value });
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();

    if (!selectedRotaId) {
      notifyWarning("Selecione uma rota antes de criar uma viagem.");
      return;
    }

    if (!newTripData.idMotorista || !newTripData.idVeiculo) {
      notifyWarning("Selecione um motorista e um veículo.");
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        idRota: selectedRotaId,
        idMotorista: Number(newTripData.idMotorista),
        idVeiculo: Number(newTripData.idVeiculo),
        data: newTripData.data,
        saidaPrevista: newTripData.saidaPrevista,
        chegadaPrevista: newTripData.chegadaPrevista,
        tipoViagem: newTripData.tipoViagem,
        ativo: true,
      };

      await createViagem(payload);

      notifySuccess("Viagem criada com sucesso.");
      setIsModalOpen(false);
      setNewTripData((prev) => ({
        ...prev,
        saidaPrevista: "",
        chegadaPrevista: "",
      }));

      await fetchViagens();
    } catch (error) {
      console.error(error);
      notifyError(
        error?.response?.data?.message ||
          "Erro ao criar viagem. Verifique os dados e tente novamente."
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openToggleModal = (viagem, e) => {
    e.stopPropagation();
    setTripToToggle(viagem);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!tripToToggle) return;

    const novoStatus = !tripToToggle.ativo;
    const acaoTexto = novoStatus ? "ativada" : "encerrada";

    try {
      setTogglingId(tripToToggle.idViagem);

      const payload = { ...tripToToggle, ativo: novoStatus };
      await updateViagem(tripToToggle.idViagem, payload);

      notifySuccess(`Viagem ${acaoTexto} com sucesso.`);

      setViagens((prev) =>
        prev.map((v) =>
          v.idViagem === tripToToggle.idViagem ? { ...v, ativo: novoStatus } : v
        )
      );

      setIsConfirmModalOpen(false);
      setTripToToggle(null);

      // se eu acabei de encerrar a viagem selecionada, mantenho selecionada, mas atualizada
    } catch (error) {
      console.error(error);
      notifyError(
        error?.response?.data?.message ||
          "Erro ao alterar o status da viagem. Tente novamente."
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ==========
  // LAYOUT
  // ==========
  return (
    <>
      {/* Se você já renderiza Navbar no layout global, pode remover essa linha */}
      {/* <Navbar /> */}

      <main
      className="
        flex-1 min-h-screen bg-slate-50
        px-3 sm:px-4 lg:px-28
        py-4
        ml-16
      "
    >
        <div className="relative z-10 bg-white shadow-sm rounded-2xl w-full p-4 sm:p-6 md:p-8">
          {/* HEADER */}
          <header className="mb-2 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                  Registro de Viagem
                </h1>
                <p className="text-gray-600 mt-1 text-sm max-w-2xl">
                  Centralize o controle das viagens por rota, acompanhe status
                  operacional e monitore embarques diários dos colaboradores.
                </p>
              </div>
            </div>
          </header>

          {/* CARDS RESUMO */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Card 1 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Route className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    Viagens da rota
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Total de viagens cadastradas para a rota selecionada.
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-none">
                  {totalViagensRota}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  viagens cadastradas
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-sky-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    Viagens ativas
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Viagens disponíveis para operação no momento.
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-none">
                  {totalViagensAtivas}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  viagens em andamento
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                    Embarques no dia filtrado
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Passageiros embarcados na viagem selecionada.
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl sm:text-3xl font-semibold text-slate-900 leading-none">
                  {selectedTrip ? totalEmbarquesDiaSelecionado : 0}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  embarques registrados
                </span>
              </div>
            </div>
          </section>

          {/* CONTAINER PRINCIPAL */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-[calc(100vh-270px)] min-h-[600px]">
            {/* LISTA DE ROTAS - ESQUERDA */}
            <aside className="w-full lg:w-1/4 flex flex-col">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-full flex flex-col relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Route size={18} className="text-slate-500" />
                    Rotas disponíveis
                  </h2>
                </div>

                {loadingInitial && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-20">
                    <Loading size={60} />
                  </div>
                )}

                <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin">
                  {rotas.length === 0 && !loadingInitial ? (
                    <div className="text-xs text-slate-400 text-center mt-6">
                      Nenhuma rota cadastrada.
                    </div>
                  ) : (
                    rotas.map((rota) => {
                      const isSelected = selectedRotaId === rota.idRota;
                      return (
                        <button
                          key={rota.idRota}
                          onClick={() => setSelectedRotaId(rota.idRota)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex flex-col gap-0.5 ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                              : "border-transparent bg-slate-50 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <p className="font-semibold truncate">
                            {rota.nome || "Rota sem nome"}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {rota.cidadeNome} • {rota.periodo}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </aside>

            {/* VIAGENS + EMBARQUES - DIREITA */}
            <section className="flex-1 flex flex-col gap-6 min-w-0">
              {/* SELEÇÃO DAS VIAGENS */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex-none relative">
                <div className="flex justify-between items-center mb-4 gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Viagens por rota
                    </h2>
                    <p className="text-xs text-slate-500">
                      Selecione uma viagem para visualizar os embarques.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!selectedRotaId || loadingInitial}
                    className="flex items-center gap-2 text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-60 font-medium shadow-sm"
                  >
                    <Plus size={16} />
                    Nova viagem
                  </button>
                </div>

                {loadingViagens && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-20">
                    <Loading size={50} />
                  </div>
                )}

                {viagens.length > 0 ? (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                    {viagens.map((v) => {
                      const vDetails = veiculos.find(
                        (vec) =>
                          vec.id === v.idVeiculo ||
                          vec.idVeiculo === v.idVeiculo
                      );

                      const isSelected = selectedTripId === v.idViagem;
                      const isProcessing = togglingId === v.idViagem;

                      return (
                        <div
                          key={v.idViagem}
                          onClick={() => setSelectedTripId(v.idViagem)}
                          className={`min-w-[230px] p-3 rounded-xl border cursor-pointer transition-all relative group bg-slate-50 ${
                            isSelected
                              ? "border-emerald-500 ring-1 ring-emerald-100 shadow-sm"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                                <Truck size={13} />
                                Viagem
                              </span>
                              <h3 className="font-semibold text-slate-900 text-sm">
                                {vDetails
                                  ? vDetails.placa
                                  : `Veículo ${v.idVeiculo}`}
                              </h3>
                            </div>

                            <button
                              onClick={(e) => openToggleModal(v, e)}
                              disabled={isProcessing}
                              title={
                                v.ativo ? "Encerrar viagem" : "Reativar viagem"
                              }
                              className={`p-1.5 rounded-full transition-colors shadow-sm z-10 border text-xs ${
                                v.ativo
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                              }`}
                            >
                              {isProcessing ? (
                                <Loading size={14} />
                              ) : (
                                <Power size={14} />
                              )}
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                v.ativo
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-300"
                              }`}
                            >
                              {v.ativo ? "Ativa" : "Encerrada"}
                            </span>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
                            <span>{formatSimpleTime(v.saidaPrevista)}</span>
                            <span className="font-mono text-slate-400">➝</span>
                            <span>{formatSimpleTime(v.chegadaPrevista)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-7 text-center">
                    <p className="text-slate-500 text-sm">
                      {loadingViagens
                        ? "Carregando viagens..."
                        : "Nenhuma viagem cadastrada para esta rota."}
                    </p>
                  </div>
                )}
              </div>

              {/* CARD DE EMBARQUES */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex-1 flex flex-col relative min-h-0">
                {/* HEADER CARD */}
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 border-b pb-4 border-slate-100 gap-4 flex-none">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Users className="text-emerald-600" size={22} />
                        Embarques
                      </h2>
                      {selectedTrip && (
                        <span
                          className={`text-[10px] sm:text-xs px-2 py-1 rounded-md font-bold border tracking-wide uppercase ${
                            selectedTrip.ativo
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {selectedTrip.ativo
                            ? "Viagem ativa"
                            : "Viagem encerrada"}
                        </span>
                      )}
                    </div>
                    {selectedTrip && (
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {selectedVeiculoDetails
                          ? `${selectedVeiculoDetails.modelo} · ${selectedVeiculoDetails.placa}`
                          : `Veículo ID: ${selectedTrip.idVeiculo}`}
                      </p>
                    )}
                  </div>

                  {selectedTrip && (
                    <div className="flex flex-col w-full sm:w-auto">
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                        Filtrar por dia
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="date"
                          value={embarqueDateFilter}
                          onChange={(e) =>
                            setEmbarqueDateFilter(e.target.value)
                          }
                          className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LISTA / CONTEÚDO */}
                <div className="flex-1 overflow-y-auto min-h-0 relative">
                  {loadingEmbarques && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20 rounded-2xl">
                      <Loading size={60} />
                      <p className="mt-4 text-slate-400 text-sm">
                        Carregando passageiros...
                      </p>
                    </div>
                  )}

                  {selectedTrip ? (
                    filteredEmbarques.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 px-4 mb-2 sticky top-0 bg-white z-10 pb-2">
                          <span>COLABORADOR</span>
                          <span>HORÁRIO</span>
                        </div>

                        {filteredEmbarques.map((e) => (
                          <div
                            key={e.idEmbarque}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                                {getInitials(e.nomeColaborador)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">
                                  {e.nomeColaborador}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {e.cargoColaborador}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100">
                              <Clock size={14} className="text-slate-400" />
                              <span className="text-sm font-medium text-slate-800">
                                {formatTimestamp(e.dataEmbarque).split(" ")[1] ||
                                  formatTimestamp(e.dataEmbarque)}
                              </span>
                            </div>
                          </div>
                        ))}

                        <div className="mt-4 text-center text-[11px] text-slate-400 pb-2">
                          Total: {filteredEmbarques.length} passageiros em{" "}
                          {new Date(
                            embarqueDateFilter + "T00:00:00"
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      !loadingEmbarques && (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                          <Search size={40} className="mb-3 opacity-60" />
                          <p className="text-sm font-medium text-slate-600 mb-1">
                            Nenhum embarque encontrado
                          </p>
                          <p className="text-xs text-slate-500">
                            Não há registros para a data{" "}
                            {new Date(
                              embarqueDateFilter + "T00:00:00"
                            ).toLocaleDateString()}
                            .
                          </p>
                        </div>
                      )
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                      <p>Selecione uma viagem para visualizar os embarques.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* MODAL CRIAR VIAGEM */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-base text-slate-900">
                  Criar nova viagem
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  type="button"
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <User size={14} /> Motorista
                    </label>
                    <select
                      name="idMotorista"
                      required
                      value={newTripData.idMotorista}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                      <option value="">Selecione um motorista...</option>
                      {motoristas.map((m) => (
                        <option
                          key={m.id || m.idMotorista}
                          value={m.id || m.idMotorista}
                        >
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <Truck size={14} /> Veículo
                    </label>
                    <select
                      name="idVeiculo"
                      required
                      value={newTripData.idVeiculo}
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    >
                      <option value="">Selecione um veículo...</option>
                      {veiculos.map((v) => (
                        <option
                          key={v.id || v.idVeiculo}
                          value={v.id || v.idVeiculo}
                        >
                          {v.modelo} - {v.placa}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data de criação
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={newTripData.data}
                    required
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Saída prevista
                    </label>
                    <input
                      type="time"
                      name="saidaPrevista"
                      required
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Chegada prevista
                    </label>
                    <input
                      type="time"
                      name="chegadaPrevista"
                      required
                      onChange={handleInputChange}
                      className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tipo de viagem
                  </label>
                  <select
                    name="tipoViagem"
                    value={newTripData.tipoViagem}
                    onChange={handleInputChange}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="ida">Ida</option>
                    <option value="volta">Volta</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-70"
                  >
                    {isCreating ? <Loading size={16} /> : <Save size={16} />}
                    Salvar viagem
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAÇÃO ALTERAÇÃO STATUS */}
        {isConfirmModalOpen && tripToToggle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
              <div
                className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full mb-4 ${
                  tripToToggle.ativo ? "bg-red-100" : "bg-emerald-100"
                }`}
              >
                <AlertTriangle
                  className={
                    tripToToggle.ativo ? "text-red-600" : "text-emerald-600"
                  }
                  size={24}
                />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {tripToToggle.ativo ? "Encerrar viagem?" : "Ativar viagem?"}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {tripToToggle.ativo
                  ? "Você tem certeza que deseja encerrar esta viagem? Ela ficará marcada como finalizada."
                  : "Você deseja reativar esta viagem? Ela ficará novamente disponível para registros."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsConfirmModalOpen(false);
                    setTripToToggle(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmToggle}
                  disabled={togglingId === tripToToggle.idViagem}
                  className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    tripToToggle.ativo
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {togglingId === tripToToggle.idViagem ? (
                    <Loading size={16} />
                  ) : tripToToggle.ativo ? (
                    "Sim, encerrar"
                  ) : (
                    "Sim, ativar"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default RegistroViagem;
