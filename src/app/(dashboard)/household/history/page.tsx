'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import RequestCard from '@/components/request/RequestCard';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest } from '@/types';
import { ArrowLeft } from 'lucide-react';

const DEMO_HISTORY_LOGS = [
  {
    id: 'log-1',
    category: 'Paper',
    weight: '8.5 kg',
    points: '170',
    status: 'Completed',
    notes: 'Pickup completed · Payment recorded',
  },
  {
    id: 'log-2',
    category: 'Plastic',
    weight: '5.2 kg',
    points: '156',
    status: 'Completed',
    notes: 'Pickup completed · Payment recorded',
  },
  {
    id: 'log-3',
    category: 'Metal',
    weight: '3.0 kg',
    points: '210',
    status: 'Completed',
    notes: 'Pickup completed · Payment recorded',
  },
  {
    id: 'log-4',
    category: 'Cardboard',
    weight: '11.0 kg',
    points: '132',
    status: 'Completed',
    notes: 'Pickup completed · Payment recorded',
  },
  {
    id: 'log-5',
    category: 'E-waste',
    weight: '2.4 kg',
    points: '480',
    status: 'Completed',
    notes: 'Pickup completed · Payment recorded',
  },
];

export default function RecyclingHistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [liveRequests, setLiveRequests] = useState<PickupRequest[]>([]);

  useEffect(() => {
    async function loadRequests() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*)')
          .eq('household_id', user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setLiveRequests(data as PickupRequest[]);
        }
      }
    }
    loadRequests();
  }, []);

  const filteredLogs = DEMO_HISTORY_LOGS.filter((log) => {
    if (activeFilter === 'All') return true;
    return log.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-28">
      <Navbar />

      <div className="w-full max-w-[430px] sm:max-w-xl mx-auto px-4 sm:px-5 pt-3 flex-1">
        {/* Top Header */}
        <header className="flex items-center gap-3 pt-3 pb-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition touch-feedback"
            type="button"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#191C1E]">
            My activity
          </h1>
        </header>

        {/* Page Section Headline */}
        <section aria-labelledby="history-heading" className="mt-2 mb-4">
          <h2 className="text-[24px] sm:text-[26px] font-extrabold text-[#191C1E] tracking-tight" id="history-heading">
            Recycling history
          </h2>
        </section>

        {/* Filter Chips Bar */}
        <section aria-label="Filter activities" className="flex items-center gap-2.5 mb-5 overflow-x-auto no-scrollbar py-0.5">
          {(['All', 'Completed', 'Pending'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 rounded-xl text-sm transition touch-feedback ${
                  isActive
                    ? 'font-bold bg-[#EAE6F8] text-[#1B192B] border border-transparent shadow-xs'
                    : 'font-medium bg-transparent text-[#526056] border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </section>

        {/* Realtime / Supabase Pickups if present */}
        {liveRequests.length > 0 && (
          <section className="space-y-3 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Active Requests
            </h3>
            {liveRequests.map((req) => (
              <RequestCard key={req.id} request={req} userRole="household" />
            ))}
          </section>
        )}

        {/* Recycling Activity Cards List from Stitch Design */}
        <section aria-label="Recycling logs" className="space-y-3">
          {liveRequests.length > 0 && (
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] pt-2">
              Past History Logs
            </h3>
          )}

          {filteredLogs.map((log) => (
            <article
              key={log.id}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-gray-200 transition"
              data-purpose="activity-card"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-[17px] font-bold text-[#191C1E] leading-tight">
                    {log.category}
                  </h3>
                  <p className="text-[14px] font-medium text-[#6B7280] mt-0.5">
                    {log.weight}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[20px] font-extrabold text-[#136B3B] leading-tight block">
                    {log.points}
                  </span>
                  <span className="text-[12px] font-semibold text-[#136B3B] mt-0.5 block">
                    {log.status}
                  </span>
                </div>
              </div>

              {/* Sub-divider line */}
              <hr className="border-t border-gray-100 mb-2.5" />

              <p className="text-[12px] font-medium text-[#6B7280] tracking-normal">
                {log.notes}
              </p>
            </article>
          ))}
        </section>
      </div>

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="household" />
    </div>
  );
}
