'use client';

import React, { useState, useEffect } from 'react';
import { IndianFlag } from './GovLogos';
import { Volume2, Moon, Sun, Globe } from 'lucide-react';

export default function GovTopBar() {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [highContrast, setHighContrast] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const handleFontSize = (size: 'sm' | 'base' | 'lg') => {
    setFontSize(size);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('text-size-sm', 'text-size-base', 'text-size-lg');
      root.classList.add(`text-size-${size}`);
    }
  };

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast');
    }
  };

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scrapmax_lang_change', { detail: { lang: next } }));
    }
  };

  return (
    <div className="w-full bg-[#1A2530] text-gray-200 text-xs border-b border-gray-700/50 relative z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
        
        {/* Left: Indian Flag + Official Government of India & Ministry Attribution */}
        <div className="flex items-center gap-2.5 min-w-0">
          <IndianFlag className="h-3.5 w-5 rounded-xs ring-1 ring-white/20" />
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide truncate">
            <span className="font-bold text-white">भारत सरकार</span>
            <span className="text-gray-400">|</span>
            <span className="hidden sm:inline text-gray-300">Government of India</span>
            <span className="hidden lg:inline text-gray-400">·</span>
            <span className="hidden lg:inline text-amber-300/90 font-medium">
              पर्यावरण, वन और जलवायु परिवर्तन मंत्रालय (MoEF&CC)
            </span>
          </div>
        </div>

        {/* Right: GIGW Accessibility & Utility Bar */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          
          {/* Skip to Main Content (Screen reader / GIGW compliance) */}
          <a
            href="#main-content"
            className="hidden md:inline-block px-2 py-0.5 rounded text-gray-300 hover:text-white hover:bg-white/10 transition"
          >
            मुख्य सामग्री पर जाएं | Skip to Content
          </a>

          <span className="hidden md:inline text-gray-600">|</span>

          {/* Font Size Adjusters: A- | A | A+ */}
          <div className="flex items-center bg-white/5 rounded px-1.5 py-0.5 border border-white/10 gap-1 font-mono font-bold">
            <button
              type="button"
              onClick={() => handleFontSize('sm')}
              title="Decrease Font Size"
              className={`px-1 rounded hover:bg-white/20 transition ${fontSize === 'sm' ? 'text-amber-400' : 'text-gray-300'}`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => handleFontSize('base')}
              title="Standard Font Size"
              className={`px-1 rounded hover:bg-white/20 transition ${fontSize === 'base' ? 'text-amber-400' : 'text-gray-300'}`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => handleFontSize('lg')}
              title="Increase Font Size"
              className={`px-1 rounded hover:bg-white/20 transition ${fontSize === 'lg' ? 'text-amber-400' : 'text-gray-300'}`}
            >
              A+
            </button>
          </div>

          <span className="hidden sm:inline text-gray-600">|</span>

          {/* High Contrast Mode */}
          <button
            type="button"
            onClick={toggleContrast}
            title="Toggle High Contrast Mode"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition"
          >
            {highContrast ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3" />}
            <span className="hidden sm:inline text-[10px] font-bold">
              {highContrast ? 'Standard' : 'Contrast'}
            </span>
          </button>

          <span className="text-gray-600">|</span>

          {/* Bilingual Language Switcher: English / हिन्दी */}
          <button
            type="button"
            onClick={toggleLanguage}
            title="Switch Language / भाषा बदलें"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white transition font-bold"
          >
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Tricolor Ribbon: Deep Saffron (Top), White (Middle), Green (Bottom) */}
      <div className="w-full flex h-[3px]">
        <div className="flex-1 bg-[#FF671F]" />
        <div className="flex-1 bg-[#FFFFFF]" />
        <div className="flex-1 bg-[#046A38]" />
      </div>
    </div>
  );
}
