import React from "react";
import Navbar from "../components/Navbar";

// Ícone de busca em SVG
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
  const [searchTerm, setSearchTerm] = React.useState("");
  // Dados de exemplo para a tabela. Em um app real, viria de uma API.
  const visitors = [
    {
      id: 1,
      name: "Ana Carolina Souza",
      document: "CPF: 123.456.789-10",
      reason: "Reunião de Projeto",
      company: "Tech Solutions",
      responsible: "Carlos Pereira",
      status: "ativo",
    },
    {
      id: 2,
      name: "Bruno Lima Costa",
      document: "RG: 98.765.432-1",
      reason: "Entrevista de Emprego",
      company: "Inova Corp",
      responsible: "Mariana Almeida",
      status: "ativo",
    },
    {
      id: 3,
      name: "Carla Martins Rocha",
      document: "CPF: 234.567.890-12",
      reason: "Visita Técnica",
      company: "Engenharia Global",
      responsible: "Gerson alguma coisa",
      status: "inativo",
    },
    {
      id: 4,
      name: "Daniel Almeida",
      document: "Passaporte: BR123456",
      reason: "Consultoria",
      company: "Consultores Associados",
      responsible: "Fernanda Lima",
      status: "ativo",
    },
    {
      id: 5,
      name: "Eduardo Ferreira",
      document: "CPF: 345.678.901-23",
      reason: "Entrega de Material",
      company: "Logística Express",
      responsible: "Carlos Pereira",
      status: "ativo",
    },
    {
      id: 6,
      name: "Fernanda Oliveira",
      document: "CPF: 456.789.012-34",
      reason: "Visita escolar",
      company: "Escola Aprender Mais",
      responsible: "Gerson alguma coisa",
      status: "ativo",
    },
    {
      id: 7,
      name: "Gustavo Santos",
      document: "RG: 11.222.333-4",
      reason: "Manutenção de Equipamento",
      company: "Manutenção Total",
      responsible: "Mariana Almeida",
      status: "inativo",
    },
    {
      id: 8,
      name: "Heloísa Ribeiro",
      document: "CPF: 567.890.123-45",
      reason: "Reunião Comercial",
      company: "Vendas Pro",
      responsible: "Fernanda Lima",
      status: "ativo",
    },
    {
      id: 9,
      name: "Lucas Azevedo",
      document: "CPF: 678.901.234-56",
      reason: "Auditoria Interna",
      company: "Auditores Brasil",
      responsible: "Carlos Pereira",
      status: "ativo",
    },
    {
      id: 10,
      name: "Mariana Costa",
      document: "RG: 22.333.444-5",
      reason: "Visita escolar",
      company: "Escola Aprender Mais",
      responsible: "Gerson alguma coisa",
      status: "ativo",
    },
  ];

  const filteredVisitors = visitors.filter((visitor) => {
    const visitorName = visitor.name.toLowerCase();
    const visitorDocument = visitor.document.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    return (
      visitorName.includes(searchTermLower) ||
      visitorDocument.includes(searchTermLower)
    );
  });

  return (
    // Removido 'h-screen' e 'flex' para permitir que o conteúdo cresça e role naturalmente.
    // 'relative' é necessário para posicionar a forma decorativa.
    <div className="bg-[#E5EDE9] min-h-screen flex items-top gap-4">
      <Navbar />

      {/* Forma decorativa no canto superior direito */}
      <div
        className="absolute top-0 right-0 w-1/3 h-1/3 sm:w-1/4 sm:h-1/2 bg-[#53A67F] rounded-bl-full"
        style={{ zIndex: 0 }}
      ></div>

      {/* Conteúdo principal com z-index para ficar acima da forma */}
      <div className="relative mx-auto w-full px-8" style={{ zIndex: 1 }}>
        <header className="mb-9 mt-9">
          <h1 className="text-4xl font-bold text-[#3B7258]">VISITANTES</h1>
        </header>

        <main>
          {/* Card de Cadastro de Visitante */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-gray-800">
              Cadastrar visitante
            </h2>
            <p className="text-gray-500 mb-6">
              Cadastre as informações do visitante
            </p>

            <form>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Nome completo */}
                <div className="lg:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Nome completo
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    placeholder="Digite o Nome"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm"
                  />
                </div>

                {/* Tipo de documento */}
                <div>
                  <label
                    htmlFor="docType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Tipo de documento
                  </label>
                  <select
                    id="docType"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm"
                  >
                    <option>Selecione</option>
                    <option>CPF</option>
                    <option>RG</option>
                    <option>Passaporte</option>
                  </select>
                </div>

                {/* Numero do documento */}
                <div>
                  <label
                    htmlFor="docNumber"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Numero do documento
                  </label>
                  <input
                    type="text"
                    id="docNumber"
                    placeholder="000.000.000-00"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm"
                  />
                </div>

                {/* Detalhes do documento */}
                <div className="lg:col-span-1">
                  <label
                    htmlFor="docDetails"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Detalhes do documento
                  </label>
                  <input
                    type="text"
                    id="docDetails"
                    placeholder="Detalhes Do Documento"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm"
                  />
                </div>

                {/* Motivo da visita */}
                <div>
                  <label
                    htmlFor="visitReason"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Motivo da visita
                  </label>
                  <input
                    type="text"
                    id="visitReason"
                    placeholder="Ex: Visita técnica"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Empresa (opcional)
                  </label>
                  <input
                    type="text"
                    id="company"
                    placeholder="Ex: Empresa Exemplo"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm"
                  />
                </div>

                {/* Responsavel */}
                <div>
                  <label
                    htmlFor="responsible"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Responsavel
                  </label>
                  <select
                    id="responsible"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm"
                  >
                    <option>Selecione</option>
                    <option>Gerson alguma coisa</option>
                  </select>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full bg-[#038C3E] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#036f4c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#36A293] transition-colors"
                >
                  Cadastrar Visitante
                </button>
              </div>
            </form>
          </div>

          {/* Card de Gerenciamento de Visitantes */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Gerenciar visitantes
            </h2>

            <div className="relative mb-6">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Buscar Por Nome/ DDocumento Do Visitante..."
                className="block w-full rounded-md border-gray-300 bg-gray-50 pl-10 shadow-sm focus:border-[#36A293] focus:ring-[#36A293] sm:text-sm py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
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
                      Responsavel
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
                  {filteredVisitors.map((visitor, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.document}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.responsible}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#53A67F] text-white">
                          {visitor.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
