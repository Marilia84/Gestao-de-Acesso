import api from "./axios"; // Importa a sua instância configurada do Axios

/**
 * Busca a lista completa de impedimentos.
 * @returns {Promise<Array>} Uma promessa que resolve para o array de impedimentos.
 */
export const getImpedimentos = async () => {
  try {
    const response = await api.get("/impedimentos");
    // Garante que o retorno seja sempre um array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar impedimentos:", error);
    throw error; // Lança o erro para o componente/hook tratar
  }
};
