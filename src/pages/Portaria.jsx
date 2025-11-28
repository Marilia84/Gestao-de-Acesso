// src/pages/Portaria.jsx
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { getColaboradores } from "../api/colaboradorService";
import { getVisitantes } from "../api/visitanteService";
import {
  getAcessosHistorico,
  registrarEntrada,
  registrarSaida,
} from "../api/acessoService";
import { formatDateTime } from "../utils/formatters";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";

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
  const [observacao, setObservacao] = useState("");

  const [ocupanteSearch, setOcupanteSearch] = useState("");
  const [ocupanteFocused, setOcupanteFocused] = useState(false);
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

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      setFetchError("");
      try {
        const [colabData, visitData] = await Promise.all([
          getColaboradores(),
          getVisitantes(),
        ]);
        setColaboradores(colabData || []);
        setVisitantes(visitData || []);
      } catch (error) {
        console.error(error);
        const errorMsg =
          error.response?.status === 403
            ? "Acesso não autorizado (403). Verifique suas permissões ou token."
            : "Falha ao carregar dados iniciais. Verifique a conexão com a API.";
        setFetchError(errorMsg);
        toast.error(errorMsg);
        setColaboradores([]);
        setVisitantes([]);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchHistorico = async () => {
      setLoadingHistorico(true);
      try {
        const data = await getAcessosHistorico(filtroDataDe, filtroDataAte);
        setHistoricoBase(data || []);
      } catch (error) {
        console.error(error);
        toast.error("Falha ao carregar histórico de acessos.");
        setHistoricoBase([]);
      } finally {
        setLoadingHistorico(false);
      }
    };

    if (
      filtroDataDe &&
      filtroDataAte &&
      new Date(filtroDataDe) <= new Date(filtroDataAte)
    ) {
      fetchHistorico();
    } else {
      setHistoricoBase([]);
    }
  }, [filtroDataDe, filtroDataAte]);

  const ocupantesDisponiveis = useMemo(() => {
    const colabs = (colaboradores || []).map((c) => ({
      id: c.idColaborador,
      nome: c.nome,
      identificador: c.matricula,
      tipo: "COLABORADOR",
      label: `${c.nome} (${c.matricula})`,
    }));

    const visits = (visitantes || []).map((v) => ({
      id: v.id,
      nome: v.nomeCompleto,
      identificador: v.numeroDocumento,
      tipo: "VISITANTE",
      label: `${v.nomeCompleto} (${v.numeroDocumento})`,
    }));

    return [...colabs, ...visits].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [colaboradores, visitantes]);

  const sugestoesOcupantes = useMemo(() => {
    if (!ocupanteFocused || !selectedPessoaId) return [];

    const base = ocupantesDisponiveis.filter((p) => {
      if (String(p.id) === String(selectedPessoaId)) return false;
      if (selectedOcupantes.some((o) => String(o.id) === String(p.id))) {
        return false;
      }
      return true;
    });

    const search = (ocupanteSearch || "").trim().toLowerCase();
    if (!search) {
      return base.slice(0, 8);
    }

    return base
      .filter((p) => {
        const nome = p.nome?.toLowerCase() || "";
        const ident = p.identificador?.toLowerCase() || "";
        return nome.includes(search) || ident.includes(search);
      })
      .slice(0, 8);
  }, [
    ocupanteFocused,
    ocupanteSearch,
    ocupantesDisponiveis,
    selectedPessoaId,
    selectedOcupantes,
  ]);

  const historicoFiltrado = useMemo(() => {
    return (historicoBase || []).filter((acesso) => {
      if (!acesso) return false;
      const matchTipo =
        filtroTipo === "TODOS" || acesso.tipoPessoa === filtroTipo;
      const matchPortaria =
        !filtroPortaria || String(acesso.codPortaria) === filtroPortaria;
      return matchTipo && matchPortaria;
    });
  }, [historicoBase, filtroTipo, filtroPortaria]);

  const activeEntradasHoje = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    return (historicoBase || []).filter((acesso) => {
      if (!acesso) return false;
      if (acesso.saida) return false;
      if (!acesso.entrada) return false;
      const entradaData = String(acesso.entrada).slice(0, 10);
      return entradaData === hoje;
    }).length;
  }, [historicoBase]);

  const totalEntradasHoje = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    return (historicoBase || []).filter((acesso) => {
      if (!acesso || !acesso.entrada) return false;
      const entradaData = String(acesso.entrada).slice(0, 10);
      return entradaData === hoje;
    }).length;
  }, [historicoBase]);

  const totalSaidasHoje = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    return (historicoBase || []).filter((acesso) => {
      if (!acesso || !acesso.saida) return false;
      const saidaData = String(acesso.saida).slice(0, 10);
      return saidaData === hoje;
    }).length;
  }, [historicoBase]);

  const handleAddOcupanteFromSuggestion = (pessoa) => {
    if (!pessoa) return;

    if (selectedOcupantes.length >= 10) {
      toast.warn("Limite de 10 ocupantes atingido.");
      return;
    }

    if (String(pessoa.id) === String(selectedPessoaId)) {
      toast.warn("A pessoa principal não pode ser adicionada como ocupante.");
      return;
    }

    if (selectedOcupantes.some((o) => String(o.id) === String(pessoa.id))) {
      toast.warn("Este ocupante já foi adicionado.");
      return;
    }

    setSelectedOcupantes((prev) => [...prev, pessoa]);
    setOcupanteSearch("");
  };

  const handleAddOcupante = () => {
    const candidatos = sugestoesOcupantes;
    if (!candidatos || candidatos.length === 0) {
      toast.warn("Nenhuma pessoa encontrada para adicionar.");
      return;
    }
    handleAddOcupanteFromSuggestion(candidatos[0]);
  };

  const handleRemoveOcupante = (idToRemove) => {
    setSelectedOcupantes((prev) =>
      prev.filter((o) => String(o.id) !== String(idToRemove))
    );
  };

  const handleRegisterEntry = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    if (!selectedPessoaId || !selectedPortariaId) {
      const errorMsg = "Selecione a pessoa principal e a portaria.";
      setFormError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
      return;
    }

    let identificadorPrincipal = "";
    const tipoPrincipal = tipoPessoa;

    try {
      if (tipoPrincipal === "COLABORADOR") {
        const col = (colaboradores || []).find(
          (c) => String(c.idColaborador) === String(selectedPessoaId)
        );
        identificadorPrincipal = col?.matricula || "";
      } else {
        const visitanteSelecionado = (visitantes || []).find(
          (v) => String(v.id) === String(selectedPessoaId)
        );
        identificadorPrincipal = visitanteSelecionado?.numeroDocumento || "";
      }
    } catch (error) {
      const errorMsg = "Erro ao processar seleção principal.";
      setFormError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
      return;
    }

    if (!identificadorPrincipal) {
      const errorMsg =
        "Identificador principal (Matrícula ou Documento) não encontrado para a pessoa selecionada.";
      setFormError(errorMsg);
      toast.error(errorMsg);
      setIsSubmitting(false);
      return;
    }

    const ocupanteMatriculas =
      selectedOcupantes
        .filter((o) => o.tipo === "COLABORADOR")
        .map((o) => o.identificador) || [];

    const ocupanteDocumentos =
      selectedOcupantes
        .filter((o) => o.tipo === "VISITANTE")
        .map((o) => o.identificador) || [];

    const payload = {
      tipoPessoa: tipoPrincipal,
      matriculaOuDocumento: identificadorPrincipal,
      codPortaria: Number(selectedPortariaId),
      observacao: observacao || "",
      ocupanteMatriculas,
      ocupanteDocumentos,
    };

    try {
      await registrarEntrada(payload);
      toast.success("Entrada registrada com sucesso!");

      setSelectedPessoaId("");
      setSelectedOcupantes([]);
      setOcupanteSearch("");
      setObservacao("");

      const histRes = await getAcessosHistorico(filtroDataDe, filtroDataAte);
      setHistoricoBase(histRes || []);
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Falha ao registrar entrada(s). Verifique os dados.";
      setFormError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterExit = async (idAcesso) => {
    if (!idAcesso) return;
    try {
      await registrarSaida(idAcesso);
      toast.success("Saída registrada com sucesso!");
      const histRes = await getAcessosHistorico(filtroDataDe, filtroDataAte);
      setHistoricoBase(histRes || []);
    } catch (error) {
      console.error(error);
      toast.error("Falha ao registrar saída.");
    }
  };

  return (
    <main
      className="
        flex-1 min-h-screen bg-slate-50
        px-3 sm:px-4 lg:px-28
        py-4
        ml-16
      "
    >
      <div className="w-full space-y-6">
        {/* HEADER */}
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-600">
            Controle de portaria
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Registre entradas e saídas de colaboradores e visitantes, controle
            ocupantes e acompanhe o histórico em tempo real.
          </p>
        </header>

        {/* CARDS RESUMO */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-emerald-600"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 2a3 3 0 0 1 3 3v1h2.5A2.5 2.5 0 0 1 20 8.5V19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8.5A2.5 2.5 0 0 1 6.5 6H9V5a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v1h2V5a1 1 0 0 0-1-1Zm-2 7a1 1 0 0 0-1 1v5h2v-2h2v2h2v-5a1 1 0 0 0-1-1H10Z"
                  />
                </svg>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">
                  Entradas em andamento hoje
                </span>
                <span className="text-[11px] text-slate-500">
                  {activeEntradasHoje > 0
                    ? "Veículos ainda dentro da unidade."
                    : "Nenhuma permanência registrada no dia."}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-semibold text-emerald-600 leading-none">
                {activeEntradasHoje}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                sem saída registrada
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-emerald-600"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M11 3a1 1 0 0 1 1 1v9.586l3.293-3.293a1 1 0 0 1 1.414 1.414l-4.999 5a1 1 0 0 1-1.416 0l-5-5A1 1 0 0 1 6.707 10.3L10 13.586V4a1 1 0 0 1 1-1Zm-6 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1a1 1 0 0 1 1-1Z"
                  />
                </svg>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">
                  Total de entradas hoje
                </span>
                <span className="text-[11px] text-slate-500">
                  Soma de todas as entradas registradas na data atual.
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-semibold text-emerald-600 leading-none">
                {totalEntradasHoje}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                condutores registrados
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-sky-600"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M17 2a3 3 0 0 1 3 3v10.5a.5.5 0 0 1-1 0V5a2 2 0 0 0-2-2H8A2 2 0 0 0 6 5v14a2 2 0 0 0 2 2h6.5a.5.5 0 0 1 0 1H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3h9Zm1.707 12.293a1 1 0 0 1 0 1.414l-4.25 4.25a1 1 0 0 1-1.414 0l-2.25-2.25a1 1 0 0 1 1.414-1.414L13 17.836l3.543-3.543a1 1 0 0 1 1.414 0Z"
                  />
                </svg>
              </div>

              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
                  Saídas registradas hoje
                </span>
                <span className="text-[11px] text-slate-500">
                  Entradas que já tiveram saída confirmada na data atual.
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-semibold text-sky-600 leading-none">
                {totalSaidasHoje}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                movimentações concluídas
              </span>
            </div>
          </div>
        </section>

        {fetchError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
            role="alert"
          >
            <strong className="font-semibold">Erro: </strong>
            <span>{fetchError}</span>
          </div>
        )}

        {/* CADASTRO + HISTÓRICO LADO A LADO */}
        {/* Alteração Principal: h-[calc(100vh-330px)] força altura fixa desde o início */}
        <section className="flex flex-col xl:flex-row gap-6 items-stretch h-[calc(100vh-330px)] min-h-[600px]">
          {/* LADO ESQUERDO – CADASTRO */}
          <div className="w-full xl:w-[36%] flex flex-col">
            {/* Adicionado h-full e flex-col para garantir preenchimento */}
            <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 md:p-7 h-full flex flex-col">
              {loadingInitial && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-20">
                  <Loading size={120} message="" />
                </div>
              )}

              <div className="flex flex-col gap-1 mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Registrar entrada
                </h2>
                <p className="text-xs text-slate-500 max-w-md">
                  Selecione a pessoa principal, defina portaria e ocupantes e
                  registre a entrada no sistema.
                </p>
              </div>

              {/* REMOVIDO o conditional check (!loadingInitial). O formulário renderiza sempre. */}
              {/* Adicionado um div wrapper com flex-1 para ocupar espaço */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleRegisterEntry} className="space-y-5">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Tipo (principal)
                      </label>
                      <select
                        value={tipoPessoa}
                        onChange={(e) => {
                          setTipoPessoa(e.target.value);
                          setSelectedPessoaId("");
                          setSelectedOcupantes([]);
                          setOcupanteSearch("");
                        }}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      >
                        <option value="COLABORADOR">Colaborador</option>
                        <option value="VISITANTE">Visitante</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Pessoa principal
                      </label>
                      <select
                        value={selectedPessoaId}
                        onChange={(e) => setSelectedPessoaId(e.target.value)}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                        required
                        disabled={
                          tipoPessoa === "COLABORADOR"
                            ? colaboradores.length === 0
                            : visitantes.length === 0
                        }
                      >
                        <option value="">
                          {tipoPessoa === "COLABORADOR" &&
                            colaboradores.length === 0 &&
                            "Nenhum colaborador"}
                          {tipoPessoa === "VISITANTE" &&
                            visitantes.length === 0 &&
                            "Nenhum visitante"}
                          {(tipoPessoa === "COLABORADOR" &&
                            colaboradores.length > 0) ||
                          (tipoPessoa === "VISITANTE" && visitors.length > 0)
                            ? "Selecione..."
                            : ""}
                        </option>
                        {tipoPessoa === "COLABORADOR"
                          ? colaboradores.map((c) => (
                              <option
                                key={c.idColaborador}
                                value={c.idColaborador}
                              >
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

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Portaria
                      </label>
                      <select
                        value={selectedPortariaId}
                        onChange={(e) => setSelectedPortariaId(e.target.value)}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
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

                  {/* Ocupantes mistos (colab + visitante) com busca por texto */}
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Adicionar ocupante (máx. 10)
                      </label>
                      <div className="flex gap-2 relative">
                        <input
                          type="text"
                          value={ocupanteSearch}
                          onChange={(e) => setOcupanteSearch(e.target.value)}
                          onFocus={() => setOcupanteFocused(true)}
                          onBlur={() =>
                            setTimeout(() => setOcupanteFocused(false), 150)
                          }
                          placeholder="Clique ou digite nome/matrícula/documento..."
                          className="
                            flex-1
                            border border-slate-300 bg-slate-50
                            rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                            focus:bg-white focus:outline-none
                            focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                          "
                          disabled={!selectedPessoaId}
                        />

                        <button
                          type="button"
                          onClick={handleAddOcupante}
                          disabled={
                            !selectedPessoaId ||
                            selectedOcupantes.length >= 10 ||
                            sugestoesOcupantes.length === 0
                          }
                          className="
                            inline-flex items-center justify-center
                            px-3.5 py-2.5
                            rounded-xl
                            bg-emerald-600 hover:bg-emerald-700
                            disabled:bg-emerald-400
                            text-white text-xs font-semibold
                            transition-colors
                            whitespace-nowrap
                          "
                        >
                          Adicionar
                        </button>
                      </div>

                      {sugestoesOcupantes.length > 0 && (
                        <div
                          className="
                            mt-1 border border-slate-200 rounded-xl bg-white shadow-sm
                            max-h-40 overflow-y-auto
                          "
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {sugestoesOcupantes.map((p) => (
                            <button
                              key={`${p.tipo}-${p.id}`}
                              type="button"
                              onClick={() => handleAddOcupanteFromSuggestion(p)}
                              className="
                                w-full text-left px-3 py-1.5 text-xs
                                hover:bg-emerald-50 flex justify-between items-center
                              "
                            >
                              <span className="text-slate-800">
                                {p.nome} ({p.identificador})
                              </span>
                              <span className="text-[10px] uppercase text-slate-400 font-semibold">
                                {p.tipo === "COLABORADOR"
                                  ? "Colab."
                                  : "Visitante"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedOcupantes.length > 0 && (
                      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-32 overflow-y-auto">
                        <h3 className="text-[11px] font-semibold text-slate-700 mb-1">
                          Ocupantes adicionados ({selectedOcupantes.length})
                        </h3>
                        <ul className="space-y-1.5">
                          {selectedOcupantes.map((o) => (
                            <li
                              key={`${o.tipo}-${o.id}`}
                              className="flex justify-between items-center text-xs bg-white px-2 py-1.5 rounded-lg border border-slate-100"
                            >
                              <span className="text-slate-800">
                                {o.nome} ({o.identificador}){" "}
                                <span className="text-[10px] text-slate-400 ml-1">
                                  {o.tipo === "COLABORADOR"
                                    ? "Colaborador"
                                    : "Visitante"}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOcupante(o.id)}
                                className="text-red-500 hover:text-red-700 text-[11px] font-semibold"
                              >
                                Remover
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Observação */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Observação (opcional)
                    </label>
                    <textarea
                      rows="2"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex: Acompanhado de estagiário, entrega de material..."
                      className="
                        border border-slate-300 bg-slate-50
                        rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                        focus:bg-white focus:outline-none
                        focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                      "
                    />
                  </div>

                  {formError && (
                    <p className="text-red-600 text-xs">{formError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      w-full
                      bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400
                      text-white
                      py-2.5
                      rounded-xl
                      text-sm sm:text-base font-semibold
                      transition-colors
                    "
                  >
                    {isSubmitting ? "Registrando..." : "Registrar entrada"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* LADO DIREITO – HISTÓRICO */}
          <div className="w-full xl:flex-1 flex flex-col">
            <div className="relative bg-white border border-slate-200 shadow-sm rounded-2xl p-5 lg:p-7 w-full h-full flex flex-col">
              {loadingHistorico && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-10">
                  <Loading size={110} message="" />
                </div>
              )}

              <div className="flex flex-col gap-1 mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                      Histórico de acessos
                    </h2>
                    <p className="text-xs text-slate-500 max-w-xl">
                      Filtre por período, tipo de pessoa e portaria para
                      acompanhar todas as movimentações.
                    </p>
                  </div>
                </div>
              </div>

              {/* FAIXA DE FILTROS */}
              <div className="mb-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-slate-700">
                        De
                      </label>
                      <input
                        type="date"
                        value={filtroDataDe}
                        onChange={(e) => setFiltroDataDe(e.target.value)}
                        className="
                          border border-slate-300 bg-white
                          rounded-xl px-3 py-2 text-xs text-slate-800
                          focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-slate-700">
                        Até
                      </label>
                      <input
                        type="date"
                        value={filtroDataAte}
                        onChange={(e) => setFiltroDataAte(e.target.value)}
                        className="
                          border border-slate-300 bg-white
                          rounded-xl px-3 py-2 text-xs text-slate-800
                          focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-slate-700">
                        Tipo pessoa
                      </label>
                      <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="
                          border border-slate-300 bg-white
                          rounded-xl px-3 py-2 text-xs text-slate-800
                          focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      >
                        <option value="TODOS">Todos</option>
                        <option value="COLABORADOR">Colaborador</option>
                        <option value="VISITANTE">Visitante</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-slate-700">
                        Portaria
                      </label>
                      <select
                        value={filtroPortaria}
                        onChange={(e) => setFiltroPortaria(e.target.value)}
                        className="
                          border border-slate-300 bg-white
                          rounded-xl px-3 py-2 text-xs text-slate-800
                          focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
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
                </div>
              </div>

              {/* TABELA */}
              {/* flex-1 min-h-0 garante que a tabela ocupe o restante da altura fixa */}
              <div className="flex-1 min-h-0">
                {!loadingHistorico && historicoFiltrado.length > 0 ? (
                  <div className="overflow-x-auto h-full rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 sticky top-0 z-20">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                            Nome (condutor)
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                            Tipo
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                            Portaria
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                            Entrada
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                            Saída
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                            Ocupantes
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-slate-500 uppercase tracking-wider text-[11px]">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {historicoFiltrado.map((acesso) => (
                          <tr
                            key={acesso.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-4 py-2 whitespace-nowrap text-slate-800">
                              {acesso.condutor?.nome || "N/A"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-slate-700">
                              {acesso.tipoPessoa || "N/A"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-slate-700">
                              {portariasDisponiveis.find(
                                (p) => p.id === acesso.codPortaria
                              )?.nome || "N/A"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-slate-700">
                              {formatDateTime(acesso.entrada)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap font-medium">
                              {acesso.saida ? (
                                <span className="text-slate-700">
                                  {formatDateTime(acesso.saida)}
                                </span>
                              ) : (
                                <span className="text-orange-600 text-[11px] rounded-full bg-orange-50 px-2 py-0.5 border border-orange-200">
                                  Pendente
                                </span>
                              )}
                            </td>
                            <td
                              className="px-4 py-2 text-xs text-slate-600 max-w-xs truncate"
                              title={acesso.ocupantes
                                ?.map((o) => o.nome)
                                .join(", ")}
                            >
                              {acesso.ocupantes?.length > 0
                                ? acesso.ocupantes.map((o) => o.nome).join(", ")
                                : "-"}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {!acesso.saida && (
                                <button
                                  onClick={() => handleRegisterExit(acesso.id)}
                                  className="
                                    inline-flex items-center
                                    text-[11px] font-semibold
                                    text-red-600 hover:text-red-700
                                    border border-red-200 hover:border-red-300
                                    rounded-full px-3 py-1
                                    bg-red-50/40 hover:bg-red-50
                                    transition-colors
                                  "
                                >
                                  Registrar saída
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  !loadingHistorico && (
                    <p className="text-center text-slate-500 py-8 text-sm">
                      Nenhum registro encontrado para o período e filtros
                      selecionados.
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Portaria;
