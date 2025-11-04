// src/pages/Gerenciar-linhas.jsx
import React, { useState, useEffect } from "react";
import api from "../api/axios";
import GoogleMapaRota from "../components/GoogleMapaRota";
import ModalColaboradores from "../components/ModalColaboradores";
import { toast } from "react-toastify";
import Loading from "../components/Loading";

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
  const [openModalColabs, setOpenModalColabs] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingCadastrarRota, setLoadingCadastrarRota] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (t) {
      api.defaults.headers.common.Authorization = `Bearer ${t}`;
      setTokenOk(true);
    }
  }, []);

  useEffect(() => {
    if (!tokenOk) return;
    const carregarTudo = async () => {
      setLoading(true);
      try {
        const [cidadesRes, pontosRes, rotasRes, colabsRes] = await Promise.all([
          api.get("/cidades"),
          api.get("/pontos"),
          api.get("/rotas"),
          api.get("/colaboradores"),
        ]);
        setCidades(cidadesRes.data || []);
        setPontos(pontosRes.data || []);
        setRotas(rotasRes.data || []);
        setColaboradores(colabsRes.data || []);
      } catch {
        toast.error("Erro ao carregar dados iniciais.");
      } finally {
        setLoading(false);
      }
    };
    carregarTudo();
  }, [tokenOk]);

  const pontosFiltrados = cidadeSelecionada
    ? pontos.filter((p) => String(p.idCidade) === String(cidadeSelecionada))
    : [];

  if (loading) return <Loading size={80} message="Carregando dados..." />;

  return (
    <main className="flex-1 p-6 md:p-10 ml-16 mt-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* CARD: Cadastrar Ponto */}
        <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-[#3B7258] mb-2">
            Cadastrar ponto
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Adicione novos pontos com localização automática
          </p>

          {/* Inputs cidade */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
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
              onClick={() => {}}
              className="bg-[#038C3E] text-white px-4 py-2 rounded-lg hover:bg-[#027a36] transition w-full sm:w-auto"
            >
              Adicionar
            </button>
          </div>

          {/* Cidade e Ponto */}
          <div className="flex flex-col gap-3 mb-3">
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

            <button className="bg-[#038C3E] text-white py-2 rounded-lg hover:bg-[#027a36] transition mt-2">
              Cadastrar Ponto
            </button>
          </div>
        </div>

        {/* CARD: Pontos cadastrados */}
        <div className="relative bg-white shadow-md rounded-lg p-6 sm:p-8 overflow-y-auto max-h-[500px]">
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

        {/* CARD: Cadastrar Rota */}
        <div className="relative bg-white shadow-md rounded-lg p-6 sm:p-10 overflow-x-auto">
          {loadingCadastrarRota && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg z-10">
              <Loading size={80} message="Salvando rota..." />
            </div>
          )}

          <h1 className="text-2xl font-semibold text-[#3B7258] mb-4">
            Cadastrar Rota
          </h1>

          <div className="flex flex-col md:flex-row gap-4 mb-3">
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

          <div className="flex flex-col md:flex-row gap-4 mb-3">
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

          <div className="flex flex-col gap-3">
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
              <button className="bg-[#038C3E] text-white px-4 py-2 rounded-lg hover:bg-[#027a36] transition w-full sm:w-auto">
                Adicionar
              </button>
            </div>
            <ol className="list-decimal ml-5 text-sm text-gray-700">
              {pontosRota.map((p, i) => (
                <li key={p.idPonto}>{p.nome}</li>
              ))}
            </ol>
          </div>

          <button className="bg-[#038C3E] text-white w-full py-2 mt-4 rounded-lg hover:bg-[#027a36] transition">
            Cadastrar Rota
          </button>
        </div>

        {/* CARD: Rotas cadastradas */}
        <div className="relative bg-white shadow-md rounded-lg p-6 sm:p-10 overflow-x-auto">
          <h1 className="text-2xl font-semibold text-[#3B7258] mb-4">
            Rotas cadastradas
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rotas.map((rota) => (
              <div
                key={rota.idRota}
                className="bg-white rounded-xl shadow p-5 flex flex-col md:flex-row gap-4"
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
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 px-4 mt-3 rounded-lg">
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
    </main>
  );
}
