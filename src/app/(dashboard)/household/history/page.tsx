'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import RequestCard from '@/components/request/RequestCard';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest } from '@/types';
import { ArrowLeft, Star, Receipt } from 'lucide-react';
import RatingModal from '@/components/request/RatingModal';
import ReceiptModal from '@/components/request/ReceiptModal';
import { resolveCollectorName, resolveHouseholdName } from '@/lib/name-resolver';

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
  const [selectedLogToRate, setSelectedLogToRate] = useState<{ id: string; category: string } | null>(null);
  const [selectedReceiptRequest, setSelectedReceiptRequest] = useState<PickupRequest | null>(null);

  const openLogReceipt = (log: typeof DEMO_HISTORY_LOGS[0]) => {
    const weightNum = parseFloat(log.weight) || 5;
    const totalAmount = parseInt(log.points) || 100;
    const unitRate = Math.round(totalAmount / weightNum);

    // Check user info if stored in local cache
    let cachedName = resolveHouseholdName();
    let cachedPhone = '+91 98201 54321';
    let cachedAddress = 'Flat 402, Green Valley Apts, 100ft Road, Indiranagar, Bangalore - 560038';

    if (typeof window !== 'undefined') {
      try {
        const info = localStorage.getItem('scrapmax_personal_info') || localStorage.getItem('aicle_personal_info');
        if (info) {
          const parsed = JSON.parse(info);
          if (parsed.fullName) cachedName = parsed.fullName;
          if (parsed.phone) cachedPhone = parsed.phone;
        }
        const addrs = localStorage.getItem('scrapmax_saved_addresses') || localStorage.getItem('aicle_saved_addresses');
        if (addrs) {
          const parsedAddrs = JSON.parse(addrs);
          if (Array.isArray(parsedAddrs) && parsedAddrs.length > 0) {
            const def = parsedAddrs.find((a: any) => a.is_default) || parsedAddrs[0];
            if (def) {
              cachedAddress = `${def.flat_building}, ${def.area_street}${def.landmark ? `, Near ${def.landmark}` : ''}, ${def.city} - ${def.pincode}`;
              if (def.phone) cachedPhone = def.phone;
            }
          }
        }
      } catch {}
    }

    const req: PickupRequest = {
      id: `REQ-${log.id.toUpperCase()}`,
      household_id: 'user-h101',
      collector_id: 'collector-c201',
      status: 'completed',
      scheduled_date: '2026-09-08',
      address: cachedAddress,
      latitude: 12.9784,
      longitude: 77.6408,
      contact_name: cachedName,
      contact_phone: cachedPhone,
      household: {
        id: 'user-h101',
        full_name: cachedName,
        phone: cachedPhone,
        role: 'household',
      },
      collector: {
        id: 'collector-c201',
        full_name: resolveCollectorName(),
        phone: '+91 98201 45892',
        role: 'collector',
      },
      waste_items: [
        {
          id: `item-${log.id}`,
          request_id: `REQ-${log.id.toUpperCase()}`,
          category: log.category.toLowerCase() as any,
          approx_weight_kg: weightNum,
          actual_weight_kg: weightNum,
          price_per_kg: unitRate,
          total_price: totalAmount,
        },
      ],
      created_at: '2026-09-08T10:30:00Z',
      updated_at: '2026-09-08T10:30:00Z',
      notes: log.notes,
    };
    setSelectedReceiptRequest(req);
  };

  useEffect(() => {
    async function loadRequests() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let localList: PickupRequest[] = [];
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) localList = JSON.parse(raw);
      } catch {}

      if (user) {
        const { data } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*)')
          .eq('household_id', user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setLiveRequests(data as PickupRequest[]);
        } else if (localList.length > 0) {
          setLiveRequests(localList);
        }
      } else if (localList.length > 0) {
        setLiveRequests(localList);
      }
    }
    loadRequests();
  }, []);

  const filteredLogs = DEMO_HISTORY_LOGS.filter((log) => {
    if (activeFilter === 'All') return true;
    return log.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-3 flex-1">
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

              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-medium text-[#6B7280] tracking-normal">
                  {log.notes}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openLogReceipt(log)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#E6F4EA] hover:bg-[#D4EBD9] text-[#136B3B] border border-[#A6D5B8] shadow-2xs transition"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLogToRate({ id: log.id, category: log.category })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs transition"
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>Rate</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Receipt Modal */}
      {selectedReceiptRequest && (
        <ReceiptModal
          request={selectedReceiptRequest}
          onClose={() => setSelectedReceiptRequest(null)}
        />
      )}

      {/* Rating & Review Modal */}
      {selectedLogToRate && (
        <RatingModal
          requestId={selectedLogToRate.id}
          reviewerType="customer"
          reviewerId="user-h101"
          revieweeId="collector-c201"
          revieweeName={`${selectedLogToRate.category} Pickup Partner`}
          onClose={() => setSelectedLogToRate(null)}
        />
      )}

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="household" />
    </div>
  );
}
