import api from "./axios"; // Importa sua instância configurada do Axios

/**
 * Busca a lista completa de visitantes.
 * @returns {Promise<Array>} Uma promessa que resolve para o array de visitantes.
 */
export const getVisitantes = async () => {
  try {
    const response = await api.get("/visitantes");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar visitantes:", error);
    throw error; // Lança o erro para o componente/hook tratar
  }
};

/**
 * Cria um novo visitante.
 * @param {object} visitorData - Os dados do novo visitante (com máscaras).
 * @returns {Promise<object>} Uma promessa que resolve para os dados do visitante criado.
 */
export const createVisitante = async (visitorData) => {
  try {
    // Remove a máscara de todos os campos antes de enviar
    const dataToSend = {
      ...visitorData,
      numeroDocumento: visitorData.numeroDocumento.replace(/\D/g, ""),
      telefone: (visitorData.telefone || "").replace(/\D/g, ""), // Garante que telefone não é nulo
    };

    const response = await api.post("/visitantes", dataToSend);
    return response.data;
  } catch (error) {
    console.error("Erro ao cadastrar visitante:", error);
    throw error; // Lança o erro para o componente/hook tratar
  }
};

// Você pode adicionar mais funções aqui no futuro, como:
// export const getVisitanteById = async (id) => { ... }
// export const updateVisitante = async (id, data) => { ... }
