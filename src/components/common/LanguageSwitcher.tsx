'use client';

import React from 'react';
import { useI18n, SupportedLocale } from '@/i18n/context';
import { Languages } from 'lucide-react';

const LOCALES: { code: SupportedLocale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="inline-flex items-center gap-1 bg-[#F8FAF9] p-1 rounded-2xl border border-gray-200 shadow-2xs">
      <div className="pl-2 pr-1 text-[#136B3B] flex items-center">
        <Languages className="w-3.5 h-3.5" />
      </div>

      <div className="flex items-center gap-1">
        {LOCALES.map((loc) => {
          const isActive = locale === loc.code;
          return (
            <button
              key={loc.code}
              type="button"
              onClick={() => setLocale(loc.code)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition touch-feedback ${
                isActive
                  ? 'bg-[#136B3B] text-white shadow-xs'
                  : 'text-[#526056] hover:text-[#191C1E] hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{loc.flag}</span>
              <span>{loc.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
