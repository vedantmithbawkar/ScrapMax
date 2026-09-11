'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import RequestCard from '@/components/request/RequestCard';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest } from '@/types';
import Link from 'next/link';
import { ArrowLeft, Package, Sparkles } from 'lucide-react';
import ReceiptModal from '@/components/request/ReceiptModal';

export default function RecyclingHistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [selectedReceiptRequest, setSelectedReceiptRequest] = useState<PickupRequest | null>(null);

  useEffect(() => {
    async function loadRequests() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let localList: PickupRequest[] = [];
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localList = parsed.map((r: any) => ({
              ...r,
              payment: r.payment || r.payment_json || undefined,
            }));
          }
        }
      } catch {}

      if (user) {
        try {
          const { data } = await supabase
            .from('pickup_requests')
            .select('*, waste_items(*), collector:profiles!collector_id(id, full_name, phone, role)')
            .eq('household_id', user.id)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            const normalized = (data as any[]).map((r) => ({
              ...r,
              payment: r.payment || r.payment_json || undefined,
            }));

            // Merge local and Supabase by ID
            const mapById = new Map<string, PickupRequest>();
            for (const r of normalized) mapById.set(r.id, r);
            for (const l of localList) {
              if (mapById.has(l.id)) {
                const existing = mapById.get(l.id)!;
                if (l.status === 'completed' || l.payment) {
                  mapById.set(l.id, { ...existing, ...l });
                }
              } else {
                mapById.set(l.id, l);
              }
            }
            setRequests(Array.from(mapById.values()));
            return;
          }
        } catch (err) {
          console.warn('Supabase history load note:', err);
        }
      }

      setRequests(localList);
    }

    loadRequests();

    // Listen to real-time events from other tabs
    const handleSync = () => loadRequests();
    window.addEventListener('scrapmax:tracking_update', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('scrapmax:tracking_update', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const filteredRequests = requests.filter((req) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Completed') return req.status === 'completed';
    if (activeFilter === 'Pending') {
      return req.status === 'pending' || req.status === 'accepted' || req.status === 'in_progress';
    }
    return true;
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
          <p className="text-xs text-[#526056] mt-0.5 font-medium">
            Review your past pickups, verified weights, settled earnings, and download official receipts.
          </p>
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

        {/* Pickups List */}
        <section aria-label="Recycling logs" className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#136B3B] flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#191C1E] text-base">
                  {activeFilter === 'Completed'
                    ? 'No completed pickups yet'
                    : activeFilter === 'Pending'
                    ? 'No pending pickups'
                    : 'No recycling history found'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {activeFilter === 'Completed'
                    ? 'When a collector completes your scrap pickup and settles payment, your receipt and payment details will appear here.'
                    : 'Schedule a doorstep scrap pickup to turn your recyclables into cash and start earning green points.'}
                </p>
              </div>
              <Link
                href="/household/request-pickup"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Schedule a Pickup</span>
              </Link>
            </div>
          ) : (
            filteredRequests.map((req) => (
              <RequestCard key={req.id} request={req} userRole="household" />
            ))
          )}
        </section>
      </div>

      {/* Digital Receipt Modal */}
      {selectedReceiptRequest && (
        <ReceiptModal
          request={selectedReceiptRequest}
          onClose={() => setSelectedReceiptRequest(null)}
        />
      )}

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="household" />
    </div>
  );
}
