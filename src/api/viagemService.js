import api from './axios'; // Importa a sua instância configurada do Axios

/**
 * Busca viagens filtradas por um ID de rota.
 * @param {string|number} rotaId - O ID da rota para filtrar as viagens.
 * @returns {Promise<Array>} Uma promessa que resolve para o array de viagens.
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
 * @param {string} viagemId - O ID da viagem.
 * @returns {Promise<Array>} Uma promessa que resolve para o array de embarques.
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
