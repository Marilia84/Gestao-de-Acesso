import React, { useState, useEffect } from "react";

// 1. IMPORTA OS NOVOS SERVIÇOS DE API
import { getRotas } from "../api/rotaService";
import { getViagensPorRota, getEmbarquesDaViagem } from "../api/viagemService";
import { getColaboradorById } from "../api/colaboradorService";
// O 'api' não é mais necessário aqui
// import api from "../api/axios";

// Importa Ícones do Lucide
import {
  Users,
  Clock,
  Route,
  User, // (Não está a ser usado no JSX, mas pode ser útil)
  Loader2, // Ícone de Loading
} from "lucide-react";

// Importa os formatadores
import {
  formatSimpleTime,
  formatTimestamp,
  getInitials,
} from "../utils/formatters"; // Ajuste o caminho se necessário

const RegistroViagem = () => {
  const [rotas, setRotas] = useState([]);
  const [selectedRotaId, setSelectedRotaId] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [loadingRotas, setLoadingRotas] = useState(true);
  const [loadingViagens, setLoadingViagens] = useState(false);
  const [embarques, setEmbarques] = useState([]);
  const [loadingEmbarques, setLoadingEmbarques] = useState(false);
  const [errorRotas, setErrorRotas] = useState(null);
  const [errorViagens, setErrorViagens] = useState(null);

  // Efeito para buscar as ROTAS (agora usa o serviço)
  useEffect(() => {
    const fetchRotas = async () => {
      setLoadingRotas(true);
      setErrorRotas(null);
      try {
        const rotasDaApi = await getRotas(); // Usa o serviço
        setRotas(rotasDaApi);

        if (rotasDaApi.length > 0) {
          setSelectedRotaId(rotasDaApi[0].idRota);
        }
      } catch (err) {
        console.error("Erro ao buscar rotas:", err);
        setErrorRotas("Falha ao carregar rotas.");
      } finally {
        setLoadingRotas(false);
      }
    };
    fetchRotas();
  }, []);

  // Efeito para buscar VIAGENS (agora usa o serviço)
  useEffect(() => {
    if (!selectedRotaId) return;

    const fetchViagensEContagens = async () => {
      setLoadingViagens(true);
      setErrorViagens(null);
      setViagens([]);
      setSelectedTripId(null);
      setEmbarques([]);

      try {
        // Usa o serviço
        const viagensIniciais = await getViagensPorRota(selectedRotaId);

        if (viagensIniciais.length === 0) {
          setViagens([]);
          return;
        }

        // Usa o serviço (Promise.all ainda é ótimo aqui)
        const contagemPromises = viagensIniciais.map((viagem) =>
          getEmbarquesDaViagem(viagem.idViagem)
        );
        const embarquesResponses = await Promise.all(contagemPromises);

        const viagensComContagem = viagensIniciais.map((viagem, index) => ({
          ...viagem,
          passengerCount: embarquesResponses[index].length, // Pega o .length do array retornado
        }));

        setViagens(viagensComContagem);

        if (viagensComContagem.length > 0) {
          setSelectedTripId(viagensComContagem[0].idViagem);
        }
      } catch (err) {
        console.error(
          `Erro ao buscar dados para a rota ${selectedRotaId}:`,
          err
        );
        setErrorViagens("Falha ao carregar viagens.");
        setViagens([]);
      } finally {
        setLoadingViagens(false);
      }
    };

    fetchViagensEContagens();
  }, [selectedRotaId]);

  // Efeito para buscar EMBARQUES (agora usa os serviços)
  useEffect(() => {
    if (!selectedTripId) {
      setEmbarques([]);
      return;
    }

    const fetchDetalhesEmbarquesComNomes = async () => {
      setLoadingEmbarques(true);
      try {
        // Usa o serviço
        const embarquesDaApi = await getEmbarquesDaViagem(selectedTripId);

        if (embarquesDaApi.length === 0) {
          setEmbarques([]);
          return;
        }

        // Usa o serviço (Promise.all)
        const colaboradorPromises = embarquesDaApi.map(
          (embarque) => getColaboradorById(embarque.idColaborador) // Usa o serviço
        );
        const colaboradorResponses = await Promise.all(colaboradorPromises);

        const embarquesComNomes = embarquesDaApi.map((embarque, index) => ({
          ...embarque,
          nomeColaborador: colaboradorResponses[index].nome, // Pega o .nome do objeto retornado
          cargoColaborador: colaboradorResponses[index].role,
        }));

        setEmbarques(embarquesComNomes);
      } catch (error) {
        console.error(
          `Erro ao buscar detalhes de embarque para a viagem ${selectedTripId}:`,
          error
        );
        setEmbarques([]);
      } finally {
        setLoadingEmbarques(false);
      }
    };

    fetchDetalhesEmbarquesComNomes();
  }, [selectedTripId]);

  // Encontra a viagem selecionada (sem alteração)
  const selectedTrip = viagens.find(
    (viagem) => viagem.idViagem === selectedTripId
  );

  // FUNÇÕES DE FORMATAÇÃO REMOVIDAS DAQUI

  // JSX (layout limpo e com ícones Lucide)
  return (
    <main className="flex-1 p-6 md:p-10 relative">
      <header className="mb-8">
        <h1 className="text-5xl font-bold text-[#3B7258]">
          REGISTRO DE VIAGEM
        </h1>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* PAINEL DA ESQUERDA (MASTER): LISTA DE ROTAS */}
        <aside className="md:w-1/3 lg:w-1/4 ">
          <div className="bg-white rounded-xl shadow p-6 h-full">
            {" "}
            {/* Padding ajustado */}
            <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
              <Route size={24} className="text-gray-600" /> {/* Ícone Lucide */}
              Rotas Disponíveis
            </h2>
            {loadingRotas ? (
              <div className="flex items-center justify-center text-gray-500">
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                Carregando rotas...
              </div>
            ) : errorRotas ? (
              <p className="text-red-500">{errorRotas}</p>
            ) : rotas.length > 0 ? (
              <div className="space-y-2">
                {rotas.map((rota) => (
                  <button
                    key={rota.idRota}
                    onClick={() => setSelectedRotaId(rota.idRota)}
                    className={`
                      w-full text-left p-3 rounded-lg transition-colors duration-200
                      ${
                        selectedRotaId === rota.idRota
                          ? "bg-[#36A293] text-white shadow-md"
                          : "hover:bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    <p className="font-bold">{rota.nome}</p>
                    <p className="text-sm opacity-90">{`${rota.cidadeNome} - ${rota.periodo}`}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma rota encontrada.</p>
            )}
          </div>
        </aside>

        {/* PAINEL DA DIREITA (DETAIL): VIAGENS E EMBARQUES */}
        <div className="flex-1">
          {loadingViagens ? (
            <div className="text-center py-10 flex items-center justify-center text-xl text-gray-600">
              <Loader2 className="animate-spin w-6 h-6 mr-3" />
              Buscando viagens...
            </div>
          ) : errorViagens ? (
            <div className="text-center py-10 text-xl text-red-500">
              {errorViagens}
            </div>
          ) : viagens.length > 0 ? (
            <>
              {/* Lista de Viagens */}
              <div className="flex space-x-6 overflow-x-auto pb-4 -mx-2 px-2">
                {viagens.map((viagem) => (
                  <div
                    key={viagem.idViagem}
                    className={`bg-white rounded-2xl p-5 shadow-md min-w-[320px] cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${
                      selectedTripId === viagem.idViagem
                        ? "border-2 border-[#36A293]"
                        : "border-2 border-transparent"
                    }`}
                    onClick={() => setSelectedTripId(viagem.idViagem)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          Veículo: {viagem.idVeiculo}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Data:{" "}
                          {new Date(viagem.data).toLocaleDateString("pt-BR", {
                            timeZone: "UTC",
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          viagem.ativo
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {viagem.ativo ? "Ativa" : "Finalizada"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center">
                        <Users size={16} className="mr-2 text-gray-500" />{" "}
                        {/* Ícone Lucide */}
                        Passageiros:{" "}
                        <span className="font-semibold ml-1">
                          {viagem.passengerCount}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {/* Espaço vazio para alinhar */}
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-gray-500" />{" "}
                        {/* Ícone Lucide */}
                        Saída:{" "}
                        <span className="font-semibold ml-1">
                          {formatSimpleTime(viagem.saidaPrevista)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-gray-500" />{" "}
                        {/* Ícone Lucide */}
                        Chegada:{" "}
                        <span className="font-semibold ml-1">
                          {viagem.ativo
                            ? "Em Trânsito"
                            : formatSimpleTime(viagem.chegadaPrevista)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lista de Embarques */}
              <div className="mt-10">
                {selectedTrip ? (
                  <>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      Embarques da viagem - Veículo: {selectedTrip.idVeiculo}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6 ml-1">
                      Visualize todos os embarques feitos na viagem selecionada.
                    </p>

                    {loadingEmbarques ? (
                      <div className="flex items-center justify-center text-gray-500 p-4">
                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        Carregando detalhes dos embarques...
                      </div>
                    ) : embarques.length > 0 ? (
                      <div className="space-y-3">
                        {embarques.map((embarque) => (
                          <div
                            key={embarque.idEmbarque}
                            className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm"
                          >
                            <div className="flex items-center">
                              <div className="bg-[#36A293] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 shrink-0">
                                {getInitials(embarque.nomeColaborador)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {embarque.nomeColaborador}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {embarque.cargoColaborador ||
                                    "Cargo não informado"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center text-gray-600 font-medium text-sm">
                              <Clock
                                size={16}
                                className="mr-1.5 text-gray-500"
                              />
                              <span>
                                {formatTimestamp(embarque.dataEmbarque)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center bg-white p-4 rounded-xl text-gray-500">
                        Não há registros de embarque para esta viagem.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 mt-10">
                    Selecione uma viagem para ver os detalhes.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center bg-white p-6 rounded-xl shadow h-full flex items-center justify-center">
              <p className="text-xl text-gray-600">
                {errorViagens
                  ? errorViagens
                  : "Nenhuma viagem encontrada para esta rota."}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default RegistroViagem;
