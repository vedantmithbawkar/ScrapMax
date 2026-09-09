'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Recycle, LogOut, MapPin, Truck, History, PlusCircle, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { useI18n } from '@/i18n/context';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] text-[#191C1E] shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & DB status badge */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-95 transition">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold shadow-xs">
              <Recycle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-[#136B3B] leading-none">{t('common.brandName')}</span>
              <span className="text-[10px] font-semibold text-[#6B7280] tracking-wider uppercase mt-0.5">{t('common.tagline')}</span>
            </div>
          </Link>

          {dbConnected === true && (
            <span
              title="Connected to live Supabase PostgreSQL database"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] animate-pulse"></span>
              <span>{t('common.supabaseLive')}</span>
            </span>
          )}
        </div>

        {/* Dynamic Navigation Links based on Role */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/safety"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              pathname === '/safety'
                ? 'bg-[#EAE6F8] text-[#191C1E]'
                : 'text-[#526056] hover:text-[#191C1E] hover:bg-[#F2F4F6]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#136B3B]" />
            <span className="hidden md:inline">{t('nav.safety')}</span>
          </Link>

          <LanguageSwitcher />

          {profile ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {profile.role === 'household' ? (
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
                    <span>{t('nav.dashboard')}</span>
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
                    <span>{t('nav.activity')}</span>
                  </Link>
                  <Link
                    href="/household/request-pickup"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#136B3B] hover:bg-[#0F5730] text-white shadow-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('nav.requestPickup')}</span>
                  </Link>
                </>
              ) : (
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
                    <span>{t('nav.availablePickups')}</span>
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
                    <span>{t('nav.mapRoute')}</span>
                  </Link>
                </>
              )}

              {/* Profile Info Badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
                <Link
                  href="/household/profile"
                  className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-[#F2F4F6] transition"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold text-sm select-none">
                    {profile.full_name?.charAt(0) || 'S'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-[#191C1E] leading-tight">{profile.full_name}</p>
                    <span className="text-[10px] uppercase font-bold text-[#136B3B]">
                      {profile.role}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title={t('nav.logOut')}
                  className="p-2 rounded-xl text-[#6B7280] hover:text-[#BA1A1A] hover:bg-[#FEE2E2] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-bold text-[#191C1E] hover:bg-[#F2F4F6] rounded-xl transition"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-2 text-xs font-bold text-white bg-[#136B3B] hover:bg-[#0F5730] rounded-full shadow-sm transition"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
