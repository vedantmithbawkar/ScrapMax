/**
 * Centralized Name Resolver for ScrapMax
 * Directly resolves from the user's explicit input, Profile, Auth metadata, or Local Cache.
 * Does NOT inject fake default person names.
 * Ensures names are pulled directly from what the user entered in their profile or pickup request.
 */

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
  'citizen household',
  'friend',
]);

/**
 * Resolves the real human name for a Collector Partner.
 * Checks:
 * 1. Provided name (if not a placeholder)
 * 2. Dedicated collector profile in localStorage ('scrapmax_collector_profile')
 * 3. Returns empty string if no genuine partner name was entered.
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

  return '';
}

/**
 * Resolves the real human name for a Household Citizen.
 * Checks:
 * 1. Provided name (if not a placeholder)
 * 2. Personal info in localStorage ('scrapmax_personal_info' or 'aicle_personal_info')
 * 3. Returns empty string if no genuine citizen name was entered.
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

  return '';
}
