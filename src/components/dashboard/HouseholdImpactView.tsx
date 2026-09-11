'use client';

import React from 'react';
import { Recycle, IndianRupee, PackageCheck, Leaf } from 'lucide-react';
import StatCard from './StatCard';
import { HouseholdDashboardStats } from '@/types/dashboard';
import { formatWeight, formatCurrency, formatCount } from '@/lib/dashboard-service';
import { useTranslation } from '@/lib/i18n';

interface HouseholdImpactViewProps {
  stats: HouseholdDashboardStats;
  isDemo?: boolean;
}

export default function HouseholdImpactView({ stats, isDemo }: HouseholdImpactViewProps) {
  const { t } = useTranslation();
  const recycledText = formatWeight(stats.totalRecycledKg);
  const earnedText = formatCurrency(stats.totalEarned);
  const pickupsText = formatCount(stats.completedPickups);

  return (
    <section
      aria-labelledby="recycling-impact-title"
      className="space-y-3"
      data-purpose="household-recycling-dashboard"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2
            id="recycling-impact-title"
            className="text-lg sm:text-xl font-extrabold text-[#191C1E] tracking-tight"
          >
            {t('recyclingImpactTitle')}
          </h2>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Total Recycled */}
        <StatCard
          label={t('totalRecycledLabel')}
          value={recycledText}
          icon={<Recycle className="w-5 h-5 stroke-[2.2]" />}
          iconBgClass="bg-[#E6F4EA] text-[#136B3B]"
          subtitle={t('landfillDiversionSub')}
        />

        {/* 2. Total Earned */}
        <StatCard
          label={t('totalEarnedLabel')}
          value={earnedText}
          icon={<IndianRupee className="w-5 h-5 stroke-[2.2]" />}
          iconBgClass="bg-emerald-50 text-[#136B3B]"
          subtitle={t('instantPayoutSub')}
        />

        {/* 3. Completed Pickups */}
        <StatCard
          label={t('completedPickupsLabel')}
          value={pickupsText}
          icon={<PackageCheck className="w-5 h-5 stroke-[2.2]" />}
          iconBgClass="bg-[#EAE6F8] text-[#4A3E8F]"
          subtitle={t('doorstepPickupsSub')}
        />
      </div>

      {/* User Retention & Impact Supporting Line */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white/70 border border-gray-100 rounded-2xl text-xs text-[#526056]">
        <Leaf className="w-4 h-4 text-[#136B3B] flex-shrink-0" />
        <p className="font-medium text-[#2C3E30]">
          {t('householdImpactNote')}
        </p>
      </div>
    </section>
  );
}
