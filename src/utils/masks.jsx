/**
 * Aplica máscara de CPF (xxx.xxx.xxx-xx)
 */
export const maskCPF = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, "") // Remove tudo que não é dígito
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .slice(0, 14);
};

/**
 * Aplica máscara de RG (xx.xxx.xxx-x)
 * (Este é um formato comum, ajuste se o seu for diferente)
 */
export const maskRG = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1})/, "$1-$2")
    .slice(0, 12);
};

/**
 * Aplica máscara de Telefone (XX) XXXXX-XXXX
 */
export const maskPhone = (value) => {
  if (!value) return "";
  return value
    .replace(/\D/g, "") // Remove tudo que não é dígito
    .slice(0, 11) // Limita a 11 dígitos (DDD + 9 dígitos do celular)
    .replace(/^(\d{2})(\d)/g, "($1) $2") // Coloca parênteses em volta dos dois primeiros dígitos
    .replace(/(\d{5})(\d)/, "$1-$2"); // Coloca hífen depois do quinto dígito (para celular com 9 dígitos)
};
