
// Email sending cache to prevent duplicates
export const emailCache = new Map<string, number>();

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Clean up old cache entries every hour (to prevent memory leaks)
export const setupCacheCleanup = () => {
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of emailCache.entries()) {
      // Remove entries older than 24 hours
      if (now - timestamp > 24 * ONE_HOUR) {
        emailCache.delete(key);
      }
    }
  }, ONE_HOUR);
};

// Generate a cache key based on recipient, due date, and installment info
export const generateCacheKey = (to: string, dueDate: string | undefined, installment: number, daysBefore: number | undefined) => {
  // Create a unique key that prevents duplicate emails for the same event
  return `${to}:${dueDate}:${installment}:${daysBefore || 0}`;
};

// Check if an email was recently sent (within last 6 hours)
export const isDuplicateEmail = (cacheKey: string) => {
  const lastSent = emailCache.get(cacheKey);
  if (!lastSent) return { isDuplicate: false, timeSince: 0 };
  
  const now = Date.now();
  const timeSince = now - lastSent;
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  
  return { 
    isDuplicate: timeSince < SIX_HOURS, 
    timeSince
  };
};

// Record that an email was sent
export const recordEmailSent = (cacheKey: string) => {
  emailCache.set(cacheKey, Date.now());
};
