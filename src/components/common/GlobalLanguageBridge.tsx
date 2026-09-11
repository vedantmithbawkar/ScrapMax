'use client';

import React, { useEffect } from 'react';
import { getCurrentLanguage, ISO_LANG_MAP, SupportedLanguage } from '@/lib/i18n';

export default function GlobalLanguageBridge() {
  useEffect(() => {
    const applyLang = (lang: SupportedLanguage) => {
      const iso = ISO_LANG_MAP[lang] || 'en';
      document.documentElement.lang = iso;

      try {
        const domain = window.location.hostname;
        const cookieVal = `/en/${iso}`;
        document.cookie = `googtrans=${cookieVal}; path=/;`;
        if (domain && domain !== 'localhost') {
          document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain};`;
        }
      } catch {
        // ignore
      }
    };

    // Initialize with current saved language
    applyLang(getCurrentLanguage());

    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail) {
        applyLang(customEvent.detail);
      }
    };

    window.addEventListener('scrapmax_language_change', handleLangChange);
    return () => window.removeEventListener('scrapmax_language_change', handleLangChange);
  }, []);

  return null;
}
