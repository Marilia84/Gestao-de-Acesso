import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import GoogleMapaRota from "../components/GoogleMapaRota";
import ModalColaboradores from "../components/ModalColaboradores";

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

  const [trajetosByRota, setTrajetosByRota] = useState({}); // { [idRota]: [{ idPonto, nome, ordem, latitude, longitude }] }
  const [loadingTrajeto, setLoadingTrajeto] = useState({});
  const [openModalColabs, setOpenModalColabs] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] = useState(null);
  // Garante token no header da instância api
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
        setRotas(rotasRes.data || []);
        setColaboradores(colabsRes.data || []);

        await prefetchTrajetos(rotasLista);
      } catch (err) {
        console.error(
          "Erro nas cargas iniciais:",
          err.response?.data || err.message || err
        );
      }
    };

    carregarTudo();
  }, [tokenOk]);
  // depois dos useState
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
            // nome sempre preenchido a partir de nomePonto (fallback pra nome)
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

  // Util: normaliza “HH:mm” -> “HH:mm:ss”
  const toHMS = (hhmm) => {
    if (!hhmm) return "";
    return /^\d{2}:\d{2}$/.test(hhmm) ? `${hhmm}:00` : hhmm;
  };

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
      alert("Preencha cidade e UF.");
      return;
    }

    try {
      const response = await api.post("/cidades", {
        nome: novaCidade.trim(),
        uf: novaUf.trim().toUpperCase(),
      });

      setCidades((prev) => [...prev, response.data]);
      setNovaCidade("");
      setNovaUf("");
      alert("Cidade adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar cidade:", error.response?.data || error);
      alert("Erro ao cadastrar cidade.");
    }
  };

  const handleCadastrarPonto = async () => {
    if (
      !cidadeSelecionada ||
      !nomePonto.trim() ||
      !rua.trim() ||
      !numero.trim()
    ) {
      alert("Preencha todos os campos do ponto.");
      return;
    }

    try {
      const cidadeObj = cidades.find(
        (c) => String(c.idCidade) === String(cidadeSelecionada)
      );
      if (!cidadeObj) {
        alert("Cidade inválida.");
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

      setPontos((prev) => [...prev, response.data]);
      setNomePonto("");
      setRua("");
      setNumero("");
      alert("Ponto cadastrado com sucesso!");
    } catch (error) {
      console.error("Erro ao cadastrar ponto:", error.response?.data || error);
      alert("Erro ao cadastrar ponto.");
    }
  };

  const handleAdicionarPontoNaRota = () => {
    if (!pontoSelecionado) {
      alert("Selecione um ponto.");
      return;
    }
    const ponto = pontos.find(
      (p) => String(p.idPonto) === String(pontoSelecionado)
    );
    if (!ponto) {
      alert("Ponto inválido.");
      return;
    }
    if (pontosRota.some((p) => String(p.idPonto) === String(ponto.idPonto))) {
      alert("Este ponto já foi adicionado à rota.");
      return;
    }
    setPontosRota((prev) => [...prev, ponto]);
    setPontoSelecionado("");
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
      alert("Preencha todos os campos obrigatórios da rota.");
      return;
    }

    // Ajusta tipos/formato
    const payload = {
      nome: novaRota.trim(),
      idCidade: Number(cidadeSelecionada),
      periodo, // certifique-se que casa com o enum do backend
      capacidade: Number(capacidade),
      ativo: true,
      horaPartida:
        horaPartida.length > 5 ? horaPartida.substring(0, 5) : horaPartida, // Garante que seja "HH:mm"
      horaChegada:
        horaChegada.length > 5 ? horaChegada.substring(0, 5) : horaChegada, // Garante que seja "HH:mm" // HH:mm:ss
      pontos: pontosRota.map((p, i) => ({
        idPonto: Number(p.idPonto),
        ordem: i + 1,
      })),
    };
    try {
      console.log(" Payload rota:", payload);
      const res = await api.post("/rotas", payload);
      alert("Rota cadastrada com sucesso!");
      console.log(" Resposta:", res.data);

      // limpa
      setNovaRota("");
      setPeriodo("");
      setCapacidade("");
      setHoraPartida("");
      setHoraChegada("");
      setPontosRota([]);

      // atualiza lista e prefetch dos trajetos
      const rotasRes = await api.get("/rotas");
      const rotasLista = rotasRes.data || [];
      setRotas(rotasLista);
      await prefetchTrajetos(rotasLista);
    } catch (error) {
      const data = error.response?.data;
      console.error(
        "❌ Erro ao cadastrar rota:",
        data || error.message || error
      );
      alert(
        `Erro ao cadastrar rota.${data?.message ? `\nMensagem: ${data.message}` : ""
        }` + `${data?.error ? `\nDetalhe: ${data.error}` : ""}`
      );
    }
  };
  // abaixo dos useState, fora de handleCadastrarRota

  const pontosFiltrados = cidadeSelecionada
    ? pontos.filter((p) => String(p.idCidade) === String(cidadeSelecionada))
    : [];

  return (
    <div className="bg-[#E6E6E6] min-h-screen flex flex-col lg:flex-row items-start gap-4">
      <Navbar />
      <div className="flex flex-1 flex-col justify-center items-center mr-[10px] w-full">
        <h1 className="text-3xl font-bold mb-10 text-[#3B7258] mt-10">
          Gerenciar Linhas
        </h1>

        {/* CADASTRO DE PONTOS */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[600px] h-[500px]">
            <h1 className="text-xl font-semibold mb-4">Cadastrar ponto</h1>
            <p className="text-sm text-gray-600 mb-4">
              Adicione novos pontos de parada com geolocalização automática
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nova cidade"
                value={novaCidade}
                onChange={(e) => setNovaCidade(e.target.value)}
                className="border border-gray-500 rounded-lg px-4 py-2 w-full text-base"
              />
              <input
                type="text"
                placeholder="UF"
                maxLength={2}
                value={novaUf}
                onChange={(e) => setNovaUf(e.target.value.toUpperCase())}
                className="border border-gray-500 rounded-lg px-4 py-2 w-24 text-base text-center uppercase"
              />
              <button
                onClick={handleAdicionarCidade}
                className="bg-[#038C3E] text-white w-40 px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#027a36] transition"
              >
                Adicionar
              </button>
            </div>

            <div className="flex flex-col mb-4">
              <label
                htmlFor="cidade"
                className="text-sm font-semibold text-gray-800 mb-1"
              >
                Cidade
              </label>
              <select
                id="cidade"
                className="border border-gray-500 rounded-md px-3 py-2 text-sm text-gray-600"
                value={cidadeSelecionada}
                onChange={(e) => setCidadeSelecionada(e.target.value)}
              >
                <option value="">Selecione</option>
                {cidades.map((cidade) => (
                  <option key={cidade.idCidade} value={cidade.idCidade}>
                    {cidade.nome} - {cidade.uf}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col mb-4">
              <label className="text-sm font-semibold text-gray-800 mb-1">
                Nome do Ponto
              </label>
              <input
                className="border border-gray-500 rounded-lg p-2 w-full text-sm"
                placeholder="Nome do ponto"
                value={nomePonto}
                onChange={(e) => setNomePonto(e.target.value)}
              />
            </div>

            <div className="flex flex-col mb-4">
              <div className="flex gap-4">
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-semibold text-gray-800 mb-1">
                    Rua
                  </label>
                  <input
                    className="border border-gray-500 rounded-lg p-2 w-full text-sm"
                    placeholder="Rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-sm font-semibold text-gray-800 mb-1">
                    Número
                  </label>
                  <input
                    className="border border-gray-500 rounded-lg p-2 w-full text-sm"
                    placeholder="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              className="bg-[#038C3E] text-white w-full py-2 text-lg rounded-lg flex items-center justify-center gap-3 hover:bg-[#027a36] transition"
              onClick={handleCadastrarPonto}
            >
              <img
                src="src/assets/map-pin.svg"
                alt="location"
                className="w-6 h-6"
              />
              Cadastrar Ponto
            </button>
          </div>

          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[600px] h-[500px]">
            <h1 className="text-xl font-semibold mb-4">Pontos cadastrados</h1>
            <p className="text-sm text-gray-600 mb-4">
              Lista de todos os pontos
            </p>
            <div className="flex flex-col gap-2 h-[350px] overflow-y-auto">
              {pontos.map((ponto) => (
                <div
                  key={ponto.idPonto}
                  className="flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
                >
                  {ponto.nome}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROTAS */}
        <div className="mb-6">
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-10 w-[1220px]">
            <h1 className="text-xl font-semibold mb-6">Cadastrar Rota</h1>

            <div className="flex gap-4 mb-3 items-end">
              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Nome da Rota
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rota Matinal"
                  value={novaRota}
                  onChange={(e) => setNovaRota(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 w-full text-base"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Cidade
                </label>
                <select
                  value={cidadeSelecionada}
                  onChange={(e) => setCidadeSelecionada(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600"
                >
                  <option value="">Selecione</option>
                  {cidades.map((cidade) => (
                    <option key={cidade.idCidade} value={cidade.idCidade}>
                      {cidade.nome} - {cidade.uf}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Período
                </label>
                <select
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600"
                >
                  <option value="">Selecione</option>
                  <option value="MANHA">Manhã</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOITE">Noite</option>
                  <option value="MADRUGADA">Madrugada</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mb-3 items-end">
              <div className="flex flex-col w-32">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Capacidade
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  value={capacidade}
                  onChange={(e) => setCapacidade(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-center"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Horário de Partida
                </label>
                <input
                  type="time"
                  value={horaPartida}
                  onChange={(e) => setHoraPartida(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2"
                />
              </div>

              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-gray-800 mb-1">
                  Horário de Chegada
                </label>
                <input
                  type="time"
                  value={horaChegada}
                  onChange={(e) => setHoraChegada(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            <div className="flex flex-col mb-3">
              <label className="text-sm font-semibold text-gray-800 mb-1">
                Pontos da Rota
              </label>
              <div className="flex gap-3 mb-3">
                <select
                  value={pontoSelecionado}
                  onChange={(e) => setPontoSelecionado(e.target.value)}
                  className="border border-gray-500 rounded-lg px-4 py-2 text-gray-600 flex-1"
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
                  className="bg-[#038C3E] text-white px-6 py-2 rounded-lg hover:bg-[#027a36]"
                >
                  Adicionar
                </button>
              </div>
              <ol className="list-decimal ml-6 text-sm text-gray-700">
                {pontosRota.map((p, i) => (
                  <li key={p.idPonto}> {p.nome}</li>
                ))}
              </ol>
            </div>

            <button
              onClick={handleCadastrarRota}
              className="bg-[#038C3E] text-white w-full py-4 text-lg rounded-lg hover:bg-[#027a36] transition"
            >
              Cadastrar Rota
            </button>
          </div>
        </div>

        {/* ROTAS CADASTRADAS */}
        <div className="mb-6 h-[770px] overflow-x-auto">
          <div className="bg-[#EDEDED] shadow-md rounded-lg p-6 lg:p-10 w-[1220px] max-w-full">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                Rotas cadastradas
              </h1>
              <p className="text-sm text-gray-500">
                visualize todas as rotas e suas configurações
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rotas.map((rota) => {
                const pontosDaRota = trajetosByRota[rota.idRota] || [];
                return (
                  <div
                    key={rota.idRota}
                    className="bg-white rounded-2xl shadow p-5 flex gap-6"
                  >
                    {/* ===== ESQUERDA: infos ===== */}
                    <div className="flex-1 flex flex-col">
                      {/* Título + subtítulo */}
                      <div className="mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {rota.nome}{" "}
                          {rota.cidade?.nome ? `- ${rota.cidade.nome}` : ""}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {pontosDaRota.length} ponto
                          {pontosDaRota.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      {/* Turnos como pílulas */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-700 font-medium">
                          Turnos:
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 capitalize">
                          {(rota.periodo || "").toLowerCase()}
                        </span>
                        {rota.periodoSecundario && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 capitalize">
                            {(rota.periodoSecundario || "").toLowerCase()}
                          </span>
                        )}
                      </div>

                      {/* Lista dos pontos (do /trajeto) */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            className="text-emerald-600"
                          >
                            <path
                              fill="currentColor"
                              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5"
                            />
                          </svg>
                          Pontos da Rota
                        </div>

                        <ul className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                          {pontosDaRota.map((p, i) => (
                            <li
                              key={p.idPonto ?? i}
                              className="flex items-center gap-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center">
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                  <path
                                    fill="currentColor"
                                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 11a4 4 0 1 1 0-8a4 4 0 0 1 0 8"
                                  />
                                </svg>
                              </div>
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1">
                                <span className="w-8 h-8 rounded-md bg-white text-gray-700 text-xs font-semibold grid place-items-center border">
                                  {(p.ordem ?? i + 1)
                                    .toString()
                                    .padStart(2, "0")}
                                </span>
                                <span className="text-sm text-gray-700 truncate">
                                  {p.nome}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        className="mt-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                        onClick={() => { setRotaSelecionada(rota); setOpenModalColabs(true); }}
                      >
                        Exibir Colaboradores
                      </button>
                    </div>

                    {/* ===== DIREITA: mini-mapa ===== */}
                    <div className="w-64 shrink-0 relative">
                      {trajetosByRota[rota.idRota] && Array.isArray(trajetosByRota[rota.idRota]) ? (
                        <GoogleMapaRota
                          pontos={trajetosByRota[rota.idRota]}
                          height={250}
                          followRoads={true}
                        />
                      ) : (
                        <div className="h-[250px] w-full bg-gray-100 text-gray-500 grid place-items-center rounded">
                          Sem trajeto
                        </div>
                      )}

                      {loadingTrajeto[rota.idRota] && (
                        <div className="absolute inset-0 bg-white/60 grid place-items-center text-xs text-gray-600">
                          carregando trajeto...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>{/* acaba aqui */}
        {openModalColabs && rotaSelecionada && (
          <ModalColaboradores
            open={openModalColabs}
            onClose={() => setOpenModalColabs(false)}
            rota={rotaSelecionada}
          />
        )}
      </div>

    </div>
  );
}
