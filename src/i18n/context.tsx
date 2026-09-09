'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '@/messages/en.json';
import hi from '@/messages/hi.json';
import mr from '@/messages/mr.json';

export type SupportedLocale = 'en' | 'hi' | 'mr';

const dictionaries: Record<SupportedLocale, Record<string, string | Record<string, string>>> = {
  en,
  hi,
  mr,
};

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string | null {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem('scrapmax_locale') as SupportedLocale;
      if (savedLocale && ['en', 'hi', 'mr'].includes(savedLocale)) {
        // Client-only hydration-safe sync: localStorage is unavailable on the server,
        // so we intentionally read and apply the persisted locale after mount only.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocaleState(savedLocale);
      }
    } catch {
      // localStorage fallback
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem('scrapmax_locale', newLocale);
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    } catch {
      // cookie fallback
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const primaryDict = dictionaries[locale] || dictionaries.en;
    let translation = getNestedValue(primaryDict, key);

    // Fallback to English if translation is missing in primary dictionary
    if (!translation && locale !== 'en') {
      translation = getNestedValue(dictionaries.en, key);
    }

    if (!translation) {
      return key; // return key as fallback if missing in all dicts
    }

    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        translation = translation!.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
      });
    }

    return translation;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
