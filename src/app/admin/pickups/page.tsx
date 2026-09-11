'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest, PickupStatus, STATUS_LABELS, WASTE_CATEGORY_LABELS } from '@/types';
import { resolveCollectorName, resolveHouseholdName } from '@/lib/name-resolver';
import {
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  Truck,
  Eye,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  IndianRupee,
  Sparkles,
  Shield,
  Users,
  Package,
} from 'lucide-react';

type StatusFilter = 'all' | PickupStatus;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Fallback demo pickups for instant rendering & offline resilience
const DEMO_PICKUPS: PickupRequest[] = [
  {
    id: 'req-c301',
    household_id: 'u1',
    collector_id: 'collector-c201',
    status: 'completed',
    address: 'Indiranagar 100ft Road, Near Metro Pillar 42, Bangalore',
    latitude: 12.9716,
    longitude: 77.6412,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Please call before arriving. Cardboard boxes packed neat.',
    total_estimated_weight_kg: 28.5,
    payment_json: {
      amount: 495,
      method: 'upi',
      txId: 'TXN-984210',
      timestamp: new Date().toISOString(),
      paidBy: 'Ramesh Patel (Collector)',
      receivedBy: 'Sahil Household',
    },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'PAPER', approx_weight_kg: 15, notes: 'Old newspapers & textbook bundles' },
      { category: 'PLASTIC', approx_weight_kg: 13.5, notes: 'Clean PET bottles & milk packets' },
    ],
  },
  {
    id: 'req-c302',
    household_id: 'u2',
    collector_id: 'collector-c201',
    status: 'in_progress',
    address: 'Koramangala 4th Block, 80ft Road, Bangalore',
    latitude: 12.9345,
    longitude: 77.6242,
    scheduled_date: 'Today · 3:00 PM',
    notes: 'Gate code 4092. Bags kept at porch.',
    total_estimated_weight_kg: 12.0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'PLASTIC', approx_weight_kg: 7.0 },
      { category: 'PAPER', approx_weight_kg: 5.0 },
    ],
  },
  {
    id: 'req-c303',
    household_id: 'u3',
    status: 'pending',
    address: 'HSR Layout Sector 2, 19th Main, Bangalore',
    latitude: 12.9121,
    longitude: 77.6446,
    scheduled_date: 'Tomorrow · 10:00 AM',
    notes: 'Old CPU cabinet, aluminum vessels, copper wire bundles.',
    total_estimated_weight_kg: 18.5,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'E_WASTE', approx_weight_kg: 10.5 },
      { category: 'METAL', approx_weight_kg: 8.0 },
    ],
  },
  {
    id: 'req-c304',
    household_id: 'u4',
    collector_id: 'collector-c202',
    status: 'accepted',
    address: 'Whitefield Main Road, Palm Meadows, Bangalore',
    latitude: 12.9698,
    longitude: 77.7499,
    scheduled_date: 'Tomorrow · 12:00 PM',
    total_estimated_weight_kg: 32.0,
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'PAPER', approx_weight_kg: 25.0 },
      { category: 'GLASS', approx_weight_kg: 7.0 },
    ],
  },
  {
    id: 'req-c305',
    household_id: 'u5',
    status: 'cancelled',
    address: 'MG Road, Commercial Street, Bangalore',
    latitude: 12.9756,
    longitude: 77.6068,
    scheduled_date: '8 Sep · 3:00 PM',
    notes: 'Citizen cancelled due to rain and travel.',
    total_estimated_weight_kg: 5.0,
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PLASTIC', approx_weight_kg: 5.0 }],
  },
];

