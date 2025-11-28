// src/pages/Visitantes.jsx
import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { getColaboradores } from "../api/colaboradorService";
import { getVisitantes, createVisitante } from "../api/visitanteService";
import { maskCPF, maskRG, maskPhone } from "../utils/masks";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-slate-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const Visitantes = () => {
  const [visitors, setVisitors] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [newVisitor, setNewVisitor] = useState({
    nomeCompleto: "",
    tipoDocumento: "CPF",
    numeroDocumento: "",
    dataNascimento: "",
    telefone: "",
    empresaVisitante: "",
    pessoaAnfitria: "",
    motivoVisita: "",
    ativo: true,
  });

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [visitorsData, collaboratorsData] = await Promise.all([
        getVisitantes(),
        getColaboradores(),
      ]);

      const enrichedVisitors = (visitorsData || []).map((visitor) => {
        const anfitriao = (collaboratorsData || []).find(
          (c) => c.idColaborador === visitor.pessoaAnfitria
        );
        return {
          ...visitor,
          nomeAnfitriao: anfitriao ? anfitriao.nome : "Não encontrado",
        };
      });

      setVisitors(enrichedVisitors);
      setCollaborators(collaboratorsData || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      const errorMsg = "Falha ao carregar dados. Tente recarregar a página.";
      setFetchError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "tipoDocumento") {
      setNewVisitor((prev) => ({
        ...prev,
        tipoDocumento: value,
        numeroDocumento: "",
      }));
      return;
    }

    if (name === "numeroDocumento") {
      let maskedValue = value;
      switch (newVisitor.tipoDocumento) {
        case "CPF":
          maskedValue = maskCPF(value);
          break;
        case "RG":
          maskedValue = maskRG(value);
          break;
        default:
          maskedValue = value;
      }
      setNewVisitor((prev) => ({ ...prev, numeroDocumento: maskedValue }));
      return;
    }

    if (name === "telefone") {
      setNewVisitor((prev) => ({ ...prev, telefone: maskPhone(value) }));
      return;
    }

    setNewVisitor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createVisitante(newVisitor);
      await fetchData();
      toast.success("Visitante cadastrado com sucesso!");

      setNewVisitor({
        nomeCompleto: "",
        tipoDocumento: "CPF",
        numeroDocumento: "",
        dataNascimento: "",
        telefone: "",
        empresaVisitante: "",
        pessoaAnfitria: "",
        motivoVisita: "",
        ativo: true,
      });
    } catch (error) {
      console.error("Erro ao cadastrar visitante:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Falha ao cadastrar. Verifique os dados e tente novamente.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVisitors = useMemo(() => {
    const search = (searchTerm || "").toLowerCase();
    return (visitors || []).filter((v) => {
      const nome = v.nomeCompleto?.toLowerCase() || "";
      const doc = v.numeroDocumento?.toLowerCase() || "";
      return nome.includes(search) || doc.includes(search);
    });
  }, [visitors, searchTerm]);

  const totalVisitantes = useMemo(() => (visitors || []).length, [visitors]);

  const totalAtivos = useMemo(
    () => (visitors || []).filter((v) => v.ativo).length,
    [visitors]
  );

  const getDocInputProps = () => {
    switch (newVisitor.tipoDocumento) {
      case "CPF":
        return { placeholder: "000.000.000-00", maxLength: 14 };
      case "RG":
        return { placeholder: "00.000.000-0", maxLength: 12 };
      case "Passaporte":
        return { placeholder: "Ex: BR123456", maxLength: 20 };
      default:
        return { placeholder: "Selecione um tipo", maxLength: 50 };
    }
  };

  const docInputProps = getDocInputProps();

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
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-emerald-600">
            Gestão de visitantes
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Cadastre visitantes, associe um responsável interno e acompanhe de
            forma organizada quem está autorizado a acessar a unidade.
          </p>
        </header>

        {fetchError && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
            role="alert"
          >
            <strong className="font-semibold">Erro: </strong>
            <span>{fetchError}</span>
          </div>
        )}

        {/* Cards resumo */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Card 1 - Visitantes cadastrados */}
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
                    d="M9 3a4 4 0 1 1-2.829 6.829A4 4 0 0 1 9 3Zm6.5 1a3.5 3.5 0 1 1-2.475 5.975A5.98 5.98 0 0 0 15 8a5.97 5.97 0 0 0-.44-2.25A3.48 3.48 0 0 1 15.5 4ZM9 13c3.314 0 6 2.239 6 5v.25C15 19.216 14.216 20 13.25 20H4.75C3.784 20 3 19.216 3 18.25V18c0-2.761 2.686-5 6-5Zm6.5 3c1.657 0 3 1.343 3 3v.25c0 .414-.336.75-.75.75h-3.972c.144-.382.222-.797.222-1.25v-.25a6.49 6.49 0 0 0-.777-3.09A2.98 2.98 0 0 1 15.5 16Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  Visitantes cadastrados
                </span>
                <span className="text-[11px] text-slate-500">
                  Base total disponível para controle de acesso.
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-semibold text-emerald-600 leading-none">
                {totalVisitantes}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                registros ativos e inativos
              </span>
            </div>
          </div>

          {/* Card 2 - Visitantes ativos */}
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
                    d="M12 2a5 5 0 0 1 4.9 6.138A6.002 6.002 0 0 1 18 14v1.25A2.75 2.75 0 0 1 15.25 18h-6.5A2.75 2.75 0 0 1 6 15.25V14a6.002 6.002 0 0 1 1.1-3.462A5 5 0 0 1 12 2Zm3.78 10.47a.75.75 0 0 0-1.06-1.06L11 15.13l-1.72-1.72a.75.75 0 1 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                  Visitantes ativos
                </span>
                <span className="text-[11px] text-slate-500">
                  Autorizados para uso nos fluxos de portaria.
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-semibold text-emerald-600 leading-none">
                {totalAtivos}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                registros disponíveis
              </span>
            </div>
          </div>

          {/* Card 3 - Colaboradores anfitriões */}
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
                    d="M7 4a3 3 0 1 1-2.121 5.121A3 3 0 0 1 7 4Zm10 0a3 3 0 1 1-2.121 5.121A3 3 0 0 1 17 4ZM7 12c2.761 0 5 2.239 5 5v.75A1.25 1.25 0 0 1 10.75 19h-7.5A1.25 1.25 0 0 1 2 17.75V17c0-2.761 2.239-5 5-5Zm10 0c2.761 0 5 2.239 5 5v.75A1.25 1.25 0 0 1 20.75 19h-4.086c.11-.344.17-.71.17-1.09V17c0-1.808-.682-3.454-1.8-4.71A4.97 4.97 0 0 1 17 12Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
                  Colaboradores anfitriões
                </span>
                <span className="text-[11px] text-slate-500">
                  Colaboradores disponíveis para receber visitantes.
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl sm:text-3xl font-semibold text-sky-600 leading-none">
                {collaborators.length}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                usuários internos vinculáveis
              </span>
            </div>
          </div>
        </section>

        {/* Cadastro + Lista lado a lado */}
        {/* ALTURA FIXA APLICADA AQUI: h-[calc(100vh-330px)] */}
        <section className="flex flex-col xl:flex-row gap-6 items-stretch h-[calc(100vh-310px)] min-h-[600px]">
          {/* Card de cadastro */}
          <div className="w-full xl:w-[38%] flex flex-col">
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm px-4 sm:px-6 md:px-7 py-5 h-full flex flex-col">
              {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-20">
                  <Loading size={90} message="" />
                </div>
              )}

              <div className="flex flex-col gap-1 mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Cadastrar visitante
                </h2>
                <p className="text-xs text-slate-500 max-w-md">
                  Registre os dados básicos do visitante e associe a um
                  responsável interno.
                </p>
              </div>

              {/* Scroll container para o formulário */}
              <div className="flex-1 overflow-y-auto pr-1">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      name="nomeCompleto"
                      value={newVisitor.nomeCompleto}
                      onChange={handleChange}
                      placeholder="Digite o nome"
                      required
                      className="
                        border border-slate-300 bg-slate-50
                        rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                        focus:bg-white focus:outline-none
                        focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                      "
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Tipo de documento
                      </label>
                      <select
                        name="tipoDocumento"
                        value={newVisitor.tipoDocumento}
                        onChange={handleChange}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      >
                        <option value="CPF">CPF</option>
                        <option value="RG">RG</option>
                        <option value="Passaporte">Passaporte</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Número do documento
                      </label>
                      <input
                        type="text"
                        name="numeroDocumento"
                        value={newVisitor.numeroDocumento}
                        onChange={handleChange}
                        placeholder={docInputProps.placeholder}
                        maxLength={docInputProps.maxLength}
                        required
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Data de nascimento
                      </label>
                      <input
                        type="date"
                        name="dataNascimento"
                        value={newVisitor.dataNascimento}
                        onChange={handleChange}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-slate-700">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        name="telefone"
                        value={newVisitor.telefone}
                        onChange={handleChange}
                        placeholder="(XX) XXXXX-XXXX"
                        maxLength={15}
                        className="
                          border border-slate-300 bg-slate-50
                          rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                          focus:bg-white focus:outline-none
                          focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                        "
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      name="empresaVisitante"
                      value={newVisitor.empresaVisitante}
                      onChange={handleChange}
                      placeholder="Ex: Empresa Exemplo"
                      className="
                        border border-slate-300 bg-slate-50
                        rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                        focus:bg-white focus:outline-none
                        focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                      "
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Responsável (anfitrião)
                    </label>
                    <select
                      name="pessoaAnfitria"
                      value={newVisitor.pessoaAnfitria}
                      onChange={handleChange}
                      required
                      className="
                        border border-slate-300 bg-slate-50
                        rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                        focus:bg-white focus:outline-none
                        focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                      "
                    >
                      <option value="">Selecione um anfitrião</option>
                      {collaborators.map((col) => (
                        <option
                          key={col.idColaborador}
                          value={col.idColaborador}
                        >
                          {col.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-slate-700">
                      Motivo da visita
                    </label>
                    <input
                      type="text"
                      name="motivoVisita"
                      value={newVisitor.motivoVisita}
                      onChange={handleChange}
                      placeholder="Ex: Reunião, entrevista, auditoria..."
                      className="
                        border border-slate-300 bg-slate-50
                        rounded-xl px-3.5 py-2.5 text-sm text-slate-800
                        focus:bg-white focus:outline-none
                        focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                      "
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="
                      mt-2
                      w-full
                      bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400
                      text-white
                      py-2.5 px-4
                      rounded-xl
                      text-sm sm:text-base font-semibold
                      transition-colors
                    "
                  >
                    {isSubmitting ? "Cadastrando..." : "Cadastrar visitante"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Card de listagem */}
          <div className="w-full xl:flex-1 flex flex-col">
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm px-4 sm:px-6 md:px-7 py-5 h-full flex flex-col">
              {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl z-20">
                  <Loading size={90} message="" />
                </div>
              )}

              <div className="flex flex-col gap-1 mb-4 border-b border-slate-100 pb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                  Lista de visitantes
                </h2>
                <p className="text-xs text-slate-500 max-w-xl">
                  Consulte os visitantes cadastrados, filtre por nome ou
                  documento e visualize o responsável interno associado.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nome ou documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="
                      pl-9 pr-3
                      w-full
                      rounded-xl
                      border border-slate-300
                      bg-slate-50
                      h-9
                      text-sm
                      focus:bg-white focus:outline-none
                      focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-500
                    "
                  />
                </div>

                <p className="text-[11px] text-slate-400">
                  {filteredVisitors.length} resultado
                  {filteredVisitors.length === 1 ? "" : "s"} exibido
                  {filteredVisitors.length === 1 ? "" : "s"}.
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        Visitante
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                        Motivo
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        Empresa
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        Responsável
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-slate-100">
                    {!loading && filteredVisitors.length > 0
                      ? filteredVisitors.map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 text-slate-900 font-medium whitespace-nowrap">
                              {v.nomeCompleto}
                            </td>
                            <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                              {v.tipoDocumento && v.numeroDocumento
                                ? `${v.tipoDocumento}: ${v.numeroDocumento}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                              {v.motivoVisita || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                              {v.empresaVisitante || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                              {v.nomeAnfitriao || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-3 py-1 text-[11px] font-semibold rounded-full border ${
                                  v.ativo
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                    v.ativo ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                                />
                                {v.ativo ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                          </tr>
                        ))
                      : !loading && (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-6 text-slate-500 text-sm"
                            >
                              {searchTerm
                                ? "Nenhum visitante encontrado para a busca."
                                : "Nenhum visitante cadastrado até o momento."}
                            </td>
                          </tr>
                        )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Visitantes;
