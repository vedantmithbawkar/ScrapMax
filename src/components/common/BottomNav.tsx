'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useTranslation } from '@/lib/i18n';
import { UserRole } from '@/types';

interface BottomNavProps {
  role?: UserRole;
}

export default function BottomNav({ role = 'household' }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isHousehold = role === 'household';
  const isAdmin = role === 'admin';

  const tabs = isAdmin
    ? [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
          ),
          isActive: pathname === '/admin',
        },
        {
          label: 'Users',
          href: '/admin/users',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          ),
          isActive: pathname === '/admin/users',
        },
        {
          label: 'Pickups',
          href: '/admin/pickups',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13-10.5h-3V4H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h1.1c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2h4.2c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2H21c1.1 0 2-.9 2-2v-5l-3-5zm-.5 4.5l1.8 2.5H17V12.5h2.5z" />
            </svg>
          ),
          isActive: pathname === '/admin/pickups',
        },
        {
          label: 'Reports',
          href: '/admin/reports',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
          ),
          isActive: pathname.startsWith('/admin/reports'),
        },
        {
          label: 'Settings',
          href: '/admin/settings',
          icon: (active: boolean) => (
            <svg
              className={`w-5 h-5 ${active ? 'stroke-[2.3] text-[#191C1E]' : 'stroke-2 text-[#526056]'}`}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
          isActive: pathname === '/admin/settings',
        },
      ]
    : isHousehold
    ? [
        {
          label: t('navHome'),
          href: '/household',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          ),
          isActive: pathname === '/household',
        },
        {
          label: t('navPickup'),
          href: '/household/request-pickup',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M18 18.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm-11 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm13-10.5h-3V4H3c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h1.1c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2h4.2c.4 1.2 1.5 2 2.9 2s2.5-.8 2.9-2H21c1.1 0 2-.9 2-2v-5l-3-5zm-.5 4.5l1.8 2.5H17V12.5h2.5z" />
            </svg>
          ),
          isActive: pathname === '/household/request-pickup',
        },
        {
          label: t('navTrack'),
          href: '/household/track',
          icon: (active: boolean) => (
            <svg
              className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`}
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          ),
          isActive: pathname.startsWith('/household/track'),
        },
        {
          label: 'Stores',
          href: '/stores',
          icon: (active: boolean) => (
            <svg className={`w-5 h-5 ${active ? 'fill-current text-[#191C1E]' : 'fill-current text-[#526056]'}`} viewBox="0 0 24 24">
              <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
            </svg>
          ),
          isActive: pathname === '/stores',
        },
        {
          label: t('navHistory'),
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
          label: t('navProfile'),
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
          label: 'Chat',
          href: '/collector/chat',
          icon: (active: boolean) => (
            <svg
              className={`w-5 h-5 ${active ? 'stroke-[2.3] text-[#191C1E]' : 'stroke-2 text-[#526056]'}`}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          ),
          isActive: pathname.startsWith('/collector/chat'),
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
              key={tab.label}
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
