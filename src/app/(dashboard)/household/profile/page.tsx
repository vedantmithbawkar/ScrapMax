'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { ArrowLeft, User, MapPin, Star, Settings, ChevronRight } from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
            phone: user.user_metadata?.phone || '+91 98765 43210',
          });
        }
      } else {
        setProfile({
          id: 'demo-user-id',
          full_name: 'Sahil',
          role: 'household',
          phone: '+91 98765 43210',
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

  const displayName = profile?.full_name || 'Sahil';
  const displayPhone = profile?.phone || '+91 98765 43210';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <main className="w-full max-w-md mx-auto px-4 sm:px-6 pt-3 flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-col pb-8">
          
          {/* Top Bar */}
          <header className="flex items-center gap-3 pt-2 pb-5" data-purpose="page-header">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition touch-feedback"
              type="button"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-[#191C1E]">Profile</h1>
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
              {profile?.role || 'Household'} Account
            </span>
          </section>

          {/* Action Menu List */}
          <section className="flex flex-col space-y-3 mt-6" data-purpose="profile-navigation-options">
            
            {/* Personal Information */}
            <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-gray-200 transition touch-feedback cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                  <User className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[16px] font-bold text-[#191C1E]">Personal information</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5]" />
            </div>

            {/* Saved Addresses */}
            <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-gray-200 transition touch-feedback cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                  <MapPin className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[16px] font-bold text-[#191C1E]">Saved addresses</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5]" />
            </div>

            {/* Rewards & Impact */}
            <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-gray-200 transition touch-feedback cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                  <Star className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[16px] font-bold text-[#191C1E]">Rewards &amp; impact</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5]" />
            </div>

            {/* Settings */}
            <div className="flex items-center justify-between bg-white px-5 py-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 hover:border-gray-200 transition touch-feedback cursor-pointer">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                  <Settings className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[16px] font-bold text-[#191C1E]">Settings</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5]" />
            </div>

          </section>

          {/* Logout Button Section */}
          <div className="mt-8" data-purpose="logout-action">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-4 rounded-2xl border border-gray-300 text-[#191C1E] text-base font-bold text-center bg-white hover:bg-gray-50 active:bg-gray-100 transition touch-feedback shadow-xs"
              type="button"
            >
              Log out
            </button>
          </div>

        </div>
      </main>

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role={profile?.role || 'household'} />
    </div>
  );
}
