import api from "./axios";

/**
 * Busca viagens filtradas por um ID de rota.
 */
export const getViagensPorRota = async (rotaId) => {
  if (!rotaId) {
    throw new Error("O ID da Rota é obrigatório para buscar viagens.");
  }
  try {
    const response = await api.get(`/viagens?idRota=${rotaId}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Erro ao buscar viagens para a rota ${rotaId}:`, error);
    throw error;
  }
};

/**
 * Busca os detalhes dos embarques de uma viagem específica.
 */
export const getEmbarquesDaViagem = async (viagemId) => {
  if (!viagemId) {
    throw new Error("O ID da Viagem é obrigatório para buscar embarques.");
  }
  try {
    const response = await api.get(`/viagens/${viagemId}/embarques`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Erro ao buscar embarques para a viagem ${viagemId}:`, error);
    throw error;
  }
};

/**
 * Cria uma nova viagem no sistema.
 */
export const createViagem = async (tripData) => {
  try {
    const response = await api.post("/viagens", tripData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar nova viagem:", error);
    throw error;
  }
};

/**
 * Atualiza os dados de uma viagem existente (usado para ativar/inativar).
 * Endpoint: PUT /viagens/{id}
 */
export const updateViagem = async (id, tripData) => {
  try {
    // O PUT geralmente espera o objeto completo atualizado
    const response = await api.put(`/viagens/${id}`, tripData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar a viagem ${id}:`, error);
    throw error;
  }
};
