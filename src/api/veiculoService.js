import api from "./axios";

/**
 * Busca a lista de todos os veículos cadastrados.
 * Endpoint: /veiculos
 */
export const getVeiculos = async () => {
  try {
    const response = await api.get("/veiculos");
    // Garante que retorna um array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar veículos:", error);
    throw error;
  }
};

/**
 * Busca um veículo específico pelo ID.
 */
export const getVeiculoById = async (id) => {
  try {
    const response = await api.get(`/veiculos/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar veículo ${id}:`, error);
    throw error;
  }
};
