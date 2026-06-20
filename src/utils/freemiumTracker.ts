/**
 * Freemium Analysis Tracker and Limit Checker
 * isolates tracking state and storage logic from visual layouts.
 * Easily swappable for database/Stripe server-side checks.
 */

const STORAGE_KEY_PREFIX = 'matchiq_free_views_';
const DAILY_LIMIT = 2;

// Helper to get today's date formatted as YYYY-MM-DD in local timezone
export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retrieves the set of unique match IDs analyzed today
 */
export function getViewedMatchesForToday(): string[] {
  try {
    const todayKey = getTodayKey();
    const storageKey = STORAGE_KEY_PREFIX + todayKey;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch (err) {
    console.error("Error reading from localStorage:", err);
    return [];
  }
}

/**
 * Registers a match view for today. Returns the updated array of match IDs and the count.
 * Only increments for unique matches to be fair to the user (clicking the same match doesn't count twice)
 */
export function registerMatchView(matchId: string): { viewedIds: string[]; count: number } {
  try {
    const todayKey = getTodayKey();
    const storageKey = STORAGE_KEY_PREFIX + todayKey;
    const viewed = getViewedMatchesForToday();
    
    if (!viewed.includes(matchId)) {
      viewed.push(matchId);
      localStorage.setItem(storageKey, JSON.stringify(viewed));
      
      // Optional: Clean up older days from localStorage to keep it tidy
      cleanLegacyKeys(todayKey);
    }
    
    return {
      viewedIds: viewed,
      count: viewed.length
    };
  } catch (err) {
    console.error("Error writing to localStorage:", err);
    return { viewedIds: [], count: 0 };
  }
}

/**
 * Returns the maximum free daily matches
 */
export function getDailyLimitMax(): number {
  return DAILY_LIMIT;
}

/**
 * Gets or creates a generic unique user ID for session isolation
 */
export function getOrCreateUserId(): string {
  try {
    let userId = localStorage.getItem('matchiq_user_id');
    if (!userId) {
      userId = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('matchiq_user_id', userId);
    }
    return userId;
  } catch (err) {
    return 'usr_guest';
  }
}

/**
 * Clean legacy dates to avoid filling up localStorage
 */
function cleanLegacyKeys(currentDateKey: string) {
  try {
    const activeKey = STORAGE_KEY_PREFIX + currentDateKey;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX) && key !== activeKey) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    // Ignore storage accessor errors
  }
}
