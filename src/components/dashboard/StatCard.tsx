import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBgClass?: string;
  subtitle?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  iconBgClass = 'bg-[#E6F4EA] text-[#136B3B]',
  subtitle,
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:border-[#A6D5B8] hover:shadow-md transition-all flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-bold text-[#526056]">{label}</span>
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 select-none ${iconBgClass}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl sm:text-[28px] font-black tracking-tight text-[#191C1E] leading-none">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-[#6B7280] font-medium mt-1.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
