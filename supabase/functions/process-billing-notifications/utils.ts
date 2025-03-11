
// Cache to store recently sent emails
const emailCache = new Map<string, number>();

// CORS headers for the edge function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Set up cache cleanup interval (every hour)
export const setupCacheCleanup = () => {
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of emailCache.entries()) {
      if (now - timestamp > ONE_HOUR) {
        emailCache.delete(key);
      }
    }
  }, ONE_HOUR);
};

// Generate a unique cache key for an email
export const generateCacheKey = (
  email: string,
  dueDate: string,
  currentInstallment: number,
  daysUntilDue: number
): string => {
  return `${email}_${dueDate}_${currentInstallment}_${daysUntilDue}`;
};

// Check if an email was recently sent (within the last hour)
export const isDuplicateEmail = (cacheKey: string): { isDuplicate: boolean; timeSince: number } => {
  const lastSentTimestamp = emailCache.get(cacheKey);
  if (!lastSentTimestamp) {
    return { isDuplicate: false, timeSince: 0 };
  }

  const timeSince = Date.now() - lastSentTimestamp;
  const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

  return {
    isDuplicate: timeSince < ONE_HOUR,
    timeSince
  };
};

// Record that an email was sent
export const recordEmailSent = (cacheKey: string) => {
  emailCache.set(cacheKey, Date.now());
};
