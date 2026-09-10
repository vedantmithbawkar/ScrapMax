'use client';

import { useEffect } from 'react';

export default function PwaRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('ScrapMax PWA ServiceWorker registered with scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('ScrapMax ServiceWorker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}
