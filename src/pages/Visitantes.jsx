// src/pages/Visitantes.jsx
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify"; // 👈 Importamos o toast
import { getColaboradores } from "../api/colaboradorService";
import { getVisitantes, createVisitante } from "../api/visitanteService";
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
      const errorMsg = "Falha ao carregar dados. Tente recarregar a página.";
      setFetchError(errorMsg);
      toast.error(errorMsg); // 👈 Toast de erro
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
      setNewVisitor((prev) => ({ ...prev, numeroDocumento: maskedValue }));
    } else if (name === "telefone") {
      setNewVisitor((prev) => ({ ...prev, telefone: maskPhone(value) }));
    } else {
      setNewVisitor((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createVisitante(newVisitor);
      await fetchData();
      toast.success("Visitante cadastrado com sucesso!"); // 👈 Toast de sucesso
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
      toast.error(errorMsg); // 👈 Toast de erro
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVisitors = visitors.filter((v) => {
    const nome = v.nomeCompleto?.toLowerCase() || "";
    const doc = v.numeroDocumento?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return nome.includes(search) || doc.includes(search);
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
  <main className="flex-1 p-4 md:p-10 ml-16">
    <div className="relative z-10 w-full max-w-6xl mx-auto space-y-8 overflow-x-hidden">
      {/* FUNDO DECORATIVO: cor igual ao fundo principal */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 sm:w-1/4 sm:h-1/2 bg-[#F9FAFB] rounded-bl-full -z-10" />

      <header className="mb-6 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3B7258]">
          VISITANTES
        </h1>
      </header>

      <div className="space-y-8">
        {/* CARD DE CADASTRO */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
            Cadastrar visitante
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-4">
            Preencha as informações do visitante
          </p>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Campos do formulário */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Nome completo
                </label>
                <input
                  type="text"
                  name="nomeCompleto"
                  value={newVisitor.nomeCompleto}
                  onChange={handleChange}
                  placeholder="Digite o Nome"
                  required
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Tipo de documento
                </label>
                <select
                  name="tipoDocumento"
                  value={newVisitor.tipoDocumento}
                  onChange={handleChange}
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
                >
                  <option value="CPF">CPF</option>
                  <option value="RG">RG</option>
                  <option value="Passaporte">Passaporte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
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
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  name="dataNascimento"
                  value={newVisitor.dataNascimento}
                  onChange={handleChange}
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="telefone"
                  value={newVisitor.telefone}
                  onChange={handleChange}
                  placeholder="(XX) XXXXX-XXXX"
                  maxLength="15"
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Empresa (opcional)
                </label>
                <input
                  type="text"
                  name="empresaVisitante"
                  value={newVisitor.empresaVisitante}
                  onChange={handleChange}
                  placeholder="Ex: Empresa Exemplo"
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">
                  Responsável (Anfitrião)
                </label>
                <select
                  name="pessoaAnfitria"
                  value={newVisitor.pessoaAnfitria}
                  onChange={handleChange}
                  required
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
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
                <label className="block text-sm font-semibold text-gray-700">
                  Motivo da visita
                </label>
                <input
                  type="text"
                  name="motivoVisita"
                  value={newVisitor.motivoVisita}
                  onChange={handleChange}
                  placeholder="Ex: Reunião, entrevista, etc."
                  className="mt-1 border-2 border-gray-300 rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#038C3E]"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#038C3E] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#026d32] transition disabled:opacity-50"
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar Visitante"}
              </button>
            </div>
          </form>
        </div>

        {/* CARD DE LISTAGEM */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Gerenciar visitantes
          </h2>

          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Buscar por Nome ou Documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-1/2 rounded-lg border border-gray-300 bg-[#F9FAFB] h-10 focus:ring-2 focus:ring-[#038C3E] text-sm"
            />
          </div>

          {fetchError && (
            <p className="text-red-600 text-center py-4 text-sm">
              {fetchError}
            </p>
          )}

          <div className="overflow-x-auto max-h-[400px]">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Visitante
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                    Motivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Responsável
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">
                      Carregando visitantes...
                    </td>
                  </tr>
                ) : filteredVisitors.length > 0 ? (
                  filteredVisitors.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {v.nomeCompleto}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{`${v.tipoDocumento}: ${v.numeroDocumento}`}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {v.motivoVisita}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {v.empresaVisitante}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {v.nomeAnfitriao}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            v.ativo
                              ? "bg-[#53A67F] text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {v.ativo ? "Ativo" : "Inativo"}
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
      </div>
    </div>
  </main>
);

};

export default Visitantes;