export default function AdminPickupsPage() {
  const router = useRouter();
  // Initialize immediately with demo data for fast, reliable loading
  const [pickups, setPickups] = useState<PickupRequest[]>(DEMO_PICKUPS);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const supabase = createClient();
        
        const fetchWithTimeout = async <T,>(promise: PromiseLike<T>, ms = 2500): Promise<T> => {
          return Promise.race([
            Promise.resolve(promise),
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
          ]);
        };

        const authRes = await fetchWithTimeout(supabase.auth.getUser());
        const user = authRes?.data?.user;
        if (user) {
          const profileRes: any = await fetchWithTimeout(supabase.from('profiles').select('role').eq('id', user.id).single());
          if (profileRes?.data?.role !== 'admin' && isMounted) {
            setIsDemoMode(true);
          }
        } else if (isMounted) {
          setIsDemoMode(true);
        }

        // Load local pickup requests created across Household/Collector portals
        let localRequests: PickupRequest[] = [];
        try {
          const raw = localStorage.getItem('local_pickup_requests');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localRequests = parsed;
          }
        } catch {}

        const res: any = await fetchWithTimeout(
          supabase.from('pickup_requests').select('*, waste_items(*)').order('created_at', { ascending: false })
        );
        const pickupsData = res?.data;

        const combined = [...localRequests, ...(pickupsData || []), ...DEMO_PICKUPS];
        const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());

        if (isMounted) {
          setPickups(unique);
        }
      } catch {
        if (isMounted) {
          setIsDemoMode(true);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: PickupStatus) => {
    try {
      const supabase = createClient();
      await supabase.from('pickup_requests').update({ status: newStatus }).eq('id', id);
    } catch {}

    // Sync to local_pickup_requests so Household and Collector portals immediately see status update
    try {
      const raw = localStorage.getItem('local_pickup_requests');
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.map((p: any) => (p.id === id ? { ...p, status: newStatus } : p));
        localStorage.setItem('local_pickup_requests', JSON.stringify(updated));
      }
    } catch {}

    setPickups((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    if (selectedPickup && selectedPickup.id === id) {
      setSelectedPickup((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    setActionSuccess(`Pickup #${id.slice(0, 8)} status set to ${newStatus}`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const filtered = pickups.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all') {
      const hasCat = p.waste_items?.some((w) => w.category === categoryFilter);
      if (!hasCat) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchAddress = p.address?.toLowerCase().includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      return matchAddress || matchId || matchNotes;
    }
    return true;
  });

  const statusCounts: Record<string, number> = {
    all: pickups.length,
    pending: pickups.filter((p) => p.status === 'pending').length,
    accepted: pickups.filter((p) => p.status === 'accepted').length,
    in_progress: pickups.filter((p) => p.status === 'in_progress').length,
    completed: pickups.filter((p) => p.status === 'completed').length,
    cancelled: pickups.filter((p) => p.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Emerald Hero Header Banner (Consistent with Collector Portal) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-1 backdrop-blur-xs">
              <Truck className="w-3.5 h-3.5" />
              <span>Logistics Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Pickup Requests Oversight</span>
            </h1>
            <p className="text-sm text-[#A6D5B8] max-w-xl">
              Track live door-step collections, inspect verified weights, inspect payments, and manage status overrides.
            </p>
          </div>

          <div className="z-10 flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#136B3B] font-bold rounded-full text-xs shadow-xs hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full text-xs transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Action Success Toast */}
        {actionSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Admin Demo Mode active: Changes update local UI state immediately.</span>
          </div>
        )}

        {/* KPI Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">{statusCounts.all}</p>
              <p className="text-xs font-semibold text-[#526056] mt-1">Total Pickups</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">{statusCounts.pending}</p>
              <p className="text-xs font-semibold text-[#526056] mt-1">Pending</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">
                {(statusCounts.accepted || 0) + (statusCounts.in_progress || 0)}
              </p>
              <p className="text-xs font-semibold text-[#526056] mt-1">In Progress</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">{statusCounts.completed}</p>
              <p className="text-xs font-semibold text-[#526056] mt-1">Completed</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by address, pickup ID, or citizen notes…"
                className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAF9] rounded-xl border border-gray-200 text-xs sm:text-sm text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 focus:border-[#136B3B] transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:w-60">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2.5 px-3 bg-[#F8FAF9] rounded-xl border border-gray-200 text-xs font-bold text-[#191C1E] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30"
              >
                <option value="all">All Waste Categories</option>
                <option value="PAPER">Paper &amp; Cardboard</option>
                <option value="PLASTIC">Plastics (PET/HDPE)</option>
                <option value="METAL">Metals &amp; Utensils</option>
                <option value="E_WASTE">E-Waste &amp; Electronics</option>
                <option value="GLASS">Glass Bottles</option>
              </select>
            </div>
          </div>

          {/* Status Tab Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {([
              { key: 'all' as StatusFilter, label: 'All Pickups' },
              { key: 'pending' as StatusFilter, label: '⏳ Pending' },
              { key: 'accepted' as StatusFilter, label: '✅ Accepted' },
              { key: 'in_progress' as StatusFilter, label: '🔄 In Route' },
              { key: 'completed' as StatusFilter, label: '✔️ Completed' },
              { key: 'cancelled' as StatusFilter, label: '❌ Cancelled' },
            ]).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusFilter(t.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === t.key
                    ? 'bg-[#136B3B] text-white shadow-xs'
                    : 'bg-[#F8FAF9] border border-gray-200 text-[#526056] hover:bg-gray-100'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    statusFilter === t.key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {statusCounts[t.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-3xl mx-auto">
              🚚
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">No pickup requests match your filter</h3>
            <p className="text-xs text-[#6B7280]">
              Try clearing search terms or selecting &quot;All Pickups&quot;.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="px-4 py-2 bg-[#E6F4EA] hover:bg-[#D4EBD9] text-xs font-bold text-[#136B3B] rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pickups Grid (RequestCard Aesthetic) */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((pickup) => {
              const statusCfg = STATUS_LABELS[pickup.status] || {
                label: pickup.status,
                color: 'bg-gray-100 text-gray-800',
                badgeColor: 'bg-gray-100 text-gray-800',
              };
              const primaryItem = pickup.waste_items?.[0];
              const primaryLabel = primaryItem
                ? (WASTE_CATEGORY_LABELS[primaryItem.category]?.label ?? primaryItem.category)
                : 'Recyclables';

              return (
                <article
                  key={pickup.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-gray-200 transition-all flex flex-col justify-between space-y-3.5"
                >
                  <div className="space-y-3">
                    {/* Header: ID + Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-extrabold text-[#191C1E] bg-gray-100 px-2 py-0.5 rounded-lg">
                        #{pickup.id.slice(0, 10)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Address with MapPin */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#136B3B] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[#191C1E] font-bold break-words leading-relaxed">
                        {pickup.address}
                      </p>
                    </div>

                    {/* Weight & Waste Item Tags Box */}
                    <div className="bg-[#F8FAF9] p-3 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#6B7280] font-medium">Est. Weight:</span>
                        <span className="font-extrabold text-[#191C1E]">{pickup.total_estimated_weight_kg || 0} kg</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#6B7280] font-medium">Materials:</span>
                        <span className="font-bold text-emerald-800 truncate max-w-[170px]">
                          {primaryLabel}
                          {pickup.waste_items && pickup.waste_items.length > 1 ? ` +${pickup.waste_items.length - 1}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Schedule Date */}
                    <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>{pickup.scheduled_date || formatDate(pickup.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-500">
                      {pickup.collector_id ? '🚛 Collector Assigned' : '⏳ Awaiting Collector'}
                    </span>
                    <button
                      onClick={() => setSelectedPickup(pickup)}
                      className="px-3.5 py-1.5 bg-[#E6F4EA] hover:bg-[#D4EBD9] text-[#136B3B] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>

      {/* Pickup Detail Modal */}
      {selectedPickup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-[#191C1E]">
                  Pickup Request #{selectedPickup.id.slice(0, 10)}
                </h3>
                <p className="text-xs text-[#6B7280] font-medium">
                  Created {formatDate(selectedPickup.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedPickup(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 text-xs">
              <div>
                <span className="text-[10px] text-gray-500 font-semibold block">Citizen Household</span>
                <span className="font-bold text-[#191C1E] truncate block">
                  {resolveHouseholdName(selectedPickup.household?.full_name || selectedPickup.contact_name)}
                </span>
                <span className="text-[10.5px] font-mono text-blue-700">
                  {selectedPickup.household?.phone || selectedPickup.contact_phone || '+91 98201 54321'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-semibold block">Collector Partner</span>
                <span className="font-bold text-[#191C1E] truncate block">
                  {selectedPickup.collector_id
                    ? resolveCollectorName(selectedPickup.collector?.full_name)
                    : 'Awaiting Assignment'}
                </span>
                {selectedPickup.collector_id && (
                  <span className="text-[10.5px] font-mono text-[#136B3B]">
                    {selectedPickup.collector?.phone || '+91 98201 45892'}
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pickup Location</span>
              <p className="text-sm font-bold text-[#191C1E]">{selectedPickup.address}</p>
            </div>

            {/* Waste Items Breakdown */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itemized Waste Breakdown</span>
              <div className="bg-gray-50 rounded-2xl p-3 space-y-2">
                {selectedPickup.waste_items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#191C1E]">{WASTE_CATEGORY_LABELS[item.category]?.label ?? item.category}</span>
                      {item.notes && <p className="text-[10px] text-gray-500">{item.notes}</p>}
                    </div>
                    <span className="font-black text-[#191C1E] bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                      {item.approx_weight_kg} kg
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs font-bold">
                  <span>Total Estimated Weight</span>
                  <span>{selectedPickup.total_estimated_weight_kg || 0} kg</span>
                </div>
              </div>
            </div>

            {/* Citizen Notes */}
            {selectedPickup.notes && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Citizen Instructions</span>
                <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl">{selectedPickup.notes}</p>
              </div>
            )}

            {/* Payment Details if available */}
            {selectedPickup.payment_json && (
              <div className="space-y-1.5 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Settled Payment Receipt</span>
                </span>
                <div className="flex justify-between items-center text-xs text-emerald-950 font-bold">
                  <span>Payout Amount: ₹{(selectedPickup.payment_json as any).amount}</span>
                  <span className="uppercase text-[10px] bg-emerald-200 px-2 py-0.5 rounded-full">
                    {(selectedPickup.payment_json as any).method}
                  </span>
                </div>
              </div>
            )}

            {/* Admin Override Actions */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Status Override</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPickup.id, 'accepted')}
                  className="px-2.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition"
                >
                  Set Accepted
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPickup.id, 'completed')}
                  className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition"
                >
                  Set Completed
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedPickup.id, 'cancelled')}
                  className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel Request
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPickup(null)}
                className="px-5 py-2.5 bg-[#136B3B] hover:bg-[#0F5730] text-xs font-bold text-white rounded-full shadow-xs transition"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="admin" />
    </div>
  );
}
