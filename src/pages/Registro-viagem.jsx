import React, { useState, useEffect } from "react";
import { getRotas } from "../api/rotaService";
import { getViagensPorRota, getEmbarquesDaViagem } from "../api/viagemService";
import { getColaboradorById } from "../api/colaboradorService";
import { Users, Clock, Route, Loader2 } from "lucide-react";
import {
  formatSimpleTime,
  formatTimestamp,
  getInitials,
} from "../utils/formatters";

const RegistroViagem = () => {
  const [rotas, setRotas] = useState([]);
  const [selectedRotaId, setSelectedRotaId] = useState(null);
  const [viagens, setViagens] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [embarques, setEmbarques] = useState([]);

  const [loadingRotas, setLoadingRotas] = useState(true);
  const [loadingViagens, setLoadingViagens] = useState(false);
  const [loadingEmbarques, setLoadingEmbarques] = useState(false);
  const [errorRotas, setErrorRotas] = useState(null);
  const [errorViagens, setErrorViagens] = useState(null);

  // === BUSCAR ROTAS ===
  useEffect(() => {
    const fetchRotas = async () => {
      try {
        setLoadingRotas(true);
        const data = await getRotas();
        setRotas(data);
        if (data.length > 0) setSelectedRotaId(data[0].idRota);
      } catch {
        setErrorRotas("Falha ao carregar rotas.");
      } finally {
        setLoadingRotas(false);
      }
    };
    fetchRotas();
  }, []);

  // === BUSCAR VIAGENS ===
  useEffect(() => {
    if (!selectedRotaId) return;
    const fetchViagens = async () => {
      try {
        setLoadingViagens(true);
        setErrorViagens(null);
        const viagensData = await getViagensPorRota(selectedRotaId);
        if (viagensData.length === 0) return setViagens([]);

        const embarquesPorViagem = await Promise.all(
          viagensData.map((v) => getEmbarquesDaViagem(v.idViagem))
        );

        const viagensComContagem = viagensData.map((v, i) => ({
          ...v,
          passengerCount: embarquesPorViagem[i].length,
        }));

        setViagens(viagensComContagem);
        setSelectedTripId(viagensComContagem[0]?.idViagem || null);
      } catch {
        setErrorViagens("Falha ao carregar viagens.");
      } finally {
        setLoadingViagens(false);
      }
    };
    fetchViagens();
  }, [selectedRotaId]);

  // === BUSCAR EMBARQUES ===
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
          nomeColaborador: colaboradores[i].nome,
          cargoColaborador: colaboradores[i].role,
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

  const selectedTrip = viagens.find((v) => v.idViagem === selectedTripId);

  return (
    <main className="flex-1 px-3 sm:px-5 md:px-10 py-8 mt-20 md:ml-12 overflow-x-hidden">
      {/* Cabeçalho */}
      <header className="mb-8 text-center md:text-left">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#3B7258] leading-tight">
          REGISTRO DE VIAGEM
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mt-2">
          Visualize as rotas, viagens e embarques registrados no sistema.
        </p>
      </header>

      {/* === CONTEÚDO PRINCIPAL === */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* === PAINEL DE ROTAS === */}
        <aside className="w-full lg:w-1/3 xl:w-1/4">
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 h-fit">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Route size={22} className="text-gray-600" />
              Rotas Disponíveis
            </h2>

            {loadingRotas ? (
              <div className="flex items-center justify-center text-gray-500 py-6">
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                Carregando rotas...
              </div>
            ) : errorRotas ? (
              <p className="text-red-500">{errorRotas}</p>
            ) : rotas.length > 0 ? (
              <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1 scrollbar-thin scrollbar-thumb-gray-300">
                {rotas.map((rota) => (
                  <button
                    key={rota.idRota}
                    onClick={() => setSelectedRotaId(rota.idRota)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedRotaId === rota.idRota
                        ? "bg-[#038C4C] text-white shadow-md"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <p className="font-bold truncate">{rota.nome}</p>
                    <p className="text-sm opacity-90 truncate">
                      {rota.cidadeNome} - {rota.periodo}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Nenhuma rota encontrada.
              </p>
            )}
          </div>
        </aside>

        {/* === PAINEL DE VIAGENS E EMBARQUES === */}
        <section className="flex-1">
          {loadingViagens ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-600 text-lg">
              <Loader2 className="animate-spin w-6 h-6 mb-2" />
              Buscando viagens...
            </div>
          ) : errorViagens ? (
            <div className="text-center py-10 text-lg text-red-500">
              {errorViagens}
            </div>
          ) : viagens.length > 0 ? (
            <>
              {/* Lista de Viagens */}
              <div className="flex flex-wrap lg:flex-nowrap gap-4 overflow-x-auto pb-4">
                {viagens.map((viagem) => (
                  <div
                    key={viagem.idViagem}
                    onClick={() => setSelectedTripId(viagem.idViagem)}
                    className={`bg-white rounded-2xl p-5 shadow-md w-full sm:w-[280px] md:w-[320px] cursor-pointer transition-all ${
                      selectedTripId === viagem.idViagem
                        ? "border-2 border-[#038C4C] shadow-lg"
                        : "border-2 border-transparent hover:shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-full">
                        <h3 className="font-bold text-lg text-gray-800 truncate">
                          Veículo: {viagem.idVeiculo}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Data:{" "}
                          {new Date(viagem.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 ${
                          viagem.ativo
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {viagem.ativo ? "Ativa" : "Finalizada"}
                      </span>
                    </div>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center">
          <Users size={16} className="mr-2 text-gray-500" />
          Passageiros:
          <span className="font-semibold ml-1">{viagem.passengerCount}</span>
        </div>
        <div className="flex items-center">
          <Clock size={16} className="mr-2 text-gray-500" />
          Saída:
          <span className="font-semibold ml-1">
            {formatSimpleTime(viagem.saidaPrevista)}
          </span>
        </div>
        <div className="flex items-center">
          <Clock size={16} className="mr-2 text-gray-500" />
          Chegada:
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


              {/* === LISTA DE EMBARQUES === */}
              <div className="mt-10">
                {selectedTrip ? (
                  <>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 text-center md:text-left">
                      Embarques - Veículo {selectedTrip.idVeiculo}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6 text-center md:text-left">
                      Visualize os embarques da viagem selecionada.
                    </p>

                    {loadingEmbarques ? (
                      <div className="flex items-center justify-center text-gray-500 p-4">
                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                        Carregando embarques...
                      </div>
                    ) : embarques.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {embarques.map((e) => (
                          <div
                            key={e.idEmbarque}
                            className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm"
                          >
                            <div className="flex items-center mb-3 sm:mb-0">
                              <div className="bg-[#36A293] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4">
                                {getInitials(e.nomeColaborador)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 truncate">
                                  {e.nomeColaborador}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {e.cargoColaborador || "Cargo não informado"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center text-gray-600 font-medium text-sm">
                              <Clock size={16} className="mr-1.5 text-gray-500" />
                              <span>{formatTimestamp(e.dataEmbarque)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center bg-white p-4 rounded-xl text-gray-500">
                        Nenhum embarque registrado.
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
            <div className="text-center bg-white p-6 rounded-xl shadow">
              <p className="text-lg text-gray-600">
                Nenhuma viagem encontrada para esta rota.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default RegistroViagem;
