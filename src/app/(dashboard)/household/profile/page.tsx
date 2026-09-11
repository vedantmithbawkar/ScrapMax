'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { ArrowLeft, User, MapPin, Settings, ChevronRight, LogOut, ClipboardList, AlertTriangle } from 'lucide-react';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import { useTranslation } from '@/lib/i18n';

export default function UserProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function loadUser() {
      // Check local cache first
      let cachedName = '';
      let cachedPhone = '';
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('aicle_personal_info');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.fullName) cachedName = parsed.fullName;
            if (parsed.phone) cachedPhone = parsed.phone;
          }
        } catch {
          // ignore
        }
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile({
            ...(data as UserProfile),
            full_name: cachedName || data.full_name || 'Sahil Household',
            phone: cachedPhone || data.phone || '+91 9876543210',
          });
        } else {
          setProfile({
            id: user.id,
            full_name: cachedName || user.user_metadata?.full_name || 'Sahil Household',
            role: (user.user_metadata?.role as 'household' | 'collector') || 'household',
            phone: cachedPhone || user.user_metadata?.phone || '+91 9876543210',
          });
        }
      } else {
        setProfile({
          id: 'demo-user-id',
          full_name: cachedName || 'Sahil Household',
          role: 'household',
          phone: cachedPhone || '+91 9876543210',
        });
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const displayName = profile?.full_name || 'Sahil Household';
  const displayPhone = profile?.phone || '+91 9876543210';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <main className="w-full max-w-md mx-auto px-4 sm:px-6 pt-3 flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-col pb-8">
          
          {/* Top Bar */}
          <header className="flex items-center gap-3 pt-2 pb-5" data-purpose="page-header">
            <button
              onClick={() => router.push('/household')}
              aria-label="Go back to Dashboard"
              className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition touch-feedback"
              type="button"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-[#191C1E]">{t('profileTitle')}</h1>
          </header>

          {/* User Identity Section */}
          <section className="flex flex-col items-center justify-center my-3" data-purpose="user-identity">
            {/* Mint Green Circular Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#E5F4EB] flex items-center justify-center shadow-xs mb-3 select-none">
              <span className="text-4xl font-extrabold text-[#1E7044]">{initial}</span>
            </div>
            {/* User Info */}
            <h2 className="text-2xl font-bold text-[#191C1E] tracking-tight">{displayName}</h2>
            <p className="text-[#6B7280] text-sm font-medium mt-0.5 tracking-wide">{displayPhone}</p>
            <span className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E6F4EA] text-[#136B3B]">
              {t('householdAccount')}
            </span>
          </section>

          {/* Personal Recycling Dashboard */}
          <div className="mt-2 mb-2">
            <PersonalDashboard role={profile?.role || 'household'} />
          </div>

          {/* Action Menu List */}
          <section className="flex flex-col space-y-3 mt-6" data-purpose="profile-navigation-options">
            
            {/* 1. Personal Information */}
            <Link
              href="/household/profile/personal-info"
              className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-emerald-200 hover:bg-[#F8FAF9] active:scale-[0.99] transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[16px] font-bold text-[#191C1E]">{t('personalInformation')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#136B3B] stroke-[2.5] transition-colors" />
            </Link>

            {/* 2. Saved Addresses */}
            <Link
              href="/household/profile/saved-addresses"
              className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-emerald-200 hover:bg-[#F8FAF9] active:scale-[0.99] transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] group-hover:scale-105 transition-transform">
                  <MapPin className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[16px] font-bold text-[#191C1E]">{t('savedAddresses')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#136B3B] stroke-[2.5] transition-colors" />
            </Link>

            {/* 3. Settings */}
            <Link
              href="/household/settings"
              className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-emerald-200 hover:bg-[#F8FAF9] active:scale-[0.99] transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[16px] font-bold text-[#191C1E]">{t('settings')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#136B3B] stroke-[2.5] transition-colors" />
            </Link>

            {/* 4. My Reports */}
            <Link
              href="/household/my-reports"
              className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-emerald-200 hover:bg-[#F8FAF9] active:scale-[0.99] transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] group-hover:scale-105 transition-transform">
                  <ClipboardList className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[16px] font-bold text-[#191C1E]">My Reports</span>
                  <p className="text-[11px] text-[#6B7280] font-medium">Track your submitted reports</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#136B3B] stroke-[2.5] transition-colors" />
            </Link>

            {/* 5. Report a Problem */}
            <Link
              href="/household/report"
              className="flex items-center justify-between bg-red-50 px-5 py-4 rounded-2xl border border-red-100 hover:border-red-200 transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[16px] font-bold text-red-700">🆘 Report a Problem</span>
                  <p className="text-[11px] text-red-500 font-medium">Report an issue with the ScrapMax platform</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 stroke-[2.5]" />
            </Link>

          </section>

          {/* Logout Button Section */}
          <div className="mt-8" data-purpose="logout-action">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-4 rounded-2xl border border-gray-300 text-[#191C1E] text-base font-bold text-center bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:bg-gray-100 transition touch-feedback shadow-xs flex items-center justify-center gap-2"
              type="button"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('logout')}</span>
            </button>
          </div>

        </div>
      </main>

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role={profile?.role || 'household'} />
    </div>
  );
}
