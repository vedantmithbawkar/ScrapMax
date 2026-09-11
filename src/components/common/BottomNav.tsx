'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { UserRole } from '@/types';
import {
  Home,
  Truck,
  MapPin,
  Sparkles,
  Layers,
  FileCheck2,
  Factory,
  ShieldCheck,
  User,
  PlusCircle,
  Inbox,
  QrCode,
  MessageSquare,
  Users,
  ClipboardList,
  Settings,
  Store,
  History,
} from 'lucide-react';

interface BottomNavProps {
  role?: UserRole;
}

export default function BottomNav({ role = 'household' }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isAdmin = role === 'admin' || (pathname.startsWith('/admin') && pathname !== '/admin/login');

  let tabs: Array<{
    label: string;
    href: string;
    icon: (active: boolean) => React.ReactNode;
    isActive: boolean;
  }> = [];

  if (isAdmin) {
    tabs = [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: (active: boolean) => (
          <Layers className={`w-5 h-5 ${active ? 'text-purple-700' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/admin',
      },
      {
        label: 'Users',
        href: '/admin/users',
        icon: (active: boolean) => (
          <Users className={`w-5 h-5 ${active ? 'text-purple-700' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/admin/users',
      },
      {
        label: 'Pickups',
        href: '/admin/pickups',
        icon: (active: boolean) => (
          <Truck className={`w-5 h-5 ${active ? 'text-purple-700' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/admin/pickups',
      },
      {
        label: 'Reports',
        href: '/admin/reports',
        icon: (active: boolean) => (
          <ClipboardList className={`w-5 h-5 ${active ? 'text-purple-700' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname.startsWith('/admin/reports'),
      },
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: (active: boolean) => (
          <Settings className={`w-5 h-5 ${active ? 'text-purple-700' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/admin/settings',
      },
    ];
  } else if (role === 'recycler') {
    tabs = [
      {
        label: 'Dashboard',
        href: '/recycler',
        icon: (active: boolean) => (
          <Layers className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/recycler',
      },
      {
        label: 'Demands',
        href: '/recycler/requirements',
        icon: (active: boolean) => (
          <PlusCircle className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname.startsWith('/recycler/requirements'),
      },
      {
        label: 'Offers',
        href: '/recycler/offers',
        icon: (active: boolean) => (
          <Inbox className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/recycler/offers',
      },
      {
        label: 'Traceability',
        href: '/recycler/traceability',
        icon: (active: boolean) => (
          <QrCode className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/recycler/traceability',
      },
      {
        label: 'Facility',
        href: '/recycler/profile',
        icon: (active: boolean) => (
          <Factory className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/recycler/profile',
      },
    ];
  } else if (role === 'collector') {
    tabs = [
      {
        label: 'Pickups',
        href: '/collector',
        icon: (active: boolean) => (
          <Truck className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/collector',
      },
      {
        label: 'Find Buyers',
        href: '/collector/find-buyers',
        icon: (active: boolean) => (
          <Sparkles className={`w-5 h-5 ${active ? 'text-amber-600' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/collector/find-buyers',
      },
      {
        label: 'My Offers',
        href: '/collector/offers',
        icon: (active: boolean) => (
          <FileCheck2 className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/collector/offers',
      },
      {
        label: 'Map Route',
        href: '/collector/map',
        icon: (active: boolean) => (
          <MapPin className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/collector/map',
      },
      {
        label: 'Chat',
        href: '/collector/chat',
        icon: (active: boolean) => (
          <MessageSquare className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname.startsWith('/collector/chat'),
      },
      {
        label: 'Profile',
        href: '/collector/profile',
        icon: (active: boolean) => (
          <User className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/collector/profile',
      },
    ];
  } else {
    // Household / Citizen tabs
    tabs = [
      {
        label: t('navHome'),
        href: '/household',
        icon: (active: boolean) => (
          <Home className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/household',
      },
      {
        label: t('navPickup'),
        href: '/household/request-pickup',
        icon: (active: boolean) => (
          <PlusCircle className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/household/request-pickup',
      },
      {
        label: t('navTrack'),
        href: '/household/track',
        icon: (active: boolean) => (
          <MapPin className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname.startsWith('/household/track'),
      },
      {
        label: 'Stores',
        href: '/stores',
        icon: (active: boolean) => (
          <Store className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/stores',
      },
      {
        label: t('navHistory'),
        href: '/household/history',
        icon: (active: boolean) => (
          <History className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/household/history',
      },
      {
        label: t('navProfile'),
        href: '/household/profile',
        icon: (active: boolean) => (
          <User className={`w-5 h-5 ${active ? 'text-[#136B3B]' : 'text-[#6B7280]'}`} />
        ),
        isActive: pathname === '/household/profile',
      },
    ];
  }

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] pt-1.5 pb-3 px-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
    >
      <div className="max-w-md mx-auto flex justify-around items-center">
        {tabs.map((tab) => {
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex flex-col items-center group py-0.5 min-w-[50px] touch-feedback"
            >
              <div
                className={`w-11 h-7 rounded-full flex items-center justify-center transition-all ${
                  tab.isActive ? 'bg-[#EAE6F8]' : 'group-hover:bg-[#F2F4F6]'
                }`}
              >
                {tab.icon(tab.isActive)}
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight ${
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
