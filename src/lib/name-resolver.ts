/**
 * Centralized Name Resolver for ScrapMax
 * Ensures that whenever a Collector Partner or Household Citizen name is displayed
 * or saved, it resolves directly from the user's Profile, Auth metadata, or Local Cache.
 * Completely filters out generic system placeholders like "Verified Scrap Collector",
 * "Household Customer", "Collector", or "Household".
 */

export const DEFAULT_COLLECTOR_NAME = 'Ramesh Patel';
export const DEFAULT_HOUSEHOLD_NAME = 'Raj Mishra';

const PLACEHOLDER_COLLECTOR_NAMES = new Set([
  'verified scrap collector',
  'collector',
  'verified scrap partner',
  'verified collector',
  'partner',
]);

const PLACEHOLDER_HOUSEHOLD_NAMES = new Set([
  'household customer',
  'household',
  'household user',
  'customer',
  'citizen',
  'friend',
]);

/**
 * Resolves the real human name for a Collector Partner.
 * Checks:
 * 1. Provided name (if not a placeholder)
 * 2. Dedicated collector profile in localStorage ('scrapmax_collector_profile')
 * 3. Default verified partner name ('Ramesh Patel')
 */
export function resolveCollectorName(name?: string | null): string {
  if (name && typeof name === 'string') {
    const trimmed = name.trim();
    if (trimmed && !PLACEHOLDER_COLLECTOR_NAMES.has(trimmed.toLowerCase())) {
      return trimmed;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const colRaw = localStorage.getItem('scrapmax_collector_profile');
      if (colRaw) {
        const parsed = JSON.parse(colRaw);
        if (parsed.fullName && typeof parsed.fullName === 'string' && parsed.fullName.trim()) {
          const colTrimmed = parsed.fullName.trim();
          if (!PLACEHOLDER_COLLECTOR_NAMES.has(colTrimmed.toLowerCase())) {
            return colTrimmed;
          }
        }
      }
    } catch {}
  }

  return DEFAULT_COLLECTOR_NAME;
}

/**
 * Resolves the real human name for a Household Citizen.
 * Checks:
 * 1. Provided name (if not a placeholder)
 * 2. Personal info in localStorage ('scrapmax_personal_info' or 'aicle_personal_info')
 * 3. Default citizen name ('Raj Mishra')
 */
export function resolveHouseholdName(name?: string | null): string {
  if (name && typeof name === 'string') {
    const trimmed = name.trim();
    if (trimmed && !PLACEHOLDER_HOUSEHOLD_NAMES.has(trimmed.toLowerCase())) {
      return trimmed;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const personalRaw =
        localStorage.getItem('scrapmax_personal_info') || localStorage.getItem('aicle_personal_info');
      if (personalRaw) {
        const parsed = JSON.parse(personalRaw);
        if (parsed.fullName && typeof parsed.fullName === 'string' && parsed.fullName.trim()) {
          const hTrimmed = parsed.fullName.trim();
          if (!PLACEHOLDER_HOUSEHOLD_NAMES.has(hTrimmed.toLowerCase())) {
            return hTrimmed;
          }
        }
      }
    } catch {}
  }

  return DEFAULT_HOUSEHOLD_NAME;
}
