
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const getPeriodDates = (selectedPeriod: string) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  switch (selectedPeriod) {
    case 'current':
      return {
        start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
      };
    case 'last_month':
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      return {
        start: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
        end: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
      };
    case 'last_3_months':
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return {
        start: threeMonthsAgo.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    case 'last_6_months':
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return {
        start: sixMonthsAgo.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    case 'last_year':
      const lastYear = new Date(now);
      lastYear.setFullYear(now.getFullYear() - 1);
      return {
        start: lastYear.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    default:
      return {
        start: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
        end: new Date(currentYear, currentMonth, 0).toISOString().split('T')[0],
      };
  }
};
