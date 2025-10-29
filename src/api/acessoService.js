import api from "./axios"; // Importa sua instância configurada do Axios

/**
 * Busca o histórico de acessos com base em um intervalo de datas.
 * @param {string} dataDe - Data inicial no formato "yyyy-MM-dd"
 * @param {string} dataAte - Data final no formato "yyyy-MM-dd"
 * @returns {Promise<Array>} Uma promessa que resolve para o array de acessos.
 */
export const getAcessosHistorico = async (dataDe, dataAte) => {
  try {
    // Usa os query parameters 'de' e 'ate' conforme a API espera
    const response = await api.get(
      `/acessos/historico?de=${dataDe}&ate=${dataAte}`
    );
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar histórico de acessos:", error);
    throw error; // Lança o erro para o componente tratar
  }
};

/**
 * Registra uma nova entrada na portaria.
 * @param {object} payload - O objeto de dados para registrar a entrada.
 * Ex: { tipoPessoa: "COLABORADOR", matriculaOuDocumento: "123", codPortaria: 1, ocupanteMatriculas: [] }
 * @returns {Promise<object>} A resposta da API.
 */
export const registrarEntrada = async (payload) => {
  try {
    const response = await api.post("/acessos/por-matricula", payload);
    return response.data;
  } catch (error) {
    console.error("Erro ao registrar entrada:", error);
    throw error;
  }
};

/**
 * Registra a saída de um acesso existente.
 * @param {string} idAcesso - O ID do registro de acesso que está sendo encerrado.
 * @returns {Promise<object>} A resposta da API.
 */
export const registrarSaida = async (idAcesso) => {
  try {
    const response = await api.post(`/acessos/${idAcesso}/saida`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao registrar saída para acesso ${idAcesso}:`, error);
    throw error;
  }
};

/**
 * Busca todos os acessos que ainda estão abertos (sem data de saída).
 * (Usado na versão anterior para 'Visitantes Presentes')
 * @returns {Promise<Array>} Uma promessa que resolve para o array de acessos abertos.
 */
export const getAcessosAbertos = async () => {
  try {
    const response = await api.get("/acessos");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Erro ao buscar acessos abertos:", error);
    throw error;
  }
};
