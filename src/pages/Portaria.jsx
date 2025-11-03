// src/pages/Portaria.jsx
import React, { useState, useEffect, useMemo } from "react";
import { getColaboradores } from "../api/colaboradorService";
import { getVisitantes } from "../api/visitanteService";
import {
  getAcessosHistorico,
  registrarEntrada,
  registrarSaida,
} from "../api/acessoService";
import { formatDateTime } from "../utils/formatters";
import Loading from "../components/Loading";

// Lista fixa de portarias
const portariasDisponiveis = [
  { id: 1, nome: "Portaria Principal" },
  { id: 2, nome: "Portaria Carga/Descarga" },
];

const Portaria = () => {
  const [colaboradores, setColaboradores] = useState([]);
  const [visitantes, setVisitantes] = useState([]);
  const [historicoBase, setHistoricoBase] = useState([]);
  const [tipoPessoa, setTipoPessoa] = useState("COLABORADOR");
  const [selectedPessoaId, setSelectedPessoaId] = useState("");
  const [selectedPortariaId, setSelectedPortariaId] = useState(
    portariasDisponiveis[0]?.id || ""
  );
  const [currentOcupanteSelection, setCurrentOcupanteSelection] = useState("");
  const [selectedOcupantes, setSelectedOcupantes] = useState([]);

  const today = new Date().toISOString().slice(0, 10);
  const [filtroDataDe, setFiltroDataDe] = useState(today);
  const [filtroDataAte, setFiltroDataAte] = useState(today);
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroPortaria, setFiltroPortaria] = useState("");

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fetchError, setFetchError] = useState("");

  // Carregar colaboradores + visitantes
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      setFetchError("");
      try {
        const [colabData, visitData] = await Promise.all([
          getColaboradores(),
          getVisitantes(),
        ]);
        setColaboradores(colabData);
        setVisitantes(visitData);
      } catch (error) {
        console.error(error);
        setFetchError(
          error.response?.status === 403
            ? "Acesso não autorizado (403). Verifique suas permissões ou token."
            : "Falha ao carregar dados iniciais. Verifique a conexão com a API."
        );
        setColaboradores([]);
        setVisitantes([]);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  // Carregar histórico
  useEffect(() => {
    const fetchHistorico = async () => {
      setLoadingHistorico(true);
      try {
        const data = await getAcessosHistorico(filtroDataDe, filtroDataAte);
        setHistoricoBase(data);
      } catch (error) {
        console.error(error);
        setHistoricoBase([]);
      } finally {
        setLoadingHistorico(false);
      }
    };

    if (filtroDataDe && filtroDataAte && new Date(filtroDataDe) <= new Date(filtroDataAte)) {
      fetchHistorico();
    } else {
      setHistoricoBase([]);
    }
  }, [filtroDataDe, filtroDataAte]);

  // Disponíveis para ocupantes
  const ocupantesDisponiveis = useMemo(() => {
    return (colaboradores || [])
      .map((c) => ({ id: c.idColaborador, nome: c.nome, identificador: c.matricula }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [colaboradores]);

  // Histórico filtrado
  const historicoFiltrado = useMemo(() => {
    return historicoBase.filter((acesso) => {
      if (!acesso) return false;
      const matchTipo = filtroTipo === "TODOS" || acesso.tipoPessoa === filtroTipo;
      const matchPortaria = !filtroPortaria || String(acesso.codPortaria) === filtroPortaria;
      return matchTipo && matchPortaria;
    });
  }, [historicoBase, filtroTipo, filtroPortaria]);

  // Handlers
  const handleAddOcupante = () => {
    if (!currentOcupanteSelection) return;
    if (selectedOcupantes.length >= 10) return alert("Limite de 10 ocupantes atingido.");
    if (selectedOcupantes.some((o) => o.id === currentOcupanteSelection))
      return alert("Este ocupante já foi adicionado.");
    if (tipoPessoa === "COLABORADOR" && currentOcupanteSelection === selectedPessoaId)
      return alert("A pessoa principal não pode ser adicionada como ocupante.");

    const ocupanteToAdd = ocupantesDisponiveis.find((p) => p.id === currentOcupanteSelection);
    if (ocupanteToAdd) {
      setSelectedOcupantes((prev) => [...prev, ocupanteToAdd]);
      setCurrentOcupanteSelection("");
    }
  };

  const handleRemoveOcupante = (idToRemove) => {
    setSelectedOcupantes((prev) => prev.filter((o) => o.id !== idToRemove));
  };

  const handleRegisterEntry = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (!selectedPessoaId || !selectedPortariaId) {
      setFormError("Selecione a pessoa principal e a portaria.");
      setIsSubmitting(false);
      return;
    }

    let identificadorPrincipal;
    let tipoPrincipal = tipoPessoa;

    try {
      if (tipoPrincipal === "COLABORADOR") {
        identificadorPrincipal = colaboradores.find((c) => c.idColaborador === selectedPessoaId)?.matricula;
      } else {
        identificadorPrincipal = visitantes.find((v) => v.id === selectedPessoaId)?.numeroDocumento;
      }
    } catch (error) {
      setFormError("Erro ao processar seleção principal.");
      setIsSubmitting(false);
      return;
    }

    if (!identificadorPrincipal) {
      setFormError("Identificador principal não encontrado.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      tipoPessoa: tipoPrincipal,
      matriculaOuDocumento: identificadorPrincipal,
      codPortaria: parseInt(selectedPortariaId),
      ocupanteMatriculas: selectedOcupantes.map((o) => o.identificador) || [],
    };

    try {
      await registrarEntrada(payload);
      alert("Entrada(s) registrada(s) com sucesso!");
      setSelectedPessoaId("");
      setSelectedOcupantes([]);
      setCurrentOcupanteSelection("");
      // recarrega histórico
      const histRes = await getAcessosHistorico(filtroDataDe, filtroDataAte);
      setHistoricoBase(histRes);
    } catch (error) {
      console.error(error);
      setFormError(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Falha ao registrar entrada(s)."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterExit = async (idAcesso) => {
    if (!idAcesso) return;
    try {
      await registrarSaida(idAcesso);
      alert("Saída registrada com sucesso!");
      const histRes = await getAcessosHistorico(filtroDataDe, filtroDataAte);
      setHistoricoBase(histRes);
    } catch (error) {
      console.error(error);
      alert("Falha ao registrar saída.");
    }
  };

  return (
    <main className="flex-1 p-4 sm:p-6 md:p-10 space-y-8 ml-0 md:ml-24">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#3B7258]">
          Controle de Portaria
        </h1>
      </header>

      {fetchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span>{fetchError}</span>
        </div>
      )}

      {/* CARD: Registrar entrada */}
      <section className="bg-white p-6 rounded-xl shadow-lg relative px-4 md:px-12">
        {loadingInitial && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
            <Loading size={140} message="Carregando opções..." />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Registrar Entrada</h2>

        {!loadingInitial && (
          <form onSubmit={handleRegisterEntry} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo (Principal)</label>
                <select
                  value={tipoPessoa}
                  onChange={(e) => {
                    setTipoPessoa(e.target.value);
                    setSelectedPessoaId("");
                    setSelectedOcupantes([]);
                    setCurrentOcupanteSelection("");
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
                >
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="VISITANTE">Visitante</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Pessoa Principal</label>
                <select
                  value={selectedPessoaId}
                  onChange={(e) => setSelectedPessoaId(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
                  required
                  disabled={tipoPessoa === "COLABORADOR" ? colaboradores.length === 0 : visitantes.length === 0}
                >
                  <option value="">
                    {tipoPessoa === "COLABORADOR" && colaboradores.length === 0 && "Nenhum colaborador"}
                    {tipoPessoa === "VISITANTE" && visitantes.length === 0 && "Nenhum visitante"}
                    {(tipoPessoa === "COLABORADOR" && colaboradores.length > 0) ||
                    (tipoPessoa === "VISITANTE" && visitantes.length > 0)
                      ? "Selecione..."
                      : ""}
                  </option>
                  {tipoPessoa === "COLABORADOR"
                    ? colaboradores.map((c) => (
                        <option key={c.idColaborador} value={c.idColaborador}>
                          {c.nome} ({c.matricula})
                        </option>
                      ))
                    : visitantes.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nomeCompleto} ({v.numeroDocumento})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Portaria</label>
                <select
                  value={selectedPortariaId}
                  onChange={(e) => setSelectedPortariaId(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
                  required
                >
                  {portariasDisponiveis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linha Ocupantes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Adicionar Ocupante (máx 10)</label>
                <select
                  value={currentOcupanteSelection}
                  onChange={(e) => setCurrentOcupanteSelection(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
                  disabled={selectedOcupantes.length >= 10 || !selectedPessoaId || colaboradores.length === 0}
                >
                  <option value="">
                    {colaboradores.length === 0 ? "Nenhum colaborador carregado" : "Selecione um colaborador..."}
                  </option>
                  {ocupantesDisponiveis
                    .filter((p) => p.id !== selectedPessoaId && !selectedOcupantes.some((o) => o.id === p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.identificador})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddOcupante}
                  disabled={!currentOcupanteSelection || selectedOcupantes.length >= 10}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Ocupantes adicionados */}
            {selectedOcupantes.length > 0 && (
              <div className="border rounded-md p-4 bg-gray-50 max-h-40 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Ocupantes Adicionados ({selectedOcupantes.length}):
                </h3>
                <ul className="space-y-2">
                  {selectedOcupantes.map((o) => (
                    <li key={o.id} className="flex justify-between items-center text-sm bg-white p-2 rounded shadow-sm">
                      <span>
                        {o.nome} ({o.identificador})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOcupante(o.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {formError && <p className="text-red-600 text-sm">{formError}</p>}

            <div className="text-right">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#038C4C] text-white py-2 px-6 rounded-md font-semibold hover:bg-[#036f4c] disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loading size={30} message="" />}
                {isSubmitting ? "Registrando..." : "Registrar Entrada(s)"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* CARD: Histórico */}
      <section className="bg-white p-6 rounded-xl shadow-lg relative px-4 md:px-12">
        {loadingHistorico && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10">
            <Loading size={130} message="Carregando histórico..." />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Histórico de Acessos</h2>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">De:</label>
            <input
              type="date"
              value={filtroDataDe}
              onChange={(e) => setFiltroDataDe(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Até:</label>
            <input
              type="date"
              value={filtroDataAte}
              onChange={(e) => setFiltroDataAte(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo Pessoa</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
            >
              <option value="TODOS">Todos</option>
              <option value="COLABORADOR">Colaborador</option>
              <option value="VISITANTE">Visitante</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Portaria</label>
            <select
              value={filtroPortaria}
              onChange={(e) => setFiltroPortaria(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#36A293] focus:border-[#36A293]"
            >
              <option value="">Todas</option>
              {portariasDisponiveis.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela */}
        {!loadingHistorico && historicoFiltrado.length > 0 ? (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Nome (Condutor)</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Portaria</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Saída</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ocupantes</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historicoFiltrado.map((acesso) => (
                  <tr key={acesso.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{acesso.condutor?.nome || "N/A"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{acesso.tipoPessoa || "N/A"}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {portariasDisponiveis.find((p) => p.id === acesso.codPortaria)?.nome || "N/A"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(acesso.entrada)}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-medium">
                      {acesso.saida ? formatDateTime(acesso.saida) : <span className="text-orange-600">Pendente</span>}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate" title={acesso.ocupantes?.map((o) => o.nome).join(", ")}>
                      {acesso.ocupantes?.length > 0 ? acesso.ocupantes.map((o) => o.nome).join(", ") : "-"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {!acesso.saida && (
                        <button
                          onClick={() => handleRegisterExit(acesso.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                        >
                          Registrar Saída
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loadingHistorico && <p className="text-center text-gray-500 py-4">Nenhum registro encontrado.</p>
        )}
      </section>
    </main>
  );
};

export default Portaria;
