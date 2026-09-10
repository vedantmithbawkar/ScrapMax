'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import RequestCard from '@/components/request/RequestCard';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest } from '@/types';
import { Recycle, Package } from 'lucide-react';

import { useTranslation } from '@/lib/i18n';

const DEMO_HOUSEHOLD_REQUESTS: PickupRequest[] = [
  {
    id: 'req-h101-demo-uuid',
    household_id: 'user-h101',
    status: 'pending',
    address: 'Indiranagar 100ft Road, Bangalore, Karnataka',
    latitude: 12.9784,
    longitude: 77.6408,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Please call before arriving. Cardboard boxes packed neat.',
    total_estimated_weight_kg: 8.5,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      {
        category: 'PAPER',
        approx_weight_kg: 8.5,
        notes: 'Bundled newspapers & paper',
        photos: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'req-h102-demo-uuid',
    household_id: 'user-h101',
    collector_id: 'collector-c201',
    status: 'accepted',
    address: 'Koramangala 4th Block, 80ft Road, Bangalore',
    latitude: 12.9345,
    longitude: 77.6242,
    scheduled_date: '28 Aug · 11:00 AM',
    notes: 'Crushed PET bottles and containers',
    total_estimated_weight_kg: 5.2,
    photos: [
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      {
        category: 'PLASTIC',
        approx_weight_kg: 5.2,
        photos: ['https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'req-h103-demo-uuid',
    household_id: 'user-h101',
    collector_id: 'collector-c201',
    status: 'completed',
    address: 'MG Road, Bangalore',
    latitude: 12.9756,
    longitude: 77.6068,
    scheduled_date: '24 Aug · 3:00 PM',
    notes: 'Aluminum cans and tin cans',
    total_estimated_weight_kg: 3.0,
    photos: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      {
        category: 'METAL',
        approx_weight_kg: 3.0,
        photos: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
];

export default function HouseholdDashboard() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PickupRequest[]>(DEMO_HOUSEHOLD_REQUESTS);
  const [userName, setUserName] = useState<string>('Sahil');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    async function loadRequests() {
      // Check cached name if updated in personal info
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('aicle_personal_info');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.fullName) {
              setUserName(parsed.fullName.split(' ')[0]);
            }
          }
        } catch {
          // ignore
        }
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let localRequests: PickupRequest[] = [];
      try {
        const localSaved = localStorage.getItem('local_pickup_requests');
        if (localSaved) {
          localRequests = JSON.parse(localSaved);
        }
      } catch (err) {
        console.warn('Local pickup load notice:', err);
      }

      if (user) {
        setIsAuthenticated(true);
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name.split(' ')[0]);
        }

        const { data } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*)')
          .eq('household_id', user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setRequests(data as PickupRequest[]);
        } else if (localRequests.length > 0) {
          setRequests(localRequests);
        } else {
          setRequests([]);
        }
      } else {
        setIsAuthenticated(false);
        if (localRequests.length > 0) {
          setRequests([...localRequests, ...DEMO_HOUSEHOLD_REQUESTS]);
        } else {
          setRequests(DEMO_HOUSEHOLD_REQUESTS);
        }
      }
    }
    loadRequests();
  }, []);

  const activePickup = requests.find((r) => r.status === 'pending' || r.status === 'accepted' || r.status === 'in_progress');
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? 'goodMorning' : hour < 17 ? 'goodAfternoon' : 'goodEvening';

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans selection:bg-[#E6F4EA] pb-24">
      <Navbar />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-28 space-y-6 flex-1">
        
        {/* User Greeting Header */}
        <header className="flex items-center justify-between pt-1" data-purpose="user-header">
          <div className="space-y-0.5">
            <p className="text-[15px] font-medium text-[#526056] flex items-center gap-1.5">
              {t(greetingKey)} <span className="inline-block text-base select-none">👋</span>
            </p>
            <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#191C1E] leading-tight">
              {userName}
            </h1>
          </div>
          <Link
            href="/household/profile"
            className="w-12 h-12 rounded-full bg-[#E6F4EA] hover:opacity-90 flex items-center justify-center text-[#136B3B] font-bold text-xl select-none shadow-xs transition"
          >
            {userName.charAt(0)}
          </Link>
        </header>

        {/* Demo Mode Notice Banner if not logged in */}
        {!isAuthenticated && (
          <div className="px-4 py-2.5 bg-[#EAF5EE] border border-[#A6D5B8] rounded-2xl flex items-center justify-between text-xs text-[#136B3B]">
            <span className="font-medium">
              {t('demoNotice')}
            </span>
            <Link href="/login" className="font-bold underline ml-2 flex-shrink-0">
              {t('signIn')}
            </Link>
          </div>
        )}

        {/* Hero Card Banner */}
        <section className="bg-[#136B3B] rounded-3xl p-6 sm:p-7 text-white shadow-sm relative overflow-hidden transition-all">
          <div className="relative z-10 space-y-2">
            <h2 className="text-[22px] sm:text-2xl font-bold tracking-tight leading-snug">
              {t('turnRecyclables')}
            </h2>
            <p className="text-[15px] text-[#A6D5B8] leading-normal font-normal">
              {t('schedulePickup')}
            </p>
            <div className="pt-4">
              <Link
                href="/household/request-pickup"
                className="inline-block bg-white text-[#136B3B] text-[15px] font-bold px-6 py-3 rounded-full hover:bg-slate-50 active:scale-[0.98] transition-all shadow-xs"
              >
                {t('requestPickup')}
              </Link>
            </div>
          </div>
          {/* Subtle curved background ornament */}
          <div className="absolute -right-6 -bottom-8 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </section>

        {/* Quick Actions Section */}
        <section className="space-y-3" data-purpose="quick-actions">
          <h3 className="text-lg font-bold text-[#191C1E] tracking-tight">
            {t('quickActions')}
          </h3>
          <div className="grid grid-cols-2 gap-3.5">
            {/* Sell Recyclables Card */}
            <Link
              href="/household/request-pickup"
              className="bg-white rounded-3xl p-5 text-left flex flex-col justify-between h-[160px] border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition active:scale-[0.98] touch-feedback"
            >
              <div className="w-10 h-10 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                <Recycle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <p className="font-bold text-[#191C1E] text-[16px] leading-tight">{t('sellRecyclables')}</p>
                <p className="text-xs text-[#6B7280] font-medium mt-1">{t('getValue')}</p>
              </div>
            </Link>

            {/* Nearby Collectors / History Card */}
            <Link
              href="/household/history"
              className="bg-white rounded-3xl p-5 text-left flex flex-col justify-between h-[160px] border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:shadow-md transition active:scale-[0.98] touch-feedback"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-[#E23636]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="9" fill="#E23636" r="5" />
                  <path d="M12 14V21" stroke="#94A3B8" strokeLinecap="round" strokeWidth="2" />
                  <circle cx="10" cy="7.5" fill="#FFA3A3" r="1.5" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[#191C1E] text-[16px] leading-tight">{t('pickupHistory')}</p>
                <p className="text-xs text-[#6B7280] font-medium mt-1">{t('viewPastPickups')}</p>
              </div>
            </Link>
          </div>

        </section>

        {/* Active Pickup Section */}
        {activePickup && (
          <section className="space-y-3" data-purpose="active-pickup-section">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#191C1E] tracking-tight">
                {t('activePickupStatus')}
              </h3>
              <Link href={`/household/track/${activePickup.id}`} className="text-xs font-bold text-[#136B3B] hover:underline">
                Track &amp; Chat
              </Link>
            </div>
            
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center flex-shrink-0 select-none text-2xl">
                  🚚
                </div>
                <div>
                  <h4 className="font-bold text-[#191C1E] text-[15px] leading-tight">
                    {activePickup.status === 'pending' ? 'Pickup requested' : 'Pickup scheduled'}
                  </h4>
                  <p className="text-xs font-medium text-[#6B7280] mt-1">
                    {activePickup.scheduled_date} · {activePickup.total_estimated_weight_kg || 5} kg
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href={`/household/track/${activePickup.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#EAF5EE] border border-[#A6D5B8] text-[#136B3B] text-xs font-bold rounded-xl hover:bg-[#D4EBD9] transition"
                >
                  <span>Track</span>
                </Link>
                <Link
                  href={`/household/track/${activePickup.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#136B3B] text-white text-xs font-bold rounded-xl hover:bg-[#0F5730] transition"
                >
                  <span>Chat</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Recent Activity Section */}
        <section className="space-y-3 pb-2" data-purpose="recent-activity-section">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#191C1E] tracking-tight">
              {t('recentActivity')}
            </h3>
            <Link href="/household/history" className="text-xs font-bold text-[#136B3B] hover:underline">
              See all
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-2xl text-xs text-[#6B7280] space-y-2">
              <Package className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-bold text-[#191C1E]">No pickup requests in Supabase yet</p>
              <p>Click &quot;Request pickup&quot; above to create your first pickup request!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 4).map((req) => (
                <RequestCard key={req.id} request={req} userRole="household" />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="household" />
    </div>
  );
}
