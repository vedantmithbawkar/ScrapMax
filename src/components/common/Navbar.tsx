'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Recycle, LogOut, MapPin, Truck, History, PlusCircle, Bell, Store, Shield, Users, ClipboardList, Settings, Landmark } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import NotificationDrawer from '@/components/common/NotificationDrawer';
import {
  getUnreadNotificationsCount,
  subscribeToNotifications,
} from '@/lib/notification-service';
import GovTopBar from '@/components/gov/GovTopBar';
import GovTicker from '@/components/gov/GovTicker';
import { EmblemOfIndia, SwachhBharatLogo, SihBadge } from '@/components/gov/GovLogos';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(getUnreadNotificationsCount());
    const unsubscribe = subscribeToNotifications(() => {
      setUnreadCount(getUnreadNotificationsCount());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function checkDb() {
      try {
        const supabase = createClient();
        const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' });
        setDbConnected(!error);
      } catch {
        setDbConnected(false);
      }
    }
    checkDb();
  }, []);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setProfile(data as UserProfile);
        } else {
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Citizen User',
            role: (user.user_metadata?.role as 'household' | 'collector') || 'household',
          });
        }
      }
    }
    loadUser();
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.push('/login');
  };

  const isAdmin = pathname.startsWith('/admin') || profile?.role === 'admin';

  return (
    <>
      {/* 1. Official Government of India Top Accessibility & Utility Bar */}
      <GovTopBar />

      {/* 2. Main Portal Government Header */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-[#D8E2DC] text-[#191C1E] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          
          {/* Brand & State Emblem of India */}
          <div className="flex items-center gap-3">
            {/* Ashoka Lion Capital (State Emblem) */}
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-95 transition" title="National Circular Recycling Portal">
              <EmblemOfIndia className="h-11 sm:h-12" />

              <div className="hidden sm:block h-8 w-[1px] bg-gray-300" />

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-[#046A38] leading-none">
                    ScrapMax
                  </span>
                  <span className="text-xs font-bold text-[#FF671F] font-serif">
                    स्क्रैपमैक्स
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#526056] tracking-tight leading-tight mt-0.5">
                  National Circular Economy &amp; EPR Portal
                </span>
                <span className="text-[9px] font-semibold text-[#8C9B91] leading-none">
                  MoEF&amp;CC · Swachh Bharat Mission (Urban)
                </span>
              </div>
            </Link>

            {/* Smart India Hackathon badge */}
            <div className="hidden xl:block ml-2">
              <SihBadge className="h-8" />
            </div>

            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Municipal Admin Console</span>
              </span>
            )}
          </div>

          {/* Dynamic Government Navigation Links */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Swachh Bharat Gandhi Glasses (visible on medium+ screens) */}
            <div className="hidden lg:block mr-2">
              <SwachhBharatLogo className="h-7" />
            </div>

            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname === '/admin'
                      ? 'bg-[#E6F4EA] text-[#046A38] border-[#A6D5B8]'
                      : 'text-[#526056] border-transparent hover:bg-gray-100 hover:text-[#191C1E]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-700" />
                  <span>Overview</span>
                </Link>
                <Link
                  href="/admin/pickups"
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname === '/admin/pickups'
                      ? 'bg-[#E6F4EA] text-[#046A38] border-[#A6D5B8]'
                      : 'text-[#526056] border-transparent hover:bg-gray-100 hover:text-[#191C1E]'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pickups</span>
                </Link>
                <Link
                  href="/admin/users"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname === '/admin/users'
                      ? 'bg-[#E6F4EA] text-[#046A38] border-[#A6D5B8]'
                      : 'text-[#526056] border-transparent hover:bg-gray-100 hover:text-[#191C1E]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Users</span>
                </Link>
                <Link
                  href="/admin/reports"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname.startsWith('/admin/reports')
                      ? 'bg-[#E6F4EA] text-[#046A38] border-[#A6D5B8]'
                      : 'text-[#526056] border-transparent hover:bg-gray-100 hover:text-[#191C1E]'
                  }`}
                >
                  <ClipboardList className="w-3.5 h-3.5 text-red-600" />
                  <span>Reports</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname === '/admin/settings'
                      ? 'bg-[#E6F4EA] text-[#046A38] border-[#A6D5B8]'
                      : 'text-[#526056] border-transparent hover:bg-gray-100 hover:text-[#191C1E]'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 text-gray-700" />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <>
                {/* Citizen Services Tab */}
                <Link
                  href="/household"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname.startsWith('/household')
                      ? 'bg-[#E6F4EA] text-[#046A38] border-[#A6D5B8]'
                      : 'text-[#526056] border-transparent hover:bg-gray-100 hover:text-[#191C1E]'
                  }`}
                >
                  <Recycle className="w-3.5 h-3.5 text-[#046A38]" />
                  <span>Citizen Portal</span>
                </Link>

                {/* Collector Network Tab */}
                <Link
                  href="/collector"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname.startsWith('/collector')
                      ? 'bg-[#E6F4EA] text-[#046A38] border-[#A6D5B8]'
                      : 'text-[#526056] border-transparent hover:bg-gray-100 hover:text-[#191C1E]'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-[#FF671F]" />
                  <span className="hidden sm:inline">Kabadiwala Portal</span>
                </Link>

                {/* Municipal Admin Portal Link */}
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname.startsWith('/admin')
                      ? 'bg-purple-100 text-purple-900 border-purple-300'
                      : 'text-purple-700 border-transparent hover:bg-purple-50'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5 text-purple-700" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Government Alerts & Notifications"
              className="relative p-2 rounded-lg text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6] transition"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF671F] text-[9px] font-bold text-white shadow-2xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile or Login */}
            {profile ? (
              <div className="flex items-center gap-2 pl-1 border-l border-gray-200">
                <Link
                  href={profile.role === 'collector' ? '/collector' : '/household/profile'}
                  className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-100 transition text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-[#046A38] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                    {(profile.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col">
                    <span className="text-xs font-bold text-[#191C1E] leading-none truncate max-w-[100px]">
                      {profile.full_name || 'Citizen'}
                    </span>
                    <span className="text-[9px] text-[#046A38] font-bold uppercase mt-0.5">
                      {profile.role || 'Citizen'}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out of portal"
                  className="p-1.5 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-1">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#046A38] hover:bg-[#E6F4EA] border border-[#A6D5B8] transition"
                >
                  Login / साइन इन
                </Link>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* 3. Official Government Notification Ticker */}
      <GovTicker />

      {/* Slide-out notification drawer */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
