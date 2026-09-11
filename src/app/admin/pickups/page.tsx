'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest, PickupStatus, STATUS_LABELS, WASTE_CATEGORY_LABELS } from '@/types';
import { ArrowLeft, Search, MapPin, Clock, ChevronRight, Filter } from 'lucide-react';

type StatusFilter = 'all' | PickupStatus;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Demo data
const DEMO_PICKUPS: PickupRequest[] = [
  {
    id: 'req-admin-001', household_id: 'u1', status: 'pending',
    address: 'Indiranagar 100ft Road, Bangalore', latitude: 12.97, longitude: 77.64,
    scheduled_date: 'Today · 5:30 PM', total_estimated_weight_kg: 28.5,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PAPER', approx_weight_kg: 15 }, { category: 'PLASTIC', approx_weight_kg: 13.5 }],
  },
  {
    id: 'req-admin-002', household_id: 'u2', collector_id: 'c1', status: 'accepted',
    address: 'Koramangala 4th Block, Bangalore', latitude: 12.93, longitude: 77.62,
    scheduled_date: 'Tomorrow · 11:00 AM', total_estimated_weight_kg: 5.2,
    created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PLASTIC', approx_weight_kg: 5.2 }],
  },
  {
    id: 'req-admin-003', household_id: 'u3', collector_id: 'c2', status: 'completed',
    address: 'MG Road, Commercial Street, Bangalore', latitude: 12.97, longitude: 77.60,
    scheduled_date: '8 Sep · 3:00 PM', total_estimated_weight_kg: 42,
    created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString(),
    waste_items: [{ category: 'E_WASTE', approx_weight_kg: 22 }, { category: 'METAL', approx_weight_kg: 20 }],
  },
  {
    id: 'req-admin-004', household_id: 'u4', status: 'cancelled',
    address: 'HSR Layout, Sector 2, Bangalore', latitude: 12.91, longitude: 77.65,
    scheduled_date: '7 Sep · 10:00 AM', total_estimated_weight_kg: 3,
    created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString(),
    waste_items: [{ category: 'GLASS', approx_weight_kg: 3 }],
  },
  {
    id: 'req-admin-005', household_id: 'u5', collector_id: 'c1', status: 'in_progress',
    address: 'Whitefield Main Road, Bangalore', latitude: 12.97, longitude: 77.75,
    scheduled_date: 'Today · 2:00 PM', total_estimated_weight_kg: 15,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PAPER', approx_weight_kg: 10 }, { category: 'ORGANIC', approx_weight_kg: 5 }],
  },
];

export default function AdminPickupsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/household'); return; }
      setIsAdmin(true);

      const { data } = await supabase
        .from('pickup_requests')
        .select('*, waste_items(*)')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setPickups(data as PickupRequest[]);
      } else {
        setPickups(DEMO_PICKUPS);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = pickups.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.address?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts: Record<string, number> = {
    all: pickups.length,
    pending: pickups.filter(p => p.status === 'pending').length,
    accepted: pickups.filter(p => p.status === 'accepted').length,
    in_progress: pickups.filter(p => p.status === 'in_progress').length,
    completed: pickups.filter(p => p.status === 'completed').length,
    cancelled: pickups.filter(p => p.status === 'cancelled').length,
  };

  if (!isAdmin && !loading) return null;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-3 flex-1">

        <header className="flex items-center gap-3 pt-2 pb-5">
          <button onClick={() => router.push('/admin')} aria-label="Go back" className="p-1 -ml-1 hover:opacity-75 transition" type="button">
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">Pickup Requests</h1>
            <p className="text-[12px] text-[#6B7280] font-medium">{pickups.length} total requests</p>
          </div>
        </header>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address or request ID…"
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 focus:border-[#136B3B] transition"
          />
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {([
            { key: 'all' as StatusFilter, label: 'All' },
            { key: 'pending' as StatusFilter, label: '⏳ Pending' },
            { key: 'accepted' as StatusFilter, label: '✅ Accepted' },
            { key: 'in_progress' as StatusFilter, label: '🔄 In Progress' },
            { key: 'completed' as StatusFilter, label: '✔️ Completed' },
            { key: 'cancelled' as StatusFilter, label: '❌ Cancelled' },
          ]).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold transition ${
                statusFilter === t.key
                  ? 'bg-[#191C1E] text-white'
                  : 'bg-white border border-gray-200 text-[#526056] hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${statusFilter === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {statusCounts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#136B3B] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">🚚</span>
            <p className="text-[16px] font-bold text-[#191C1E]">No pickups found</p>
          </div>
        )}

        {/* Pickup list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2.5">
            {filtered.map(pickup => {
              const statusInfo = STATUS_LABELS[pickup.status];
              const primaryItem = pickup.waste_items?.[0];
              const primaryCat = primaryItem ? WASTE_CATEGORY_LABELS[primaryItem.category] : null;
              return (
                <div
                  key={pickup.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition space-y-3"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#EBF5EE] flex items-center justify-center text-lg flex-shrink-0">
                        {primaryCat?.icon ?? '♻️'}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#191C1E]">
                          {primaryCat?.label.split('&')[0].trim() ?? 'Recyclables'}
                          {pickup.waste_items && pickup.waste_items.length > 1 && ` +${pickup.waste_items.length - 1} more`}
                        </p>
                        <p className="text-[12px] text-[#6B7280] font-medium">{pickup.total_estimated_weight_kg} kg estimated</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusInfo.badgeColor}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-[#6B7280] font-medium leading-relaxed">{pickup.address}</p>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#9CA3AF]" />
                      <span className="text-[11px] text-[#9CA3AF] font-medium">{pickup.scheduled_date || formatDate(pickup.created_at)}</span>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] font-mono">#{pickup.id.slice(0, 8)}</span>
                    {pickup.collector_id && (
                      <span className="text-[10px] text-emerald-600 font-bold">Collector assigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
      <BottomNav role="admin" />
    </div>
  );
}
