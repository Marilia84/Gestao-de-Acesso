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
const RouteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2 text-gray-500"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const mockRotas = [
  { id: 2, nome: "Guará Centro (Existente)" },
  { id: 5, nome: "Taguatinga Norte" },
  { id: 8, nome: "Asa Sul / W3" },
  { id: 11, nome: "Plano Piloto - Eixo" },
];

const RegistroViagem = () => {
  const [rotas] = useState(mockRotas);
  const [selectedRotaId, setSelectedRotaId] = useState(2);
  const [viagens, setViagens] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [embarques, setEmbarques] = useState([]);
  const [loadingEmbarques, setLoadingEmbarques] = useState(false);

  // Efeito para buscar VIAGENS quando a ROTA muda
  useEffect(() => {
    if (!selectedRotaId) return;

    const fetchViagensPorRota = async () => {
      setLoading(true);
      setViagens([]);
      setSelectedTripId(null);
      setEmbarques([]);

      try {
        const response = await api.get(`/viagens?idRota=${selectedRotaId}`);
        const dadosApi = response.data;
        setViagens(dadosApi);

        if (dadosApi && dadosApi.length > 0) {
          setSelectedTripId(dadosApi[0].idViagem);
        }
      } catch (err) {
        console.error(
          `Erro ao buscar viagens para a rota ${selectedRotaId}:`,
          err
        );
        setViagens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchViagensPorRota();
  }, [selectedRotaId]);

  // Efeito para buscar EMBARQUES e seus COLABORADORES quando a VIAGEM muda
  useEffect(() => {
    if (!selectedTripId) {
      setEmbarques([]);
      return;
    }

    const fetchEmbarquesComColaboradores = async () => {
      setLoadingEmbarques(true);
      try {
        // 1. Busca a lista de embarques
        const embarquesResponse = await api.get(
          `/viagens/${selectedTripId}/embarques`
        );
        const embarquesDaApi = embarquesResponse.data;

        if (embarquesDaApi.length === 0) {
          setEmbarques([]);
          return;
        }

        // 2. Cria um array de promessas, uma para cada requisição de colaborador
        const colaboradorPromises = embarquesDaApi.map((embarque) =>
          api.get(`/colaboradores/${embarque.idColaborador}`)
        );

        // 3. Executa todas as promessas em paralelo
        const colaboradorResponses = await Promise.all(colaboradorPromises);

        // 4. Combina os dados dos embarques com os nomes dos colaboradores
        const embarquesEnriquecidos = embarquesDaApi.map((embarque, index) => {
          return {
            ...embarque, // Mantém todos os dados originais do embarque
            nomeColaborador: colaboradorResponses[index].data.nome, // Adiciona o nome do colaborador
          };
        });

        setEmbarques(embarquesEnriquecidos);
      } catch (error) {
        console.error(
          `Erro ao buscar dados de embarque para a viagem ${selectedTripId}:`,
          error
        );
        setEmbarques([]);
      } finally {
        setLoadingEmbarques(false);
      }
    };

    fetchEmbarquesComColaboradores();
  }, [selectedTripId]);

  const selectedTrip = viagens.find(
    (viagem) => viagem.idViagem === selectedTripId
  );

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    return new Date(timeStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  };

  // Função para pegar as iniciais do nome
  const getInitials = (name) => {
    if (!name || typeof name !== "string") return "?";
    const names = name.split(" ");
    const firstInitial = names[0][0] || "";
    const lastInitial = names.length > 1 ? names[names.length - 1][0] : "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const handleRotaChange = (event) => {
    setSelectedRotaId(Number(event.target.value));
  };

  const handleTripSelection = (tripId) => {
    setSelectedTripId(tripId);
  };

  return (
    <div className="flex bg-[#F4F7F6] min-h-screen">
      <Navbar />
      <main className="flex-1 p-6 md:p-10 relative">
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 md:w-1/3 md:h-2/3 bg-green-200/30 rounded-tl-full -z-0"></div>

        <div className="relative z-10">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-5xl font-bold text-[#3B7258]">
              REGISTRO DE VIAGEM
            </h1>
            <div className="w-full sm:w-auto">
              <label htmlFor="rota-select" className="sr-only">
                Selecione uma Rota
              </label>
              <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                <RouteIcon />
                <select
                  id="rota-select"
                  value={selectedRotaId}
                  onChange={handleRotaChange}
                  className="bg-transparent text-gray-700 font-semibold focus:outline-none w-full cursor-pointer"
                >
                  {rotas.map((rota) => (
                    <option key={rota.id} value={rota.id}>
                      {rota.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-xl text-gray-600">Buscando viagens...</p>
            </div>
          ) : viagens.length > 0 ? (
            <div className="flex space-x-6 overflow-x-auto pb-4 -mx-6 px-6">
              {viagens.map((viagem) => (
                <div
                  key={viagem.idViagem}
                  className={`bg-white rounded-2xl p-5 shadow-md min-w-[320px] cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-1 ${
                    selectedTripId === viagem.idViagem
                      ? "border-2 border-[#36A293]"
                      : "border-2 border-transparent"
                  }`}
                  onClick={() => handleTripSelection(viagem.idViagem)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        Veículo: {viagem.idVeiculo}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Rota: {viagem.idRota}
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
                      <UserIcon /> Lider:{" "}
                      <span className="font-semibold ml-1">
                        {viagem.idMotorista}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <UsersIcon /> Passageiros:{" "}
                      <span className="font-semibold ml-1">
                        {embarques.length || "N/D"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon /> Saída:{" "}
                      <span className="font-semibold ml-1">
                        {formatTime(viagem.saidaPrevista)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ClockIcon /> Chegada:{" "}
                      <span className="font-semibold ml-1">
                        {viagem.ativo
                          ? "Em Trânsito"
                          : formatTime(viagem.chegadaPrevista)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center bg-white p-6 rounded-xl shadow">
              <p className="text-xl text-gray-600">
                Nenhuma viagem encontrada para esta rota.
              </p>
            </div>
          )}

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
                  <p className="text-center bg-white p-4 rounded-xl text-gray-500">
                    Carregando embarques...
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
                            {/* 5. JSX ADAPTADO: Usa as iniciais do nome */}
                            {getInitials(embarque.nomeColaborador)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {/* 5. JSX ADAPTADO: Exibe o nome do colaborador */}
                              {embarque.nomeColaborador}
                            </p>
                            <p className="text-sm text-gray-500">
                              Método: {embarque.metodo}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-600 font-medium">
                          <ClockIcon />
                          <span>{formatTime(embarque.dataEmbarque)}</span>
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
              !loading &&
              viagens.length > 0 && (
                <p className="text-center text-gray-500 mt-10">
                  Selecione uma viagem para ver os detalhes de embarque.
                </p>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegistroViagem;
