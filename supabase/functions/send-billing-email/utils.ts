
// Email cache to prevent duplicate emails
export const emailCache = new Map<string, number>();
export const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Clean up old cache entries periodically
export const setupCacheCleanup = () => {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of emailCache.entries()) {
      if (now - timestamp > CACHE_TTL) {
        emailCache.delete(key);
      }
    }
  }, 300000); // Clean every 5 minutes
};

// CORS headers for the API
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Format currency values
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Format date values to Brazilian format
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Generate a cache key for deduplication
export const generateCacheKey = (
  email: string, 
  dueDate: string, 
  currentInstallment: number = 1, 
  daysUntilDue: number
): string => {
  return `${email}-${dueDate}-${currentInstallment}-${daysUntilDue}`;
};

// Check if an email is a duplicate
export const isDuplicateEmail = (cacheKey: string): { isDuplicate: boolean, timeSince?: number } => {
  const lastSent = emailCache.get(cacheKey);
  if (lastSent) {
    const timeSince = Date.now() - lastSent;
    if (timeSince < CACHE_TTL) {
      return { isDuplicate: true, timeSince };
    }
  }
  return { isDuplicate: false };
};

// Record a sent email in the cache
export const recordEmailSent = (cacheKey: string): void => {
  emailCache.set(cacheKey, Date.now());
};
