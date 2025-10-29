import api from "./axios"; // Importa a sua instância configurada do Axios

/**
 * Busca a lista completa de colaboradores.
 * @returns {Promise<Array>} Uma promessa que resolve para o array de colaboradores.
 */
export const getColaboradores = async () => {
  try {
    const response = await api.get("/colaboradores");
    // Garante que o retorno seja sempre um array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar colaboradores:", error);
    throw error; // Lança o erro para o componente/hook tratar
  }
};

/**
 * Busca um colaborador específico pelo seu ID.
 * @param {string} id - O ID do colaborador.
 * @returns {Promise<object>} Uma promessa que resolve para o objeto do colaborador.
 */
export const getColaboradorById = async (id) => {
  if (!id) {
    throw new Error("O ID do Colaborador é obrigatório.");
  }
  try {
    const response = await api.get(`/colaboradores/${id}`);
    return response.data; // Retorna o objeto do colaborador
  } catch (error) {
    console.error(`Erro ao buscar colaborador com ID ${id}:`, error);
    throw error;
  }
};
