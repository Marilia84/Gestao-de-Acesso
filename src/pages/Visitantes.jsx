import React, { useState, useEffect } from "react";
// 1. IMPORTA OS NOVOS SERVIÇOS
import { getColaboradores } from "../api/colaboradorService";
import { getVisitantes, createVisitante } from "../api/visitanteService";
// Importa as máscaras
import { maskCPF, maskRG, maskPhone } from "../utils/masks";

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-400"
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

      const enrichedVisitors = visitorsData.map((visitor) => {
        const anfitriao = collaboratorsData.find(
          (c) => c.idColaborador === visitor.pessoaAnfitria
        );
        return {
          ...visitor,
          nomeAnfitriao: anfitriao ? anfitriao.nome : "Não encontrado",
        };
      });

      setVisitors(enrichedVisitors);
      setCollaborators(collaboratorsData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setFetchError("Falha ao carregar dados. Tente recarregar a página.");
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
      setNewVisitor((prevState) => ({
        ...prevState,
        tipoDocumento: value,
        numeroDocumento: "",
      }));
    } else if (name === "numeroDocumento") {
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
      setNewVisitor((prevState) => ({
        ...prevState,
        numeroDocumento: maskedValue,
      }));
    } else if (name === "telefone") {
      const maskedValue = maskPhone(value);
      setNewVisitor((prevState) => ({ ...prevState, telefone: maskedValue }));
    } else {
      setNewVisitor((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createVisitante(newVisitor);
      await fetchData();
      alert("Visitante cadastrado com sucesso!");
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
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const visitorName = visitor.nomeCompleto?.toLowerCase() || "";
    const visitorDocument = visitor.numeroDocumento?.toLowerCase() || "";
    const searchTermLower = searchTerm.toLowerCase();
    return (
      visitorName.includes(searchTermLower) ||
      visitorDocument.includes(searchTermLower)
    );
  });

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
<div className="relative flex-1 p-4 sm:p-6 md:p-10 space-y-8 ml-0 md:ml-12 overflow-x-hidden">      {/* fundo decorativo, menor em telas pequenas */}

      <div className="relative z-10">
        <header className="mb-6 sm:mb-9">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3B7258]">
            VISITANTES
          </h1>
        </header>

        <main className="space-y-8">
          {/* Card de Cadastro de Visitante */}
          <div className="bg-white p-4 p-4 rounded-xl shadow-lg ">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
              Cadastrar visitante
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6 ml-0 sm:ml-1">
              Preencha as informações do visitante
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <label
                    htmlFor="nomeCompleto"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Nome completo
                  </label>
                  <input
                    type="text"
                    id="nomeCompleto"
                    name="nomeCompleto"
                    value={newVisitor.nomeCompleto}
                    onChange={handleChange}
                    placeholder="Digite o Nome"
                    required
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tipoDocumento"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Tipo de documento
                  </label>
                  <select
                    id="tipoDocumento"
                    name="tipoDocumento"
                    value={newVisitor.tipoDocumento}
                    onChange={handleChange}
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  >
                    <option value="CPF">CPF</option>
                    <option value="RG">RG</option>
                    <option value="Passaporte">Passaporte</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="numeroDocumento"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Número do documento
                  </label>
                  <input
                    type="text"
                    id="numeroDocumento"
                    name="numeroDocumento"
                    value={newVisitor.numeroDocumento}
                    onChange={handleChange}
                    placeholder={docInputProps.placeholder}
                    maxLength={docInputProps.maxLength}
                    required
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dataNascimento"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={newVisitor.dataNascimento}
                    onChange={handleChange}
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Telefone
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={newVisitor.telefone}
                    onChange={handleChange}
                    placeholder="(XX) XXXXX-XXXX"
                    maxLength="15"
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="empresaVisitante"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Empresa (opcional)
                  </label>
                  <input
                    type="text"
                    id="empresaVisitante"
                    name="empresaVisitante"
                    value={newVisitor.empresaVisitante}
                    onChange={handleChange}
                    placeholder="Ex: Empresa Exemplo"
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="pessoaAnfitria"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Responsável (Anfitrião)
                  </label>
                  <select
                    id="pessoaAnfitria"
                    name="pessoaAnfitria"
                    value={newVisitor.pessoaAnfitria}
                    onChange={handleChange}
                    required
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  >
                    <option value="">Selecione um anfitrião</option>
                    {collaborators.map((col) => (
                      <option key={col.idColaborador} value={col.idColaborador}>
                        {col.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label
                    htmlFor="motivoVisita"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Motivo da visita
                  </label>
                  <input
                    type="text"
                    id="motivoVisita"
                    name="motivoVisita"
                    value={newVisitor.motivoVisita}
                    onChange={handleChange}
                    placeholder="Ex: Reunião, entrevista, etc."
                    className="mt-1 border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#038C3E]"
                  />
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#038C3E] text-white py-3 px-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#036f4c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#36A293] transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isSubmitting ? "CADASTRANDO..." : "CADASTRAR VISITANTE"}
                </button>
              </div>
            </form>
          </div>

          {/* Card de Gerenciamento de Visitantes */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-5">
              Gerenciar visitantes
            </h2>

            <div className="relative mb-4 sm:mb-6">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Buscar por Nome ou Documento do Visitante..."
                className="pl-10 sm:pl-12 w-full md:w-1/2 rounded-[8px] placeholder-[#859990] h-10 bg-[#53A67F]/15 transition-border focus:outline-none focus:ring-1 focus:ring-[#038C3E] text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {fetchError && (
              <p className="text-red-600 text-center py-4 text-sm">
                {fetchError}
              </p>
            )}

            <div className="overflow-x-auto overflow-y-auto max-h-[400px]">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitante
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Motivo
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Empresa
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Responsável
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-4 text-gray-500 text-sm"
                      >
                        Carregando visitantes...
                      </td>
                    </tr>
                  ) : filteredVisitors.length > 0 ? (
                    filteredVisitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-800 font-medium">
                          {visitor.nomeCompleto}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          {`${visitor.tipoDocumento}: ${visitor.numeroDocumento}`}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                          {visitor.motivoVisita}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                          {visitor.empresaVisitante}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden md:table-cell">
                          {visitor.nomeAnfitriao}
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 sm:px-3 py-1 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${
                              visitor.ativo
                                ? "bg-[#53A67F] text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {visitor.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-4 text-gray-500 text-sm"
                      >
                        {searchTerm
                          ? "Nenhum visitante encontrado."
                          : "Nenhum visitante cadastrado."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Visitantes;
