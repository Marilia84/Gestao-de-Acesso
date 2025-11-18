import api from "./axios";

/**
 * Busca a lista de todos os motoristas cadastrados.
 * Endpoint: /motorista
 */
export const getMotoristas = async () => {
  try {
    const response = await api.get("/motorista");
    // Garante que retorna um array mesmo se a API falhar ou vier vazia
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar motoristas:", error);
    throw error;
  }
};

/**
 * Busca um motorista específico pelo ID.
 */
export const getMotoristaById = async (id) => {
  try {
    const response = await api.get(`/motorista/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar motorista ${id}:`, error);
    throw error;
  }
};
