'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
  role?: 'household' | 'collector';
}

export default function BottomNav({ role = 'household' }: BottomNavProps) {
  const pathname = usePathname();

  const isHousehold = role === 'household';

  const tabs = isHousehold
    ? [
        {
          label: 'Home',
          href: '/household',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          ),
          isActive: pathname === '/household',
        },
        {
          label: 'Pickup',
          href: '/household/request-pickup',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13-10.5h-3V4H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h1.1c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2h4.2c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2H21c1.1 0 2-.9 2-2v-5l-3-5zm-.5 4.5l1.8 2.5H17V12.5h2.5z" />
            </svg>
          ),
          isActive: pathname === '/household/request-pickup',
        },
        {
          label: 'History',
          href: '/household/history',
          icon: (active: boolean) => (
            <svg
              className={`w-5 h-5 ${active ? 'stroke-[2.3] text-[#191C1E]' : 'stroke-2 text-[#526056]'}`}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
          isActive: pathname === '/household/history',
        },
        {
          label: 'Profile',
          href: '/household/profile',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          ),
          isActive: pathname === '/household/profile',
        },
      ]
    : [
        {
          label: 'Pickups',
          href: '/collector',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13-10.5h-3V4H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h1.1c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2h4.2c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2H21c1.1 0 2-.9 2-2v-5l-3-5zm-.5 4.5l1.8 2.5H17V12.5h2.5z" />
            </svg>
          ),
          isActive: pathname === '/collector',
        },
        {
          label: 'Map Route',
          href: '/collector/map',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          ),
          isActive: pathname === '/collector/map',
        },
        {
          label: 'Profile',
          href: '/household/profile',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          ),
          isActive: pathname === '/household/profile',
        },
      ];

  return (
    <nav
      aria-label="Main Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] pt-2 pb-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((tab) => {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center group py-0.5 min-w-[60px] touch-feedback"
            >
              {tab.isActive ? (
                <div className="w-14 h-8 rounded-full bg-[#EAE6F8] flex items-center justify-center transition-all">
                  {tab.icon(true)}
                </div>
              ) : (
                <div className="w-14 h-8 rounded-full flex items-center justify-center transition-all group-hover:bg-[#F2F4F6]">
                  {tab.icon(false)}
                </div>
              )}
              <span
                className={`text-[11px] mt-0.5 tracking-tight ${
                  tab.isActive ? 'font-bold text-[#136B3B]' : 'font-medium text-[#6B7280]'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
