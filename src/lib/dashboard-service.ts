import { createClient } from '@/lib/supabase/client';
import { PickupRequest, STANDARD_SCRAP_RATES, UserRole } from '@/types';
import {
  DashboardDataResult,
  HouseholdDashboardStats,
  CollectorDashboardStats,
} from '@/types/dashboard';

/**
 * Formats weight in kilograms according to Indian numbering format.
 * Up to 1 decimal place if fractional, or integer.
 * Example: 28.4 kg, 0 kg, 312 kg
 */
export function formatWeight(kg: number | null | undefined): string {
  if (kg === null || kg === undefined || isNaN(kg) || kg <= 0) {
    return '0 kg';
  }
  const rounded = Number(kg.toFixed(1));
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(rounded)} kg`;
}

/**
 * Formats monetary amounts in Indian Rupee currency format.
 * Example: ₹642, ₹8,450, ₹0
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
    return '₹0';
  }
  const rounded = Math.round(amount);
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rounded)}`;
}

/**
 * Formats integer pickup counts using Indian numbering format.
 * Example: 14, 126, 0
 */
export function formatCount(count: number | null | undefined): string {
  if (count === null || count === undefined || isNaN(count) || count <= 0) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(count));
}

/**
 * Computes weight and earnings from a single pickup request and its waste items.
 */
function extractRequestMetrics(req: PickupRequest): { weightKg: number; earnings: number } {
  // 1. Calculate weight from related waste items
  const items = req.waste_items || [];
  let weightKg = 0;
  if (items.length > 0) {
    weightKg = items.reduce((sum, item) => sum + (Number(item.approx_weight_kg) || 0), 0);
  }
  if (weightKg <= 0 && req.total_estimated_weight_kg) {
    weightKg = Number(req.total_estimated_weight_kg) || 0;
  }

  // 2. Calculate earnings using existing payment data or standard scrap rates
  let earnings = 0;
  if (req.payment?.totalAmount && !isNaN(req.payment.totalAmount)) {
    earnings = Number(req.payment.totalAmount);
  } else if (items.length > 0) {
    earnings = items.reduce((sum, item) => {
      const rate = STANDARD_SCRAP_RATES[item.category] || 15;
      const wt = Number(item.approx_weight_kg) || 0;
      return sum + Math.round(wt * rate);
    }, 0);
  } else if (weightKg > 0) {
    earnings = Math.round(weightKg * 18);
  }

  return { weightKg, earnings };
}

/**
 * Retrieves local requests stored in browser localStorage.
 */
function getLocalCompletedRequests(): PickupRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('local_pickup_requests');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && r.status === 'completed');
  } catch {
    return [];
  }
}

/**
 * Queries Supabase and local cache for completed pickup activity
 * associated with the authenticated user and calculates the personal metrics.
 */
export async function fetchPersonalDashboardData(
  overrideRole?: UserRole
): Promise<DashboardDataResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Determine user role and identity
  let role: UserRole = overrideRole || 'household';
  const userId = user?.id;

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'household' || profile?.role === 'collector') {
        role = overrideRole || profile.role;
      } else if (user.user_metadata?.role) {
        role = overrideRole || (user.user_metadata.role as UserRole);
      }
    } catch (err) {
      console.warn('Dashboard profile query notice:', err);
    }
  }

  // If unauthenticated, check local storage or return 0-state
  if (!user || !userId) {
    const localCompleted = getLocalCompletedRequests();
    if (role === 'household') {
      const householdStats: HouseholdDashboardStats = {
        totalRecycledKg: 0,
        totalEarned: 0,
        completedPickups: 0,
      };

      for (const req of localCompleted) {
        const { weightKg, earnings } = extractRequestMetrics(req);
        householdStats.totalRecycledKg += weightKg;
        householdStats.totalEarned += earnings;
        householdStats.completedPickups += 1;
      }

      return {
        role: 'household',
        stats: householdStats,
        isDemo: true,
      };
    } else {
      const collectorStats: CollectorDashboardStats = {
        totalEarned: 0,
        completedPickups: 0,
        totalCollectedKg: 0,
      };

      for (const req of localCompleted) {
        const { weightKg, earnings } = extractRequestMetrics(req);
        collectorStats.totalEarned += earnings;
        collectorStats.totalCollectedKg += weightKg;
        collectorStats.completedPickups += 1;
      }

      return {
        role: 'collector',
        stats: collectorStats,
        isDemo: true,
      };
    }
  }

  // Query only completed pickup requests belonging strictly to the authenticated user
  const query = supabase
    .from('pickup_requests')
    .select(`
      id,
      household_id,
      collector_id,
      status,
      total_estimated_weight_kg,
      waste_items (
        id,
        category,
        approx_weight_kg
      )
    `)
    .eq('status', 'completed');

  if (role === 'household') {
    query.eq('household_id', userId);
  } else {
    query.eq('collector_id', userId);
  }

  const { data: dbRequests, error } = await query;
  if (error) {
    console.error('Error fetching dashboard requests:', error);
    throw new Error(error.message);
  }

  // Merge with local completed requests for immediate client-side responsiveness
  const remoteRequests = (dbRequests || []) as unknown as PickupRequest[];
  const localCompleted = getLocalCompletedRequests().filter((r) =>
    role === 'household' ? r.household_id === userId : r.collector_id === userId
  );

  const mergedMap = new Map<string, PickupRequest>();
  for (const r of remoteRequests) {
    mergedMap.set(r.id, r);
  }
  for (const r of localCompleted) {
    // Local request might have richer payment details from client settlement
    const existing = mergedMap.get(r.id);
    if (!existing || r.payment) {
      mergedMap.set(r.id, { ...existing, ...r });
    }
  }

  const completedList = Array.from(mergedMap.values());

  if (role === 'household') {
    let totalRecycledKg = 0;
    let totalEarned = 0;

    for (const req of completedList) {
      const { weightKg, earnings } = extractRequestMetrics(req);
      totalRecycledKg += weightKg;
      totalEarned += earnings;
    }

    return {
      role: 'household',
      userId,
      stats: {
        totalRecycledKg: Number(totalRecycledKg.toFixed(2)),
        totalEarned: Math.round(totalEarned),
        completedPickups: completedList.length,
      },
      isDemo: false,
    };
  } else {
    let totalEarned = 0;
    let totalCollectedKg = 0;

    for (const req of completedList) {
      const { weightKg, earnings } = extractRequestMetrics(req);
      totalEarned += earnings;
      totalCollectedKg += weightKg;
    }

    return {
      role: 'collector',
      userId,
      stats: {
        totalEarned: Math.round(totalEarned),
        completedPickups: completedList.length,
        totalCollectedKg: Number(totalCollectedKg.toFixed(2)),
      },
      isDemo: false,
    };
  }
}
