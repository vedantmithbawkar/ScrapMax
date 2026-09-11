'use client';

import React, { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getCurrentLanguage, ISO_LANG_MAP, SupportedLanguage } from '@/lib/i18n';

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export default function GlobalLanguageBridge() {
  const pathname = usePathname();

  const applyLang = useCallback((lang: SupportedLanguage) => {
    if (typeof window === 'undefined') return;

    const iso = ISO_LANG_MAP[lang] || 'en';
    document.documentElement.lang = iso;

    try {
      const cookieVal = `/en/${iso}`;
      document.cookie = `googtrans=${cookieVal}; path=/; max-age=31536000;`;
      const domain = window.location.hostname;
      if (domain && domain !== 'localhost') {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${domain}; max-age=31536000;`;
      }

      // Trigger Google Translate select element if available
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select) {
        if (select.value !== iso) {
          select.value = iso;
        }
        select.dispatchEvent(new Event('change'));
      }
    } catch {
      // ignore
    }
  }, []);

  // Initialize Google Translate script once
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,hi,mr,gu,kn,ta,te',
              autoDisplay: false,
            },
            'google_translate_element'
          );

          setTimeout(() => {
            applyLang(getCurrentLanguage());
          }, 300);
        }
      } catch {
        // ignore
      }
    };

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }

    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      if (customEvent.detail) {
        applyLang(customEvent.detail);
      }
    };

    window.addEventListener('scrapmax_language_change', handleLangChange);
    return () => window.removeEventListener('scrapmax_language_change', handleLangChange);
  }, [applyLang]);

  // Re-apply language on EVERY page transition / route change (App Router SPA navigation)
  useEffect(() => {
    const currentLang = getCurrentLanguage();
    applyLang(currentLang);

    // Staggered triggers to catch React async component rendering
    const timers = [
      setTimeout(() => applyLang(currentLang), 100),
      setTimeout(() => applyLang(currentLang), 350),
      setTimeout(() => applyLang(currentLang), 800),
      setTimeout(() => applyLang(currentLang), 1500),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [pathname, applyLang]);

  return (
    <div
      id="google_translate_element"
      style={{ display: 'none', position: 'absolute', top: '-9999px', left: '-9999px' }}
      aria-hidden="true"
    />
  );
}
