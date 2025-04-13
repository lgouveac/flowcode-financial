
// Cache to prevent duplicate emails
const emailSentCache = new Map<string, number>();

// Constants
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_CLEANUP_INTERVAL_MS = 3600 * 1000; // 1 hour
const DUPLICATE_PREVENTION_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

// CORS headers for Edge Function
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Set up a periodic cache cleanup to prevent memory leaks
 */
export function setupCacheCleanup() {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of emailSentCache.entries()) {
      if (now - timestamp > CACHE_EXPIRY_MS) {
        emailSentCache.delete(key);
      }
    }
  }, CACHE_CLEANUP_INTERVAL_MS);
}

/**
 * Generate a cache key for deduplication
 */
export function generateCacheKey(
  to: string,
  dueDate: string,
  installmentNumber: number,
  daysUntilDue: number
): string {
  return `${to}_${dueDate}_${installmentNumber}_${daysUntilDue}`;
}

/**
 * Check if an email has already been sent recently
 */
export function isDuplicateEmail(cacheKey: string): { isDuplicate: boolean; timeSince: number } {
  const lastSent = emailSentCache.get(cacheKey);
  if (!lastSent) {
    return { isDuplicate: false, timeSince: 0 };
  }
  
  const now = Date.now();
  const timeSince = now - lastSent;
  
  return {
    isDuplicate: timeSince < DUPLICATE_PREVENTION_WINDOW_MS,
    timeSince
  };
}

/**
 * Record that an email has been sent
 */
export function recordEmailSent(cacheKey: string): void {
  emailSentCache.set(cacheKey, Date.now());
}
