'use client';

import React from 'react';
import { IndianRupee, PackageCheck, Scale, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import { CollectorDashboardStats } from '@/types/dashboard';
import { formatWeight, formatCurrency, formatCount } from '@/lib/dashboard-service';
import { useTranslation } from '@/lib/i18n';

interface CollectorEarningsViewProps {
  stats: CollectorDashboardStats;
  isDemo?: boolean;
}

export default function CollectorEarningsView({ stats, isDemo }: CollectorEarningsViewProps) {
  const { t } = useTranslation();
  const earnedText = formatCurrency(stats.totalEarned);
  const pickupsText = formatCount(stats.completedPickups);
  const collectedText = formatWeight(stats.totalCollectedKg);

  return (
    <section
      aria-labelledby="collector-earnings-title"
      className="space-y-3"
      data-purpose="collector-recycling-dashboard"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2
            id="collector-earnings-title"
            className="text-lg sm:text-xl font-extrabold text-[#191C1E] tracking-tight"
          >
            {t('collectorEarningsTitle')}
          </h2>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Total Earned */}
        <StatCard
          label={t('totalEarnedLabel')}
          value={earnedText}
          icon={<IndianRupee className="w-5 h-5 stroke-[2.2]" />}
          iconBgClass="bg-emerald-50 text-[#136B3B]"
          subtitle={t('settledDealsSub')}
        />

        {/* 2. Pickups Completed */}
        <StatCard
          label={t('completedPickupsLabel')}
          value={pickupsText}
          icon={<PackageCheck className="w-5 h-5 stroke-[2.2]" />}
          iconBgClass="bg-[#EAE6F8] text-[#4A3E8F]"
          subtitle={t('fulfilledRequestsSub')}
        />

        {/* 3. Total Collected */}
        <StatCard
          label={t('totalCollectedLabel')}
          value={collectedText}
          icon={<Scale className="w-5 h-5 stroke-[2.2]" />}
          iconBgClass="bg-[#E6F4EA] text-[#136B3B]"
          subtitle={t('verifiedWeightSub')}
        />
      </div>

      {/* User Retention & Impact Supporting Line */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white/70 border border-gray-100 rounded-2xl text-xs text-[#526056]">
        <TrendingUp className="w-4 h-4 text-[#136B3B] flex-shrink-0" />
        <p className="font-medium text-[#2C3E30]">
          {t('everyPickupAdds')}
        </p>
      </div>
    </section>
  );
}
