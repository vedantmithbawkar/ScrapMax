import { UserRole } from './index';

export interface HouseholdDashboardStats {
  totalRecycledKg: number;
  totalEarned: number;
  completedPickups: number;
}

export interface CollectorDashboardStats {
  totalEarned: number;
  completedPickups: number;
  totalCollectedKg: number;
}

export type PersonalDashboardStats = HouseholdDashboardStats | CollectorDashboardStats;

export function isHouseholdStats(
  role: UserRole,
  stats: PersonalDashboardStats
): stats is HouseholdDashboardStats {
  return role === 'household' && 'totalRecycledKg' in stats;
}

export function isCollectorStats(
  role: UserRole,
  stats: PersonalDashboardStats
): stats is CollectorDashboardStats {
  return role === 'collector' && 'totalCollectedKg' in stats;
}

export interface DashboardDataResult {
  role: UserRole;
  stats: PersonalDashboardStats;
  userId?: string;
  isDemo?: boolean;
}
