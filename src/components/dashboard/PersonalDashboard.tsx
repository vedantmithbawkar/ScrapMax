'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserRole } from '@/types';
import {
  DashboardDataResult,
  HouseholdDashboardStats,
  CollectorDashboardStats,
  isHouseholdStats,
} from '@/types/dashboard';
import { fetchPersonalDashboardData } from '@/lib/dashboard-service';
import HouseholdImpactView from './HouseholdImpactView';
import CollectorEarningsView from './CollectorEarningsView';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface PersonalDashboardProps {
  role?: UserRole;
  className?: string;
}

export default function PersonalDashboard({ role, className = '' }: PersonalDashboardProps) {
  const [data, setData] = useState<DashboardDataResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPersonalDashboardData(role);
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load dashboard statistics';
      console.warn('Personal dashboard data load error:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const result = await fetchPersonalDashboardData(role);
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to load dashboard statistics';
          setError(message);
          setIsLoading(false);
        }
      }
    }
    init();

    return () => {
      isMounted = false;
    };
  }, [role]);

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Loading dashboard statistics">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between h-[120px] animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded-md" />
                <div className="w-10 h-10 rounded-2xl bg-gray-100" />
              </div>
              <div className="space-y-1.5 mt-4">
                <div className="h-7 w-20 bg-gray-200 rounded-md" />
                <div className="h-3 w-28 bg-gray-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-9 w-full bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Error recovery state
  if (error) {
    return (
      <div
        role="alert"
        className={`bg-white rounded-3xl p-5 border border-red-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] space-y-3 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-[#191C1E]">
              Could not load personal recycling metrics
            </h3>
          </div>
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
        <p className="text-xs text-gray-500">
          We had trouble retrieving your completed pickup records from Supabase. You can retry or check your connection.
        </p>
      </div>
    );
  }

  // Render role-specific dashboard
  const currentRole = data?.role || role || 'household';
  const stats = data?.stats;

  if (currentRole === 'collector') {
    const collectorStats: CollectorDashboardStats = stats && !isHouseholdStats(currentRole, stats)
      ? stats
      : { totalEarned: 0, completedPickups: 0, totalCollectedKg: 0 };

    return (
      <div className={className}>
        <CollectorEarningsView stats={collectorStats} isDemo={data?.isDemo} />
      </div>
    );
  }

  // Household default
  const householdStats: HouseholdDashboardStats = stats && isHouseholdStats(currentRole, stats)
    ? stats
    : { totalRecycledKg: 0, totalEarned: 0, completedPickups: 0 };

  return (
    <div className={className}>
      <HouseholdImpactView stats={householdStats} isDemo={data?.isDemo} />
    </div>
  );
}
