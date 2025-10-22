// src/pages/RegistroViagem.js

import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios"; // Verifique se o caminho para sua instância do axios está correto

// --- ÍCONES ---
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-2 text-gray-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-2 text-gray-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);
const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-1 text-gray-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const PersonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
// Ícone para o painel de rotas
const RoutePanelIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2 opacity-70"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
  </svg>
);

const RegistroViagem = () => {
  const [rotas, setRotas] = useState([]);
  const [selectedRotaId, setSelectedRotaId] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [loadingRotas, setLoadingRotas] = useState(true); // Loading específico para as rotas
  const [loadingViagens, setLoadingViagens] = useState(false); // Loading para as viagens
  const [embarques, setEmbarques] = useState([]);
  const [loadingEmbarques, setLoadingEmbarques] = useState(false);

  // Efeito para buscar as ROTAS na inicialização
  useEffect(() => {
    const fetchRotas = async () => {
      setLoadingRotas(true);
      try {
        const response = await api.get("/rotas");
        const rotasDaApi = response.data;
        setRotas(rotasDaApi);

        if (rotasDaApi.length > 0) {
          setSelectedRotaId(rotasDaApi[0].idRota);
        }
      } catch (err) {
        console.error("Erro ao buscar rotas:", err);
      } finally {
        setLoadingRotas(false);
      }
    };
    fetchRotas();
  }, []);

  // Efeito para buscar VIAGENS e a CONTAGEM quando a ROTA muda
  useEffect(() => {
    if (!selectedRotaId) return;

    const fetchViagensEContagens = async () => {
      setLoadingViagens(true);
      setViagens([]);
      setSelectedTripId(null);
      setEmbarques([]);

      try {
        const viagensResponse = await api.get(
          `/viagens?idRota=${selectedRotaId}`
        );
        const viagensIniciais = viagensResponse.data;

        if (viagensIniciais.length === 0) {
          setViagens([]);
          return;
        }

        const contagemPromises = viagensIniciais.map((viagem) =>
          api.get(`/viagens/${viagem.idViagem}/embarques`)
        );
        const embarquesResponses = await Promise.all(contagemPromises);

        const viagensComContagem = viagensIniciais.map((viagem, index) => ({
          ...viagem,
          passengerCount: embarquesResponses[index].data.length,
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
        setViagens([]);
      } finally {
        setLoadingViagens(false);
      }
    };

    fetchViagensEContagens();
  }, [selectedRotaId]);

  // Efeito para buscar DETALHES dos embarques e NOMES
  useEffect(() => {
    if (!selectedTripId) {
      setEmbarques([]);
      return;
    }

    const fetchDetalhesEmbarquesComNomes = async () => {
      setLoadingEmbarques(true);
      try {
        const embarquesResponse = await api.get(
          `/viagens/${selectedTripId}/embarques`
        );
        const embarquesDaApi = embarquesResponse.data;

        if (embarquesDaApi.length === 0) {
          setEmbarques([]);
          return;
        }

        const colaboradorPromises = embarquesDaApi.map((embarque) =>
          api.get(`/colaboradores/${embarque.idColaborador}`)
        );
        const colaboradorResponses = await Promise.all(colaboradorPromises);

        const embarquesComNomes = embarquesDaApi.map((embarque, index) => ({
          ...embarque,
          nomeColaborador: colaboradorResponses[index].data.nome,
          cargoColaborador: colaboradorResponses[index].data.role,
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

  const selectedTrip = viagens.find(
    (viagem) => viagem.idViagem === selectedTripId
  );

  const formatSimpleTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return "N/A";
    return timeStr.slice(0, 5);
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "?";
    const names = name.split(" ").filter((n) => n);
    if (names.length === 0) return "?";
    const firstInitial = names[0][0] || "";
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  return (
    <div className="flex bg-[#F4F7F6] min-h-screen">
      <Navbar />
      <main className="flex-1 p-6 md:p-10 relative">
        <header className="mb-8">
          <h1 className="text-5xl font-bold text-[#3B7258]">
            REGISTRO DE VIAGEM
          </h1>
        </header>

        {/* 1. ESTRUTURA MASTER-DETAIL */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* PAINEL DA ESQUERDA (MASTER): LISTA DE ROTAS */}
          <aside className="md:w-1/3 lg:w-1/4 ">
            <div className="bg-white rounded-xl shadow p-7 h-full">
              <h2 className="text-3xl font-bold text-gray-800 mb-5">
                Rotas Disponíveis
              </h2>
              {loadingRotas ? (
                <p className="text-gray-500">Carregando rotas...</p>
              ) : (
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
              )}
            </div>
          </aside>

          {/* PAINEL DA DIREITA (DETAIL): VIAGENS E EMBARQUES */}
          <div className="flex-1">
            {loadingViagens ? (
              <div className="text-center py-10">
                <p className="text-xl text-gray-600">Buscando viagens...</p>
              </div>
            ) : viagens.length > 0 ? (
              <>
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
                      {/* Conteúdo do card da viagem... (sem alterações) */}
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
                          <UsersIcon /> Passageiros:{" "}
                          <span className="font-semibold ml-1">
                            {viagem.passengerCount}
                          </span>
                        </div>
                        <div className="flex items-center"></div>
                        <div className="flex items-center">
                          <ClockIcon /> Saída:{" "}
                          <span className="font-semibold ml-1">
                            {formatSimpleTime(viagem.saidaPrevista)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <ClockIcon /> Chegada:{" "}
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

                <div className="mt-10">
                  {selectedTrip ? (
                    <>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Embarques da viagem - Veículo: {selectedTrip.idVeiculo}
                      </h2>
                      <p className="text-sm text-gray-500 mb-6 ml-1">
                        Visualize todos os embarques feitos na viagem
                        selecionada.
                      </p>

                      {loadingEmbarques ? (
                        <p className="text-center bg-white p-4 rounded-xl text-gray-500">
                          Carregando detalhes dos embarques...
                        </p>
                      ) : embarques.length > 0 ? (
                        <div className="space-y-3">
                          {embarques.map((embarque) => (
                            <div
                              key={embarque.idEmbarque}
                              className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm"
                            >
                              <div className="flex items-center">
                                <div className="bg-[#36A293] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4">
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
                              <div className="flex items-center text-gray-600 font-medium">
                                <ClockIcon />
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
                  ) : null}
                </div>
              </>
            ) : (
              <div className="text-center bg-white p-6 rounded-xl shadow h-full flex items-center justify-center">
                <p className="text-xl text-gray-600">
                  Nenhuma viagem encontrada para a rota selecionada.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegistroViagem;
