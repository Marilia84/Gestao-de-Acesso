import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios"; // Certifique-se de que o caminho para sua instância do axios está correto

// --- ÍCONES --- (sem alterações)
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

// --- FUNÇÕES DE MÁSCARA ---

const maskCPF = (value) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .slice(0, 14);
};

const maskRG = (value) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1})/, "$1-$2")
    .slice(0, 12);
};

// 1. NOVA FUNÇÃO DE MÁSCARA PARA TELEFONE
const maskPhone = (value) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não é dígito
    .slice(0, 11) // Limita a 11 dígitos (DDD + 9 dígitos do celular)
    .replace(/^(\d{2})(\d)/g, "($1) $2") // Coloca parênteses em volta dos dois primeiros dígitos
    .replace(/(\d{5})(\d)/, "$1-$2"); // Coloca hífen depois do quinto dígito (para celular com 9 dígitos)
};

const Visitantes = () => {
  const [visitors, setVisitors] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
    try {
      const [visitorsRes, collaboratorsRes] = await Promise.all([
        api.get("/visitantes"),
        api.get("/colaboradores"),
      ]);
      const visitorsData = visitorsRes.data;
      const collaboratorsData = collaboratorsRes.data;
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. LÓGICA DE HANDLECHANGE ATUALIZADA PARA TELEFONE
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
    }
    // Adiciona a lógica para o campo de telefone
    else if (name === "telefone") {
      const maskedValue = maskPhone(value);
      setNewVisitor((prevState) => ({ ...prevState, telefone: maskedValue }));
    } else {
      setNewVisitor((prevState) => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Remove a máscara de todos os campos antes de enviar
      const visitorDataToSend = {
        ...newVisitor,
        numeroDocumento: newVisitor.numeroDocumento.replace(/\D/g, ""),
        telefone: newVisitor.telefone.replace(/\D/g, ""),
      };
      await api.post("/visitantes", visitorDataToSend);
      fetchData();
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
      alert("Falha ao cadastrar. Verifique os dados e tente novamente.");
    }
  };

  const filteredVisitors = visitors.filter((visitor) => {
    const visitorName = visitor.nomeCompleto.toLowerCase();
    const visitorDocument = visitor.numeroDocumento.toLowerCase();
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
    <div className="bg-[#E5EDE9] min-h-screen flex items-top gap-4">
      <Navbar />
      <div
        className="absolute top-0 right-0 w-1/3 h-1/3 sm:w-1/4 sm:h-1/2 bg-[#53A67F] rounded-bl-full"
        style={{ zIndex: 0 }}
      ></div>
      <div className="relative mx-auto w-full px-8" style={{ zIndex: 1 }}>
        <header className="mb-9 mt-9">
          <h1 className="text-5xl font-bold text-[#3B7258]">VISITANTES</h1>
        </header>

        <main>
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">
              Cadastrar visitante
            </h2>
            <p className="text-sm text-gray-500 mb-6 ml-1">
              Preencha as informações do visitante
            </p>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
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
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
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
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
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
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
                  />
                </div>
                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Telefone
                  </label>
                  {/* 3. INPUT DE TELEFONE ATUALIZADO */}
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={newVisitor.telefone}
                    onChange={handleChange}
                    placeholder="(XX) XXXXX-XXXX"
                    maxLength="15" // Comprimento máximo com a máscara: (11) 98888-7777
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
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
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
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
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
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
                    className="mt-1 border-2 border-gray-400 rounded-lg px-4 py-3 w-full h-12 text-base"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full bg-[#038C3E] text-white py-3 px-4 rounded-lg font-semibold text-sm hover:bg-[#036f4c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#36A293] transition-colors"
                >
                  CADASTRAR VISITANTE
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-5">
              Gerenciar visitantes
            </h2>
            <div className="relative mb-6">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Buscar por Nome ou Documento do Visitante..."
                className="pl-12 w-1/2 rounded-[8px] placeholder-[#859990] h-8 bg-[#53A67F]/15 transition-border focus:outline-none focus:ring-1 focus:ring-[#038C3E]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Visitante
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Documento
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Motivo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Empresa
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Responsável
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        Carregando visitantes...
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                          {visitor.nomeCompleto}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${visitor.tipoDocumento}: ${visitor.numeroDocumento}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.motivoVisita}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.empresaVisitante}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {visitor.nomeAnfitriao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              visitor.ativo
                                ? "bg-[#53A67F] text-white"
                                : "bg-[#E51212] text-white"
                            }`}
                          >
                            {visitor.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ))
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
