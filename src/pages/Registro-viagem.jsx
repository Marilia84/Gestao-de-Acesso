import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
// Importações de serviços
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

// Importação do seu Loader personalizado
import Loading from "../components/Loading";

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

const RegistroViagem = () => {
  // === ESTADOS ===
  const [rotas, setRotas] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [veiculos, setVeiculos] = useState([]);

  const [selectedRotaId, setSelectedRotaId] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [embarques, setEmbarques] = useState([]);

  // Estado do Filtro de Embarques (Data)
  const [embarqueDateFilter, setEmbarqueDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingViagens, setLoadingViagens] = useState(false);
  const [loadingEmbarques, setLoadingEmbarques] = useState(false);

  // Estados do Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados do Modal de Confirmação (Status)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tripToToggle, setTripToToggle] = useState(null);
  const [isToggling, setIsToggling] = useState(false); // Loading da ação de toggle

  const [newTripData, setNewTripData] = useState({
    idMotorista: "",
    idVeiculo: "",
    data: new Date().toISOString().split("T")[0],
    saidaPrevista: "",
    chegadaPrevista: "",
    tipoViagem: "ida",
  });

  // === 1. BUSCAR DADOS INICIAIS ===
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingInitial(true);
        const [rotasData, motoristasData, veiculosData] = await Promise.all([
          getRotas(),
          getMotoristas(),
          getVeiculos(),
        ]);

        setRotas(rotasData);
        setMotoristas(motoristasData);
        setVeiculos(veiculosData);

        if (rotasData.length > 0) setSelectedRotaId(rotasData[0].idRota);
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados iniciais.");
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  // === 2. BUSCAR VIAGENS ===
  const fetchViagens = async () => {
    if (!selectedRotaId) return;
    try {
      setLoadingViagens(true);
      const viagensData = await getViagensPorRota(selectedRotaId);
      setViagens(viagensData);

      const currentTripExists = viagensData.find(
        (v) => v.idViagem === selectedTripId
      );
      if (viagensData.length > 0 && !currentTripExists) {
        setSelectedTripId(viagensData[0].idViagem);
      } else if (viagensData.length === 0) {
        setSelectedTripId(null);
      }
    } catch {
      toast.error("Falha ao carregar viagens.");
    } finally {
      setLoadingViagens(false);
    }
  };

  useEffect(() => {
    fetchViagens();
  }, [selectedRotaId]);

  // === 3. BUSCAR EMBARQUES ===
  useEffect(() => {
    if (!selectedTripId) return setEmbarques([]);

    const fetchEmbarques = async () => {
      try {
        setLoadingEmbarques(true);
        const embarquesData = await getEmbarquesDaViagem(selectedTripId);

        const colaboradores = await Promise.all(
          embarquesData.map((e) => getColaboradorById(e.idColaborador))
        );

        const embarquesComNomes = embarquesData.map((e, i) => ({
          ...e,
          nomeColaborador: colaboradores[i]?.nome || "Desconhecido",
          cargoColaborador: colaboradores[i]?.role || "N/A",
        }));

        setEmbarques(embarquesComNomes);
      } catch {
        setEmbarques([]);
      } finally {
        setLoadingEmbarques(false);
      }
    };
    fetchEmbarques();
  }, [selectedTripId]);

  // === 4. FILTRAR EMBARQUES ===
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

  // === HANDLERS ===
  const handleInputChange = (e) => {
    setNewTripData({ ...newTripData, [e.target.name]: e.target.value });
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!newTripData.idMotorista || !newTripData.idVeiculo) {
      toast.warn("Selecione um motorista e um veículo.");
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
      toast.success("Viagem criada com sucesso!");
      setIsModalOpen(false);
      fetchViagens();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar viagem.");
    } finally {
      setIsCreating(false);
    }
  };

  // --- HANDLERS DE ATIVAR/INATIVAR ---
  const openToggleModal = (viagem, e) => {
    e.stopPropagation();
    setTripToToggle(viagem);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!tripToToggle) return;

    setIsToggling(true);
    const novoStatus = !tripToToggle.ativo;
    const acaoTexto = novoStatus ? "ativada" : "encerrada";

    try {
      const payload = { ...tripToToggle, ativo: novoStatus };
      await updateViagem(tripToToggle.idViagem, payload);

      toast.success(`Viagem ${acaoTexto} com sucesso.`);

      setViagens((prev) =>
        prev.map((v) =>
          v.idViagem === tripToToggle.idViagem ? { ...v, ativo: novoStatus } : v
        )
      );
      setIsConfirmModalOpen(false);
      setTripToToggle(null);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao alterar status da viagem.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
  <main className="flex-1 p-4 md:p-10 ml-16 overflow-x-hidden">
    <div className="w-full max-w-6xl mx-auto">
      {/* CABEÇALHO */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#3B7258]">
          REGISTRO DE VIAGEM
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie suas viagens e visualize os embarques diários.
        </p>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* === ESQUERDA: LISTA DE ROTAS === */}
        <aside className="w-full lg:w-1/4">
          <div className="bg-white rounded-2xl shadow-md p-4 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Route size={20} className="text-gray-600" />
              Rotas
            </h2>
            {loadingInitial ? (
              <div className="flex justify-center py-4">
                <Loading size={60} />
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {rotas.map((rota) => (
                  <button
                    key={rota.idRota}
                    onClick={() => setSelectedRotaId(rota.idRota)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedRotaId === rota.idRota
                        ? "bg-[#038C4C] text-white shadow"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <p className="font-bold truncate">{rota.nome}</p>
                    <p className="text-xs opacity-90">
                      {rota.cidadeNome} - {rota.periodo}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* === DIREITA: VIAGENS E EMBARQUES === */}
        <section className="flex-1 space-y-6">
          {/* 1. SELEÇÃO DA VIAGEM (Card Horizontal) */}
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Selecione a Viagem
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={!selectedRotaId || loadingInitial}
                className="flex items-center gap-2 text-sm text-[#038C4C] hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
                Nova Viagem
              </button>
            </div>

            {loadingViagens ? (
              <div className="flex justify-center py-4">
                <Loading size={60} />
              </div>
            ) : viagens.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {viagens.map((v) => {
                  const vDetails = veiculos.find(
                    (vec) =>
                      vec.id === v.idVeiculo || vec.idVeiculo === v.idVeiculo
                  );
                  const isProcessing = isToggling === v.idViagem;

                  return (
                    <div
                      key={v.idViagem}
                      onClick={() => setSelectedTripId(v.idViagem)}
                      className={`min-w-[230px] p-3 rounded-lg border-2 cursor-pointer transition-all relative group ${
                        selectedTripId === v.idViagem
                          ? "border-[#038C4C] bg-green-50"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1">
                            <Truck size={14} />
                            {vDetails
                              ? vDetails.placa
                              : `Viagem ${v.idVeiculo}`}
                          </h3>
                        </div>

                        {/* Botão de Ativar/Inativar */}
                        <button
                          onClick={(e) => openToggleModal(v, e)}
                          disabled={isProcessing}
                          title={
                            v.ativo ? "Encerrar Viagem" : "Reativar Viagem"
                          }
                          className={`p-1.5 rounded-full transition-colors shadow-sm z-10 ${
                            v.ativo
                              ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600"
                              : "bg-gray-200 text-gray-500 hover:bg-green-100 hover:text-green-700"
                          }`}
                        >
                          {isProcessing ? (
                            <Loading size={14} />
                          ) : (
                            <Power size={14} />
                          )}
                        </button>
                      </div>

                      {/* Badge de Status Texto */}
                      <div className="mt-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            v.ativo
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {v.ativo ? "Ativa" : "Encerrada"}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-200/50 text-xs text-gray-500 flex justify-between">
                        <span>{formatSimpleTime(v.saidaPrevista)}</span>
                        <span className="font-mono">➔</span>
                        <span>{formatSimpleTime(v.chegadaPrevista)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Nenhuma viagem nesta rota.
              </p>
            )}
          </div>

          {/* 2. LISTA DE EMBARQUES (Com Filtro de Data) */}
          {selectedTrip && (
            <div className="bg-white p-6 rounded-xl shadow-md min-h-[400px]">
              <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-6 border-b pb-4 border-gray-100 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <Users className="text-[#038C4C]" size={24} />
                      Embarques
                    </h2>
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-bold border ${
                        selectedTrip.ativo
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {selectedTrip.ativo
                        ? "VIAGEM ATIVA"
                        : "VIAGEM ENCERRADA"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedVeiculoDetails
                      ? `${selectedVeiculoDetails.modelo} - ${selectedVeiculoDetails.placa}`
                      : `Veículo ID: ${selectedTrip.idVeiculo}`}
                  </p>
                </div>

                <div className="flex flex-col w-full sm:w-auto">
                  <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                    Filtrar Dia
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={embarqueDateFilter}
                      onChange={(e) => setEmbarqueDateFilter(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#038C4C] outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              {loadingEmbarques ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loading size={80} />
                  <p className="mt-4">Carregando passageiros...</p>
                </div>
              ) : filteredEmbarques.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-400 px-4 mb-2">
                    <span>COLABORADOR</span>
                    <span>HORÁRIO</span>
                  </div>
                  {filteredEmbarques.map((e) => (
                    <div
                      key={e.idEmbarque}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#36A293] flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(e.nomeColaborador)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {e.nomeColaborador}
                          </p>
                          <p className="text-xs text-gray-500">
                            {e.cargoColaborador}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-100">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">
                          {formatTimestamp(e.dataEmbarque).split(" ")[1] ||
                            formatTimestamp(e.dataEmbarque)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 text-center text-xs text-gray-400">
                    Total: {filteredEmbarques.length} passageiros em{" "}
                    {new Date(
                      embarqueDateFilter + "T00:00:00"
                    ).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Search size={40} className="mb-3 opacity-50" />
                  <p className="text-lg font-medium text-gray-500">
                    Nenhum embarque encontrado
                  </p>
                  <p className="text-sm">
                    Não há registros para a data{" "}
                    {new Date(
                      embarqueDateFilter + "T00:00:00"
                    ).toLocaleDateString()}
                    .
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>

    {/* === MODAL: CRIAR NOVA VIAGEM === */}
    {isModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-[#3B7258]">
              Criar Nova Viagem
            </h3>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <User size={14} /> Motorista
                </label>
                <select
                  name="idMotorista"
                  required
                  value={newTripData.idMotorista}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#36A293] outline-none bg-white"
                >
                  <option value="">Selecione um Motorista...</option>
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
                <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Truck size={14} /> Veículo
                </label>
                <select
                  name="idVeiculo"
                  required
                  value={newTripData.idVeiculo}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#36A293] outline-none bg-white"
                >
                  <option value="">Selecione um Veículo...</option>
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Data de Criação
              </label>
              <input
                type="date"
                name="data"
                value={newTripData.data}
                required
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#36A293] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Saída Prevista
                </label>
                <input
                  type="time"
                  name="saidaPrevista"
                  required
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#36A293] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Chegada Prevista
                </label>
                <input
                  type="time"
                  name="chegadaPrevista"
                  required
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#36A293] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                name="tipoViagem"
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#36A293] outline-none bg-white"
              >
                <option value="ida">Ida</option>
                <option value="volta">Volta</option>
              </select>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="px-4 py-2 text-sm bg-[#038C4C] text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-70"
              >
                {isCreating ? <Loading size={16} /> : <Save size={16} />}{" "}
                Salvar Viagem
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* === MODAL: CONFIRMAR ALTERAÇÃO DE STATUS === */}
    {isConfirmModalOpen && tripToToggle && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 p-6 text-center">
          <div
            className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full mb-4 ${
              tripToToggle.ativo ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <AlertTriangle
              className={
                tripToToggle.ativo ? "text-red-600" : "text-green-600"
              }
              size={24}
            />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {tripToToggle.ativo ? "Encerrar Viagem?" : "Ativar Viagem?"}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {tripToToggle.ativo
              ? "Você tem certeza que deseja encerrar esta viagem? Ela ficará marcada como finalizada."
              : "Você deseja reativar esta viagem? Ela ficará disponível para novos registros."}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsConfirmModalOpen(false);
                setTripToToggle(null);
              }}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmToggle}
              disabled={isToggling}
              className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors flex items-center justify-center gap-2 ${
                tripToToggle.ativo
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isToggling ? (
                <Loading size={16} />
              ) : (
                <>{tripToToggle.ativo ? "Sim, Encerrar" : "Sim, Ativar"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </main>
);

};

export default RegistroViagem;
