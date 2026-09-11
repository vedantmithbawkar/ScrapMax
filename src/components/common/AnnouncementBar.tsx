'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function NewStarburstBadge() {
  return (
    <span className="inline-flex items-center justify-center relative shrink-0 mr-2 select-none">
      <svg
        viewBox="0 0 40 40"
        className="w-5 h-5 text-[#E60000] drop-shadow-[0_0_3px_rgba(255,0,0,0.6)] animate-pulse fill-current"
        aria-hidden="true"
      >
        {/* 16-pointed jagged starburst sticker */}
        <path d="M20 0 L24 9 L34 4 L30 14 L40 18 L32 24 L37 34 L27 31 L22 40 L16 32 L7 37 L10 27 L0 22 L9 16 L3 7 L14 10 Z" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white tracking-tighter uppercase leading-none">
        NEW
      </span>
    </span>
  );
}

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-black text-white border-t-2 border-[#001f4d] text-xs py-2 px-3 sm:px-6 relative z-30 shadow-sm overflow-hidden select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Continuous Scrolling Ticker */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="animate-marquee flex items-center gap-12 font-bold text-[12.5px] tracking-wide text-white">
            
            {/* Primary message (Exact match to the screenshot) */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                If any SPOC is facing an issue with login, they can reset their password themselves by using the &ldquo;Forgot Password&rdquo; option on the SPOC login page
              </span>
            </span>

            {/* Secondary SIH Announcement */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                Smart India Hackathon (SIH): Real-time doorstep recyclable scrap mobilization, transparent digital weighing &amp; instant UPI DBT are active.
              </span>
            </span>

            {/* Third Support Announcement */}
            <span className="inline-flex items-center">
              <NewStarburstBadge />
              <span>
                Authorized Kabadiwalas can verify digital scales and view active ward routes in the Collector Portal. Toll-free helpline: 1969.
              </span>
            </span>

          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          aria-label="Dismiss Announcement"
          className="text-gray-400 hover:text-white p-0.5 rounded transition text-xs shrink-0"
        >
          ✕
        </button>

      </div>
    </div>
  );
}
