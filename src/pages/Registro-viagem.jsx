// src/pages/RegistroViagem.js

import React, { useState } from "react";
import Navbar from "../components/Navbar"; // Reutilize seu Navbar

// --- ÍCONES (para detalhes visuais) ---
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

// --- DADOS DE EXEMPLO ---
const initialTripsData = [
  {
    id: 1,
    name: "Ônibus 1",
    route: "Guará centro",
    status: "Ativa",
    driver: "Pablo",
    passengerCount: 34,
    departureTime: "06:30",
    arrivalTime: "Em Trânsito",
    boardings: [
      {
        id: 101,
        initials: "FS",
        name: "Felipe Souza",
        role: "Assistente de suporte",
        time: "06:30",
      },
      {
        id: 102,
        initials: "MA",
        name: "Mariana Almeida",
        role: "Analista de sistemas",
        time: "06:32",
      },
      {
        id: 103,
        initials: "CP",
        name: "Carlos Pereira",
        role: "Gerente de projetos",
        time: "06:35",
      },
      {
        id: 104,
        initials: "JG",
        name: "Joana Gomes",
        role: "Desenvolvedora Frontend",
        time: "06:38",
      },
      {
        id: 105,
        initials: "LV",
        name: "Lucas Viana",
        role: "Estagiário",
        time: "06:40",
      },
    ],
  },
  {
    id: 2,
    name: "Ônibus 1",
    route: "Guará centro",
    status: "Finalizada",
    driver: "Pablo",
    passengerCount: 34,
    departureTime: "06:30",
    arrivalTime: "08:15",
    boardings: [
      {
        id: 201,
        initials: "RF",
        name: "Ricardo Fernandes",
        role: "Designer UI/UX",
        time: "06:30",
      },
      {
        id: 202,
        initials: "AS",
        name: "Amanda Silva",
        role: "Analista de QA",
        time: "06:33",
      },
    ],
  },
  {
    id: 3,
    name: "Ônibus 1",
    route: "Guará centro",
    status: "Finalizada",
    driver: "Pablo",
    passengerCount: 32,
    departureTime: "06:30",
    arrivalTime: "08:10",
    boardings: [
      {
        id: 301,
        initials: "BC",
        name: "Bruno Costa",
        role: "Desenvolvedor Backend",
        time: "06:30",
      },
    ],
  },
];

const RegistroViagem = () => {
  // Estado para armazenar os dados de todas as viagens
  const [trips, setTrips] = useState(initialTripsData);

  // Estado para controlar qual viagem está SELECIONADA. Começa com o ID da primeira viagem.
  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || null);

  // Encontra o objeto completo da viagem selecionada com base no seu ID
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId);

  return (
    <div className="flex bg-[#F4F7F6] min-h-screen">
      <Navbar /> {/* Seu menu lateral */}
      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-10 relative">
        {/* Forma decorativa no canto inferior direito */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 md:w-1/3 md:h-2/3 bg-green-200/30 rounded-tl-full -z-0"></div>

        <div className="relative z-10">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-5xl font-bold text-[#3B7258]">
              REGISTRO DE VIAGEM
            </h1>
            {/* Ícone de Sair, se necessário */}
          </header>

          {/* Seção 1: Cards de Viagem (com rolagem horizontal) */}
          <div className="flex space-x-6 overflow-x-auto pb-4 -mx-6 px-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                // Aplica um estilo diferente se o card estiver selecionado
                className={`
                  bg-white rounded-2xl p-5 shadow-md min-w-[320px] cursor-pointer
                  transition-all duration-200 ease-in-out transform hover:-translate-y-1
                  ${
                    selectedTripId === trip.id
                      ? "border-2 border-[#36A293]"
                      : "border-2 border-transparent"
                  }
                `}
                onClick={() => setSelectedTripId(trip.id)} // Atualiza o ID selecionado ao clicar
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {trip.name}
                    </h3>
                    <p className="text-sm text-gray-500">{trip.route}</p>
                  </div>
                  {/* Badge de Status com cor condicional */}
                  <span
                    className={`
                      px-3 py-1 text-xs font-semibold rounded-full
                      ${
                        trip.status === "Ativa"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    {trip.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center">
                    <UserIcon /> Lider:{" "}
                    <span className="font-semibold ml-1">{trip.driver}</span>
                  </div>
                  <div className="flex items-center">
                    <UsersIcon /> Passageiros:{" "}
                    <span className="font-semibold ml-1">
                      {trip.passengerCount}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon /> Saída:{" "}
                    <span className="font-semibold ml-1">
                      {trip.departureTime}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon /> Chegada:{" "}
                    <span className="font-semibold ml-1">
                      {trip.arrivalTime}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Seção 2: Lista de Embarques (baseada na viagem selecionada) */}
          <div className="mt-10">
            {selectedTrip ? ( // Renderiza apenas se uma viagem for encontrada
              <>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Embarques da viagem - {selectedTrip.name}
                </h2>
                <p className="text-sm text-gray-500 mb-6 ml-1">
                  Visualize todos os embarques feitos na viagem selecionada.
                </p>

                <div className="space-y-3">
                  {selectedTrip.boardings.map((boarding) => (
                    <div
                      key={boarding.id}
                      className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center">
                        <div className="bg-[#36A293] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4">
                          {boarding.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {boarding.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {boarding.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600 font-medium">
                        <ClockIcon />
                        <span>{boarding.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 mt-10">
                Selecione uma viagem para ver os embarques.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegistroViagem;
