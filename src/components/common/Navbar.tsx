'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Recycle, LogOut, MapPin, Truck, History, PlusCircle, Bell, Store, Shield, Users, ClipboardList, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import NotificationDrawer from '@/components/common/NotificationDrawer';
import {
  getUnreadNotificationsCount,
  subscribeToNotifications,
} from '@/lib/notification-service';

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
            full_name: user.user_metadata?.full_name || 'Sahil',
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] text-[#191C1E] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & DB status badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-95 transition">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold shadow-xs">
                <Recycle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-[#136B3B] leading-none">ScrapMax</span>
                <span className="text-[10px] font-semibold text-[#6B7280] tracking-wider uppercase mt-0.5">Circular Recycling</span>
              </div>
            </Link>

            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Console</span>
              </span>
            )}

            {!isAdmin && dbConnected === true && (
              <span
                title="Connected to live Supabase PostgreSQL database"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] animate-pulse"></span>
                <span>Supabase DB Live</span>
              </span>
            )}
          </div>

          {/* Dynamic Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin'
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-700" />
                  <span>Overview</span>
                </Link>
                <Link
                  href="/admin/pickups"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin/pickups'
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Pickups</span>
                </Link>
                <Link
                  href="/admin/users"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin/users'
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Users</span>
                </Link>
                <Link
                  href="/admin/reports"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin/reports')
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <ClipboardList className="w-4 h-4 text-red-600" />
                  <span>Reports</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin/settings'
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <Settings className="w-4 h-4 text-gray-700" />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <>
                {/* Store Map Link (Accessible to all non-admins) */}
                <Link
                  href="/stores"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/stores'
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <Store className="w-4 h-4 text-[#136B3B]" />
                  <span className="hidden sm:inline">Store Map</span>
                </Link>

                {/* Admin Portal Link */}
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin')
                      ? 'bg-[#F3E8FF] text-purple-900'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>

                {profile?.role === 'household' && (
                  <>
                    <Link
                      href="/household"
                      className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        pathname === '/household'
                          ? 'bg-[#EAE6F8] text-[#191C1E]'
                          : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/household/history"
                      className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        pathname === '/household/history'
                          ? 'bg-[#EAE6F8] text-[#191C1E]'
                          : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      <span>Activity</span>
                    </Link>
                    <Link
                      href="/household/request-pickup"
                      className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#136B3B] hover:bg-[#0F5730] text-white shadow-sm transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Request Pickup</span>
                    </Link>
                  </>
                )}

                {profile?.role === 'collector' && (
                  <>
                    <Link
                      href="/collector"
                      className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        pathname === '/collector'
                          ? 'bg-[#EAE6F8] text-[#191C1E]'
                          : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span>Available Pickups</span>
                    </Link>
                    <Link
                      href="/collector/map"
                      className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                        pathname === '/collector/map'
                          ? 'bg-[#EAE6F8] text-[#191C1E]'
                          : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Map Route</span>
                    </Link>
                  </>
                )}
              </>
            )}

            {/* Profile Info Badge */}
            {profile ? (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E5E7EB]">
                <Link
                  href={profile.role === 'admin' ? '/admin' : '/household/profile'}
                  className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-[#F2F4F6] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold text-sm select-none">
                    {profile.full_name?.charAt(0) || 'S'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-[#191C1E] leading-tight">{profile.full_name}</p>
                    <span className="text-[10px] uppercase font-bold text-[#136B3B]">
                      {profile.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#BA1A1A] hover:bg-[#FEE2E2] transition hidden sm:block"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-bold text-[#191C1E] hover:bg-[#F2F4F6] rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#136B3B] hover:bg-[#0F5730] rounded-full shadow-sm transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Smart Notification Bell Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              title="Smart Notifications"
              className="relative p-2 rounded-xl text-[#191C1E] hover:bg-[#F2F4F6] transition active:scale-95"
              aria-label="Open notifications"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-[#BA1A1A] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </header>

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}

