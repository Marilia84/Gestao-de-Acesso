/**
 * Formata uma string de tempo simples (ex: "08:30:00") para HH:MM.
 * @param {string} timeStr - A string de tempo.
 * @returns {string} - O tempo formatado (ex: "08:30") ou "N/A".
 */
export const formatSimpleTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return "N/A";
  return timeStr.slice(0, 5);
};

/**
 * Formata um timestamp ISO (ex: "2025-10-14T11:56:45.1634Z") para HH:MM local.
 * @param {string} isoString - O timestamp ISO.
 * @returns {string} - O tempo formatado (ex: "08:56") ou "N/A".
 */
export const formatTimestamp = (isoString) => {
  if (!isoString) return "N/A";
  try {
    return new Date(isoString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC", // Ajuste se seu timestamp não for Z/UTC
    });
  } catch (error) {
    console.error("Erro ao formatar timestamp:", error);
    return "Inválido";
  }
};

/**
 * Pega as iniciais de um nome (ex: "Felipe Souza" -> "FS").
 * @param {string} name - O nome completo.
 * @returns {string} - As iniciais (ex: "FS") ou "?".
 */
export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "?";
  const names = name.split(" ").filter((n) => n); // Remove espaços extras
  if (names.length === 0) return "?";

  const firstInitial = names[0][0] || "";
  const lastInitial = names.length > 1 ? names[names.length - 1][0] : "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "Pendente";
  try {
    return new Date(isoString).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short", // Formato DD/MM/AAAA, HH:MM
    });
  } catch (e) {
    console.warn("Erro ao formatar data:", isoString, e);
    return "Inválido";
  }
};
