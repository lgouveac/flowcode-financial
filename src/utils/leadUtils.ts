import { Lead } from "@/types/lead";

/**
 * Calculate the average closing time for won leads in days
 * Prioritizes manual tempo_fechamento, falls back to calculated time
 */
export const calculateAverageClosingTime = (leads: Lead[]): number => {
  const wonLeads = leads.filter(lead => lead.Status === "Won");

  if (wonLeads.length === 0) return 0;

  const validClosingTimes: number[] = [];

  wonLeads.forEach(lead => {
    // Use manual tempo_fechamento if available
    if (lead.tempo_fechamento && lead.tempo_fechamento > 0) {
      validClosingTimes.push(lead.tempo_fechamento);
    }
    // Fall back to calculated time if dates are available
    else if (lead.won_at && lead.created_at) {
      const start = new Date(lead.created_at);
      const end = new Date(lead.won_at);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      validClosingTimes.push(diffDays);
    }
  });

  if (validClosingTimes.length === 0) return 0;

  const totalDays = validClosingTimes.reduce((sum, days) => sum + days, 0);
  return totalDays / validClosingTimes.length;
};

/**
 * Format closing time for display
 */
export const formatClosingTime = (days: number): string => {
  if (days === 0) return "N/A";
  if (days === 1) return "1 dia";
  if (days < 30) return `${Math.round(days)} dias`;

  const months = Math.floor(days / 30);
  const remainingDays = Math.round(days % 30);

  if (months === 1 && remainingDays === 0) return "1 mês";
  if (months === 1) return `1 mês e ${remainingDays} dias`;
  if (remainingDays === 0) return `${months} meses`;
  return `${months} meses e ${remainingDays} dias`;
};

/**
 * Get lead metrics for dashboard
 */
export const getLeadMetrics = (leads: Lead[]) => {
  const totalLeads = leads.length;
  const wonLeads = leads.filter(lead => lead.Status === "Won").length;
  const lostLeads = leads.filter(lead => lead.Status === "Lost").length;
  const activeLeads = totalLeads - wonLeads - lostLeads;

  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
  const averageClosingTime = calculateAverageClosingTime(leads);

  return {
    totalLeads,
    wonLeads,
    lostLeads,
    activeLeads,
    conversionRate,
    averageClosingTime,
    averageClosingTimeFormatted: formatClosingTime(averageClosingTime)
  };
};