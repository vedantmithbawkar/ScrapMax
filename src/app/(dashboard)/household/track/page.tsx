'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest, STATUS_LABELS, WASTE_CATEGORY_LABELS } from '@/types';
import { Navigation, MessageSquare, MapPin, ChevronRight, Package } from 'lucide-react';

const DEMO_REQUESTS: PickupRequest[] = [
  {
    id: 'req-h102-demo-uuid',
    household_id: 'user-h101',
    collector_id: 'collector-c201',
    collector: {
      id: 'collector-c201',
      full_name: 'Ramesh Kumar (Verified Kabadiwala)',
      phone: '+91 98201 45892',
      role: 'collector',
      rating: 4.9,
      completed_pickups: 126,
    },
    status: 'accepted',
    address: 'Main Market Road, Near City Center',
    latitude: 19.0760,
    longitude: 72.8777,
    scheduled_date: 'Today · 5:30 PM',
    total_estimated_weight_kg: 13.2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'PAPER', approx_weight_kg: 8.5 },
      { category: 'PLASTIC', approx_weight_kg: 3.2 },
    ],
  },
];

export default function HouseholdTrackListPage() {
  const [requests, setRequests] = useState<PickupRequest[]>(DEMO_REQUESTS);

  useEffect(() => {
    async function load() {
      try {
        const local = JSON.parse(localStorage.getItem('local_pickup_requests') || '[]');
        if (local && local.length > 0) {
          setRequests((prev) => {
            const combined = [...local, ...prev];
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
            return unique as PickupRequest[];
          });
        }
      } catch {}

      const supabase = createClient();
      const { data } = await supabase
        .from('pickup_requests')
        .select('*, waste_items(*)')
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });
      if (data && data.length > 0) setRequests(data as PickupRequest[]);
    }
    load();
  }, []);

  const active = requests.filter((r) => ['accepted', 'in_progress'].includes(r.status));
  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1E] tracking-tight flex items-center gap-2">
            <Navigation className="w-6 h-6 text-[#136B3B]" />
            Track Pickups
          </h1>
          <p className="text-sm text-[#526056] mt-1">Track your active pickups and chat with collectors</p>
        </div>

        {/* Active */}
        {active.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#526056] uppercase tracking-wider">Active ({active.length})</h2>
            {active.map((req) => {
              const primaryItem = req.waste_items?.[0];
              const meta = primaryItem ? WASTE_CATEGORY_LABELS[primaryItem.category] : null;
              const statusInfo = STATUS_LABELS[req.status];
              const collectorName = req.collector?.full_name || 'Ramesh Kumar (Kabadiwala)';
              const collectorPhone = req.collector?.phone || '+91 98201 45892';
              return (
                <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EAF5EE] flex items-center justify-center text-lg flex-shrink-0">
                          {meta?.icon ?? '♻️'}
                        </div>
                        <div>
                          <p className="font-bold text-[#191C1E] text-sm leading-tight">
                            {meta?.label.split('&')[0].trim() ?? 'Recyclables'}
                            {req.waste_items && req.waste_items.length > 1 && ` +${req.waste_items.length - 1}`}
                          </p>
                          <p className="text-xs text-[#6B7280]">{req.total_estimated_weight_kg} kg · {req.scheduled_date}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusInfo.badgeColor}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                      <MapPin className="w-3.5 h-3.5 text-[#136B3B] flex-shrink-0" />
                      <span className="truncate">{req.address}</span>
                    </div>

                    {/* Assigned Collector Details Strip */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚛</span>
                        <div>
                          <span className="font-bold text-[#191C1E] block">
                            {collectorName}
                          </span>
                          <span className="text-[11px] text-[#136B3B] font-mono font-bold block">
                            {collectorPhone}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`tel:${collectorPhone.replace(/\s+/g, '')}`}
                        className="px-3 py-1 bg-[#136B3B] hover:bg-[#0F5730] text-white text-[11px] font-bold rounded-lg transition shadow-2xs"
                      >
                        Call
                      </a>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100">
                    <Link
                      href={`/household/track/${req.id}`}
                      className="flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-[#191C1E] hover:bg-gray-50 transition"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#136B3B]" />
                      Track
                    </Link>
                    <Link
                      href={`/household/track/${req.id}`}
                      className="flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-[#136B3B] hover:bg-[#EAF5EE] transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </Link>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#526056] uppercase tracking-wider">Waiting for collector ({pending.length})</h2>
            {pending.map((req) => {
              const meta = req.waste_items?.[0] ? WASTE_CATEGORY_LABELS[req.waste_items[0].category] : null;
              return (
                <div key={req.id} className="bg-white rounded-2xl border border-dashed border-amber-200 p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-lg flex-shrink-0">
                    {meta?.icon ?? '♻️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#191C1E] text-sm truncate">{req.address.split(',')[0]}</p>
                    <p className="text-xs text-[#6B7280]">{req.total_estimated_weight_kg} kg · Awaiting collector</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 text-amber-700 rounded-full flex-shrink-0">Pending</span>
                </div>
              );
            })}
          </section>
        )}

        {/* Empty state */}
        {requests.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] text-sm">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-[#191C1E]">No active pickups</p>
            <p className="mt-1">Request a pickup to see live tracking here.</p>
            <Link href="/household/request-pickup" className="inline-block mt-4 px-5 py-2.5 bg-[#136B3B] text-white font-bold text-sm rounded-full hover:bg-[#0F5730] transition">
              Request Pickup
            </Link>
          </div>
        )}
      </main>

      <BottomNav role="household" />
    </div>
  );
}