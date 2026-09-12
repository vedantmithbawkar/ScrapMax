'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Recycle,
  LogOut,
  MapPin,
  Truck,
  History,
  PlusCircle,
  Bell,
  Store,
  Factory,
  Shield,
  ShieldCheck,
  Users,
  ClipboardList,
  Settings,
  Sparkles,
  Layers,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';
import NotificationDrawer from '@/components/common/NotificationDrawer';
import {
  getUnreadNotificationsCount,
  subscribeToNotifications,
} from '@/lib/notification-service';
import AnnouncementBar from '@/components/common/AnnouncementBar';
import { getAdminSession, logoutAdmin } from '@/lib/admin-auth';
import { useTranslation, SUPPORTED_LANGUAGES, openLanguageModal } from '@/lib/i18n';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t, language } = useTranslation();
  const activeLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

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
      // 1. Check demo user fallback from localStorage
      if (typeof window !== 'undefined') {
        try {
          const rawDemo = localStorage.getItem('scrapmax_demo_user');
          if (rawDemo) {
            const demo = JSON.parse(rawDemo);
            if (demo && demo.role) {
              setProfile({
                id: 'demo-user-id',
                full_name: demo.full_name || 'Demo User',
                role: demo.role as UserRole,
                email: demo.email,
              });
              return;
            }
          }
        } catch {}
      }

      // 2. Query active Supabase session
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
            full_name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User'),
            role: (user.user_metadata?.role as UserRole) || 'household',
          });
        }
      }
    }
    loadUser();
  }, [pathname]);

  const [adminSession, setAdminSession] = useState<any>(null);

  useEffect(() => {
    setAdminSession(getAdminSession());
    const handleAdminSync = () => {
      setAdminSession(getAdminSession());
    };
    window.addEventListener('scrapmax_admin_auth_change', handleAdminSync);
    return () => window.removeEventListener('scrapmax_admin_auth_change', handleAdminSync);
  }, []);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('scrapmax_demo_user');
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.push('/login');
  };

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setAdminSession(null);
    router.push('/admin/login');
  };

  const isAdmin =
    pathname.startsWith('/admin') &&
    pathname !== '/admin/login' &&
    (adminSession !== null || profile?.role === 'admin');

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
                <span className="font-extrabold text-lg tracking-tight text-[#136B3B] leading-none notranslate">SCRAPMAX</span>
                <span className="text-[10px] font-semibold text-[#6B7280] tracking-wider uppercase mt-0.5 truncate max-w-[150px] sm:max-w-none">
                  {t('footerTagline')}
                </span>
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
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] animate-pulse"></span>
                <span>Supabase Live</span>
              </span>
            )}
          </div>

          {/* Dynamic Navigation Links */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
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
                  <span>{t('navDashboard')}</span>
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
                  <span>{t('navPickup')}</span>
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
                  <span>{t('navUsers')}</span>
                </Link>
                <Link
                  href="/admin/recyclers"
                  className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin/recyclers')
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>{t('navRecyclers')}</span>
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
                  <span>{t('navReports')}</span>
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
                  <span>{t('settings')}</span>
                </Link>
              </>
            ) : (
              <>
                {/* Public Directory & Stores Links */}
                <Link
                  href="/directory"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/directory'
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <Factory className="w-4 h-4 text-[#136B3B]" />
                  <span className="hidden md:inline">{t('navRecyclers')}</span>
                </Link>

                <Link
                  href="/stores"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/stores'
                      ? 'bg-[#EAE6F8] text-[#191C1E]'
                      : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                  }`}
                >
                  <Store className="w-4 h-4 text-[#136B3B]" />
                  <span className="hidden md:inline">{t('navDealers')}</span>
                </Link>

                {/* Safety Guidance - Prominently accessible to all users & informal collectors */}
                <Link
                  href="/collector/safety"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname === '/collector/safety'
                      ? 'bg-red-100 text-red-800 border border-red-200 shadow-2xs'
                      : 'text-red-700 hover:text-red-900 hover:bg-red-50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{t('navSafetyGuide')}</span>
                </Link>

                {/* Admin Portal Link */}
                <Link
                  href="/admin/login"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/admin')
                      ? 'bg-[#F3E8FF] text-purple-900'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="hidden sm:inline">{t('navAdmin')}</span>
                </Link>

                {profile && (
                  <>
                    {/* RECYCLER ROLE NAVIGATION */}
                    {profile.role === 'recycler' && (
                      <>
                        <Link
                          href="/recycler"
                          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname === '/recycler'
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <Layers className="w-4 h-4 text-[#136B3B]" />
                          <span>{t('navDashboard')}</span>
                        </Link>

                        <Link
                          href="/recycler/requirements"
                          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname.startsWith('/recycler/requirements')
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <span>{t('navDemands')}</span>
                        </Link>

                        <Link
                          href="/recycler/offers"
                          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname === '/recycler/offers'
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <span>{t('navIncomingScrap')}</span>
                        </Link>

                        <Link
                          href="/recycler/traceability"
                          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname === '/recycler/traceability'
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <span>{t('navTraceability')}</span>
                        </Link>

                        <Link
                          href="/recycler/requirements/new"
                          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#136B3B] hover:bg-[#0F5730] text-white shadow-xs transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{t('navNeedScrap')}</span>
                        </Link>
                      </>
                    )}

                    {/* COLLECTOR ROLE NAVIGATION */}
                    {profile.role === 'collector' && (
                      <>
                        <Link
                          href="/collector"
                          className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                            pathname === '/collector'
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <Truck className="w-4 h-4 text-[#136B3B]" />
                          <span>{t('navPickup')}</span>
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
                          <span>{t('navMapRoute')}</span>
                        </Link>

                        <Link
                          href="/collector/find-buyers"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition animate-pulse`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{t('navFindBuyers')}</span>
                        </Link>

                        <Link
                          href="/collector/demand-board"
                          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname === '/collector/demand-board'
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <span>{t('navDemandBoard')}</span>
                        </Link>

                        <Link
                          href="/collector/offers"
                          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname === '/collector/offers'
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <span>{t('navMyOffers')}</span>
                        </Link>
                      </>
                    )}

                    {/* ADMIN ROLE NAVIGATION */}
                    {profile.role === 'admin' && (
                      <>
                        <Link
                          href="/admin/recyclers"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname.startsWith('/admin/recyclers')
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-700" />
                          <span>{t('navVerification')}</span>
                        </Link>
                      </>
                    )}

                    {/* CITIZEN / HOUSEHOLD ROLE NAVIGATION */}
                    {profile.role === 'household' && (
                      <>
                        <Link
                          href="/household"
                          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            pathname === '/household'
                              ? 'bg-[#EAE6F8] text-[#191C1E]'
                              : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
                          }`}
                        >
                          <History className="w-4 h-4" />
                          <span>{t('navDashboard')}</span>
                        </Link>
                        <Link
                          href="/household/request-pickup"
                          className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#136B3B] hover:bg-[#0F5730] text-white shadow-xs transition"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>{t('navRequestPickup')}</span>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Admin Session or Profile Info Badge */}
            {pathname.startsWith('/admin') && pathname !== '/admin/login' ? (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E5E7EB]">
                <div className="flex items-center gap-2 py-1 px-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-xs select-none">
                    A
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-purple-950 leading-tight">Admin Officer</p>
                    <span className="text-[9px] uppercase font-bold text-purple-700">
                      Municipal Console
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAdminLogout}
                  title="Admin Logout"
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#BA1A1A] hover:bg-[#FEE2E2] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : profile ? (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-[#E5E7EB]">
                <Link
                  href={
                    profile.role === 'recycler'
                      ? '/recycler/profile'
                      : profile.role === 'admin'
                      ? '/admin'
                      : profile.role === 'collector'
                      ? '/collector/profile'
                      : '/household/profile'
                  }
                  className="flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-[#F2F4F6] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold text-xs select-none">
                    {profile.role === 'recycler' ? '♻️' : profile.role === 'admin' ? '🛡️' : profile.role === 'collector' ? '🚛' : '🏠'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-[#191C1E] leading-tight truncate max-w-[130px]">
                      {profile.full_name}
                    </p>
                    <span className="text-[10px] uppercase font-bold text-[#136B3B] flex items-center gap-1">
                      {profile.role === 'recycler' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Verified Recycler</span>
                        </>
                      ) : (
                        profile.role
                      )}
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#191C1E] hover:bg-[#F2F4F6] rounded-xl transition"
                >
                  {t('navSignIn')}
                </Link>
                <Link
                  href="/register"
                  className="px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-[#136B3B] hover:bg-[#0F5730] rounded-full shadow-xs transition shrink-0"
                >
                  {t('navRegister')}
                </Link>
              </div>
            )}

            {/* Global Language Selector Button */}
            <button
              type="button"
              onClick={() => openLanguageModal()}
              title="Change Language / भाषा चुनें / ભાષા પસંદ કરો"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-emerald-300 text-emerald-900 transition shadow-2xs group shrink-0"
              aria-label="Change language"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="text-[11px] font-extrabold font-mono tracking-tight text-emerald-950">
                {activeLang.short}
              </span>
              <span className="hidden xl:inline text-[10px] font-bold text-emerald-800">
                {activeLang.nativeName}
              </span>
            </button>

            {/* Smart Notification Bell Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              title="Smart Notifications"
              className="relative p-2 rounded-xl text-[#191C1E] hover:bg-[#F2F4F6] transition active:scale-95 shrink-0"
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
      <AnnouncementBar />

      {/* Slide-over Notification Drawer */}
      <NotificationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
