'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download } from 'lucide-react';

export function NewStarburstBadge() {
  return (
    <span className="inline-flex items-center justify-center relative shrink-0 mr-2 select-none">
      <svg
        viewBox="0 0 40 40"
        className="w-5 h-5 text-[#E60000] drop-shadow-[0_0_4px_rgba(230,0,0,0.7)] animate-pulse fill-current"
        aria-hidden="true"
      >
        {/* 16-pointed jagged starburst sticker */}
        <path d="M20 0 L24 9 L34 4 L30 14 L40 18 L32 24 L37 34 L27 31 L22 40 L16 32 L7 37 L10 27 L0 22 L9 16 L3 7 L14 10 Z" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-black text-white tracking-tighter uppercase leading-none">
        NEW
      </span>
    </span>
  );
}

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    } else {
      alert('To install ScrapMax App: Open your browser menu (⋮ or Share) and tap "Install app" or "Add to Home Screen".');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-black text-white border-t-2 border-[#001f4d] text-xs py-2 px-3 sm:px-6 relative z-30 shadow-sm overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Continuous Scrolling Ticker */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="animate-marquee flex items-center gap-10 font-bold text-[12.5px] tracking-wide text-white">
            
            {/* 1. ScrapMax PWA Install & Offline Feature */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                ScrapMax PWA: Install on your phone or desktop for instant 1-click door-step recyclable scrap booking, offline access &amp; live alerts!{' '}
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="inline-flex items-center gap-1 text-[#38EF7D] underline font-extrabold hover:text-white transition ml-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install App
                </button>
              </span>
            </span>

            {/* 2. Real-Time 2-Way Chat Feature */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                Live Coordination Chat: Real-time two-way messaging between Household and Kabadiwala is now active with instant status updates!{' '}
                <Link href="/household" className="text-[#38EF7D] underline hover:text-white transition ml-1">
                  Open Chat
                </Link>
              </span>
            </span>

            {/* 3. Instant Digital Weighing & UPI DBT Receipt */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                Digital Recycling Receipts: Every pickup includes verified digital scale weighing, itemized rates &amp; instant direct UPI payment settlement!
              </span>
            </span>

            {/* 4. Public Swachhata Grievance Portal */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                Spot illegal scrap or garbage dumping in your area? Upload geo-tagged photos directly to municipal administrators.{' '}
                <Link href="/household/report" className="text-[#FFB347] underline hover:text-white transition ml-1">
                  Report Problem
                </Link>
              </span>
            </span>

            {/* 5. Collector Route Map Feature */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                Authorized Kabadiwalas: Interactive GPS live map with optimized scrap collection routes &amp; verified digital scales.{' '}
                <Link href="/collector/map" className="text-[#38EF7D] underline hover:text-white transition ml-1">
                  View Map
                </Link>
              </span>
            </span>

          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          title="Dismiss Announcement"
          className="text-gray-400 hover:text-white p-1 rounded transition text-xs shrink-0 font-bold"
        >
          ✕
        </button>

      </div>
    </div>
  );
}
