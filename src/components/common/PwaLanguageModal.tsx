'use client';

import React, { useEffect, useState } from 'react';
import {
  Globe2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Languages,
} from 'lucide-react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getCurrentLanguage,
  setAppLanguage,
  useTranslation,
} from '@/lib/i18n';

export default function PwaLanguageModal() {
  const { t, language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has previously set language preference
    const hasSet = localStorage.getItem('scrapmax_language_set');
    if (!hasSet) {
      // First-time PWA / web visitor: open the language onboarding modal
      setIsFirstTime(true);
      setIsOpen(true);
    }

    const handleOpen = () => {
      setIsFirstTime(false);
      setIsOpen(true);
    };

    window.addEventListener('scrapmax_open_language_modal', handleOpen);
    return () => {
      window.removeEventListener('scrapmax_open_language_modal', handleOpen);
    };
  }, []);

  if (!mounted || !isOpen) return null;

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    localStorage.setItem('scrapmax_language_set', 'true');
    setIsOpen(false);
  };

  const primaryLanguages = SUPPORTED_LANGUAGES.filter((l) =>
    ['English', 'Hindi', 'Marathi', 'Gujarati'].includes(l.code)
  );

  const secondaryLanguages = SUPPORTED_LANGUAGES.filter(
    (l) => !['English', 'Hindi', 'Marathi', 'Gujarati'].includes(l.code)
  );

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Gradient */}
        <div className="bg-gradient-to-r from-[#136B3B] via-[#0F5730] to-[#0A3D22] p-6 text-white relative">
          {!isFirstTime && (
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-emerald-300 backdrop-blur-xs border border-white/20 shadow-inner">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">
                  Choose Language
                </h2>
                <span className="text-[11px] font-bold bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 px-2 py-0.5 rounded-full">
                  PWA
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                भाषा चुनें • भाषा निवडा • ભાષા પસંદ કરો
              </p>
            </div>
          </div>

          <p className="text-xs text-emerald-100/80 leading-relaxed mt-2">
            Select your preferred language to use the entire ScrapMax app, request pickups, and view live market scrap rates.
          </p>
        </div>

        {/* Language Selection Grid */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2.5">
              Primary Regional &amp; Global Languages
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {primaryLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`relative p-3.5 rounded-2xl border text-left transition flex items-center justify-between group ${
                      isSelected
                        ? 'border-[#136B3B] bg-emerald-50/70 shadow-xs ring-2 ring-[#136B3B]/20'
                        : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none" role="img" aria-label={lang.label}>
                        {lang.flag}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-900 leading-none">
                            {lang.nativeName}
                          </p>
                          <span className="text-[10px] font-mono font-bold text-gray-400">
                            {lang.short}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {lang.welcome}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition shrink-0 ${
                        isSelected
                          ? 'bg-[#136B3B] text-white shadow-2xs'
                          : 'border border-gray-300 text-transparent group-hover:border-emerald-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other Regional Languages */}
          {secondaryLanguages.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
                Other Languages
              </span>
              <div className="grid grid-cols-3 gap-2">
                {secondaryLanguages.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-[#136B3B] bg-emerald-50 text-[#136B3B]'
                          : 'border-gray-200 text-gray-700 hover:border-emerald-300'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant dynamic translation</span>
          </span>

          <button
            type="button"
            onClick={() => handleSelectLanguage(language)}
            className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
          >
            <span>{t('pwaContinue')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
