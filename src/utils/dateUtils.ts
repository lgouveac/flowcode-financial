/**
 * Formatar data para input type="date" sem problemas de timezone
 */
export const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return "";

  try {
    // Se já está no formato correto (YYYY-MM-DD), retornar como está
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }

    // Se tem timestamp, extrair apenas a parte da data
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }

    // Para outros formatos, tentar converter
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }

    // Usar toLocaleDateString com formato específico para evitar timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
};

/**
 * Converter data do input para string no formato correto para API
 */
export const formatDateForAPI = (inputDate: string): string => {
  if (!inputDate) return "";

  // Input type="date" já retorna no formato YYYY-MM-DD
  // Apenas garantir que não tem timezone
  return inputDate;
};