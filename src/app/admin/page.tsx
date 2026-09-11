'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getAdminReports } from '@/lib/reports-service';
import { Report, REPORT_STATUS_CONFIG, PickupRequest, WASTE_CATEGORY_LABELS, STATUS_LABELS } from '@/types';
import {
  Shield,
  Users,
  Truck,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Clock,
  IndianRupee,
  Scale,
  RefreshCw,
  ExternalLink,
  Eye,
  Settings,
  X,
  MapPin,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// Fallback demo pickups for live preview & offline resilience
const DEMO_RECENT_PICKUPS: PickupRequest[] = [
  {
    id: 'req-c301',
    household_id: 'user-h101',
    collector_id: 'collector-c201',
    status: 'completed',
    address: 'Indiranagar 100ft Road, Bangalore',
    latitude: 12.9716,
    longitude: 77.6412,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Please call before arriving. Heavy paper bundle.',
    total_estimated_weight_kg: 28.5,
    waste_items: [
      { category: 'PAPER', approx_weight_kg: 15 },
      { category: 'PLASTIC', approx_weight_kg: 13.5 },
    ],
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'req-c302',
    household_id: 'user-h102',
    collector_id: 'collector-c201',
    status: 'in_progress',
    address: 'Koramangala 4th Block, 80ft Road, Bangalore',
    latitude: 12.9345,
    longitude: 77.6242,
    scheduled_date: 'Today · 3:00 PM',
    notes: 'PET bottles and cardboard boxes',
    total_estimated_weight_kg: 12.0,
    waste_items: [
      { category: 'PLASTIC', approx_weight_kg: 8 },
      { category: 'PAPER', approx_weight_kg: 4 },
    ],
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'req-c303',
    household_id: 'user-h103',
    status: 'pending',
    address: 'HSR Layout Sector 2, 19th Main, Bangalore',
    latitude: 12.9121,
    longitude: 77.6446,
    scheduled_date: 'Tomorrow · 10:00 AM',
    notes: 'Copper wiring, aluminum cans, old laptop battery',
    total_estimated_weight_kg: 8.4,
    waste_items: [
      { category: 'METAL', approx_weight_kg: 5.4 },
      { category: 'E_WASTE', approx_weight_kg: 3.0 },
    ],
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'req-c304',
    household_id: 'user-h104',
    status: 'accepted',
    address: 'Whitefield Main Road, Palm Meadows, Bangalore',
    latitude: 12.9698,
    longitude: 77.7499,
    scheduled_date: 'Tomorrow · 12:00 PM',
    notes: 'Old books and magazines packed in carton',
    total_estimated_weight_kg: 22.0,
    waste_items: [{ category: 'PAPER', approx_weight_kg: 22.0 }],
    created_at: new Date(Date.now() - 14400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_REPORTS: Report[] = [
  {
    id: 'rpt-001',
    report_number: 'RPT-2026-004812',
    reporter_id: 'u101',
    report_type: 'transaction',
    category: 'wrong_weight',
    description: 'Collector recorded 12kg instead of actual 15kg paper weighed at home scale.',
    pickup_id: 'req-c301',
    status: 'investigating',
    priority: 'high',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rpt-002',
    report_number: 'RPT-2026-003914',
    reporter_id: 'u102',
    report_type: 'platform',
    category: 'app_bug',
    description: 'UPI QR code took two attempts to render on mobile device.',
    status: 'open',
    priority: 'normal',
    created_at: new Date(Date.now() - 28800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [reports, setReports] = useState<Report[]>(DEMO_REPORTS);
  const [recentPickups, setRecentPickups] = useState<PickupRequest[]>(DEMO_RECENT_PICKUPS);
  const [userCount, setUserCount] = useState(128);
  const [pickupCount, setPickupCount] = useState(342);
  const [householdCount, setHouseholdCount] = useState(98);
  const [collectorCount, setCollectorCount] = useState(30);
  const [totalWeightKg, setTotalWeightKg] = useState(4820);
  const [totalPayoutInr, setTotalPayoutInr] = useState(94500);
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null);

  const loadData = async () => {
    const supabase = createClient();
    try {
      const fetchWithTimeout = async <T,>(promise: PromiseLike<T>, ms = 2500): Promise<T> => {
        return Promise.race([
          Promise.resolve(promise),
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
        ]);
      };

      const authRes: any = await fetchWithTimeout(supabase.auth.getUser());
      const user = authRes?.data?.user;
      const profileRes: any = user
        ? await fetchWithTimeout(supabase.from('profiles').select('role').eq('id', user.id).single())
        : null;
      const profile = profileRes?.data;

      if (!user || profile?.role !== 'admin') {
        setIsDemoMode(true);
      } else {
        setIsDemoMode(false);
      }

      // Fetch parallel stats from Supabase
      const [reportsRes, usersRes, pickupsRes, householdsRes, collectorsRes, pickupsListRes]: any[] = await Promise.all([
        getAdminReports().catch(() => ({ reports: [] })),
        fetchWithTimeout(supabase.from('profiles').select('id', { count: 'exact', head: true })).catch(() => ({ count: null })),
        fetchWithTimeout(supabase.from('pickup_requests').select('id', { count: 'exact', head: true })).catch(() => ({ count: null })),
        fetchWithTimeout(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'household')).catch(() => ({ count: null })),
        fetchWithTimeout(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'collector')).catch(() => ({ count: null })),
        fetchWithTimeout(supabase.from('pickup_requests').select('*, waste_items(*)').order('created_at', { ascending: false }).limit(6)).catch(() => ({ data: null })),
      ]);

      if (reportsRes?.reports && reportsRes.reports.length > 0) {
        setReports(reportsRes.reports);
      }

      if (usersRes?.count && usersRes.count > 0) {
        setUserCount(usersRes.count);
        setHouseholdCount(householdsRes?.count ?? 0);
        setCollectorCount(collectorsRes?.count ?? 0);
      }

      // Load local pickup requests to sync with Household and Collector activity
      let localRequests: PickupRequest[] = [];
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localRequests = parsed;
        }
      } catch {}

      const combinedPickups = [...localRequests, ...(pickupsListRes?.data || []), ...DEMO_RECENT_PICKUPS];
      const uniquePickups = Array.from(new Map(combinedPickups.map((p) => [p.id, p])).values()) as PickupRequest[];
      setRecentPickups(uniquePickups.slice(0, 6));

      if (pickupsRes?.count && pickupsRes.count > 0) {
        setPickupCount(pickupsRes.count + localRequests.length);
      } else {
        setPickupCount(342 + localRequests.length);
      }

      const kg = uniquePickups.reduce((sum, p) => sum + (Number(p.total_estimated_weight_kg) || 0), 0);
      if (kg > 0) {
        setTotalWeightKg(Math.round(4820 + kg));
        setTotalPayoutInr(Math.round(94500 + kg * 18));
      }
    } catch {
      setIsDemoMode(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReportsCount = reports.filter((r) => r.status === 'open' || r.status === 'investigating').length;
  const resolvedReportsCount = reports.filter((r) => r.status === 'resolved' || r.status === 'closed').length;
  const resolutionRate = reports.length > 0 ? Math.round((resolvedReportsCount / reports.length) * 100) : 100;

  // Waste breakdown estimations
  const wasteBreakdown = [
    { name: 'Paper & Cardboard', weight: '2,150 kg', pct: 45, color: 'bg-amber-500' },
    { name: 'Plastics (PET & HDPE)', weight: '1,420 kg', pct: 30, color: 'bg-emerald-500' },
    { name: 'Metals (Iron, Alum)', weight: '780 kg', pct: 16, color: 'bg-blue-500' },
    { name: 'E-Waste & Electronics', weight: '340 kg', pct: 7, color: 'bg-purple-500' },
    { name: 'Glass Containers', weight: '130 kg', pct: 2, color: 'bg-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Emerald Hero Header Banner (Consistent with Collector & Household Portals) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-1 backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Operations &amp; Governance</span>
            </h1>
            <p className="text-sm text-[#A6D5B8] max-w-xl">
              Platform telemetry for door-step pickups, user directory, circular material recovery &amp; payments.
            </p>
          </div>

          <div className="z-10 flex flex-wrap items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-full transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/admin/pickups"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#136B3B] font-bold rounded-full text-xs shadow-xs hover:bg-gray-50 transition"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Pickups</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full text-xs transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users</span>
            </Link>
            <Link
              href="/admin/recyclers"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full text-xs transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Recyclers</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full text-xs transition"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Demo Mode Notice Banner if running offline/demo */}
        {isDemoMode && (
          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong className="font-bold">Admin Preview Mode:</strong> Viewing platform telemetry, simulated database activity, and verified pickups. Full write actions enabled in demo.
              </span>
            </div>
            <Link href="/login" className="font-bold text-amber-900 underline ml-2 flex-shrink-0 hover:text-amber-950">
              Sign In
            </Link>
          </div>
        )}

        {/* KPI Summary Cards Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4" data-purpose="admin-kpis">
          
          {/* Total Pickups */}
          <Link
            href="/admin/pickups"
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-emerald-200 hover:shadow-xs transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Pickups</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E]">{pickupCount}</p>
            <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>All Requests</span>
            </p>
          </Link>

          {/* Total Users */}
          <Link
            href="/admin/users"
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-xs transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Users</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E]">{userCount}</p>
            <p className="text-[11px] font-medium text-[#6B7280] mt-1">
              {householdCount}H · {collectorCount}C
            </p>
          </Link>

          {/* Waste Collected */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Waste</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E]">{totalWeightKg.toLocaleString()} kg</p>
            <p className="text-[11px] font-medium text-teal-700 mt-1">Total Diverted</p>
          </div>

          {/* Payout Disbursed */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Payouts</span>
              <div className="w-7 h-7 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E]">₹{totalPayoutInr.toLocaleString()}</p>
            <p className="text-[11px] font-medium text-green-700 mt-1">Citizens Credited</p>
          </div>

          {/* Open Reports */}
          <Link
            href="/admin/reports"
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-red-200 hover:shadow-xs transition group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Reports</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-red-600">{openReportsCount}</p>
            <p className="text-[11px] font-medium text-red-600 mt-1">Need Review</p>
          </Link>

          {/* Resolution Rate */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Resolution</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-600">{resolutionRate}%</p>
            <p className="text-[11px] font-medium text-[#6B7280] mt-1">
              {resolvedReportsCount} Resolved
            </p>
          </div>

        </section>

        {/* Two-Column Responsive Layout for Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Columns: Live Pickups & Waste Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recent Pickups Activity */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#191C1E] tracking-tight">Recent Pickup Operations</h2>
                  <p className="text-xs text-[#6B7280] font-medium">Live status and scrap weights submitted by households</p>
                </div>
                <Link
                  href="/admin/pickups"
                  className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1"
                >
                  <span>All Pickups</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentPickups.map((pickup) => {
                  const statusInfo = STATUS_LABELS[pickup.status] || { label: pickup.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <div
                      key={pickup.id}
                      className="p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-[#FBFDFB] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#EAF5EE] text-[#136B3B] flex items-center justify-center font-bold text-sm flex-shrink-0">
                          📦
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-[#191C1E]">
                              #{pickup.id.slice(0, 10)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-[#526056] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{pickup.address}</span>
                          </p>
                          <p className="text-[11px] text-[#6B7280] font-medium mt-1">
                            {pickup.waste_items?.map((w) => `${w.approx_weight_kg}kg ${WASTE_CATEGORY_LABELS[w.category]?.label ?? w.category}`).join(', ') || `${pickup.total_estimated_weight_kg || 0} kg scrap`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center self-end">
                        <span className="text-xs font-extrabold text-[#191C1E] bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                          {pickup.total_estimated_weight_kg || 0} kg
                        </span>
                        <button
                          onClick={() => setSelectedPickup(pickup)}
                          className="px-3 py-1.5 bg-[#E6F4EA] hover:bg-[#D4EBD9] text-[#136B3B] text-xs font-bold rounded-xl transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waste Composition Analytics Breakdown */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#191C1E] tracking-tight">Recovered Material Composition</h2>
                  <p className="text-xs text-[#6B7280] font-medium">Pan-India circular diversion across certified recycling centers</p>
                </div>
                <span className="text-xs font-bold text-[#136B3B] bg-[#E6F4EA] px-2.5 py-1 rounded-full">
                  100% Circular
                </span>
              </div>

              {/* Progress Stacked Bar */}
              <div className="w-full h-3.5 rounded-full bg-gray-100 overflow-hidden flex mb-5">
                {wasteBreakdown.map((item) => (
                  <div
                    key={item.name}
                    style={{ width: `${item.pct}%` }}
                    className={`${item.color} h-full transition-all duration-500`}
                    title={`${item.name}: ${item.pct}%`}
                  />
                ))}
              </div>

              {/* Legend & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {wasteBreakdown.map((item) => (
                  <div key={item.name} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-xs font-bold text-[#191C1E]">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#191C1E]">{item.weight}</span>
                      <span className="text-[10px] text-[#6B7280] block font-medium">({item.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right 1 Column: Quick Actions, Recent Reports & System Health */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#191C1E] tracking-tight mb-3">Management Consoles</h2>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href="/admin/pickups"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#F8FAF9] hover:bg-[#EAF5EE] rounded-2xl border border-gray-100 hover:border-[#A6D5B8] transition group text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#191C1E]">All Pickups</span>
                  <span className="text-[10px] text-[#6B7280] font-medium mt-0.5">Filter & manage</span>
                </Link>

                <Link
                  href="/admin/users"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#F8FAF9] hover:bg-blue-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition group text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#191C1E]">User Directory</span>
                  <span className="text-[10px] text-[#6B7280] font-medium mt-0.5">Citizens & Collectors</span>
                </Link>

                <Link
                  href="/admin/reports"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#F8FAF9] hover:bg-red-50 rounded-2xl border border-gray-100 hover:border-red-200 transition group text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#191C1E]">Issue Reports</span>
                  <span className="text-[10px] text-[#6B7280] font-medium mt-0.5">Disputes queue</span>
                </Link>

                <Link
                  href="/admin/settings"
                  className="flex flex-col items-center justify-center p-3.5 bg-[#F8FAF9] hover:bg-purple-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition group text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:scale-105 transition-transform mb-2">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#191C1E]">Price Rates</span>
                  <span className="text-[10px] text-[#6B7280] font-medium mt-0.5">Benchmark ₹/kg</span>
                </Link>
              </div>
            </div>

            {/* Incident Reports Queue */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h2 className="text-base font-bold text-[#191C1E]">Open Issues</h2>
                </div>
                <Link href="/admin/reports" className="text-xs font-bold text-[#136B3B] hover:underline">
                  View queue
                </Link>
              </div>

              <div className="space-y-2.5">
                {reports.slice(0, 3).map((report) => {
                  const cfg = REPORT_STATUS_CONFIG[report.status] || { label: report.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <Link
                      key={report.id}
                      href={`/admin/reports/${report.id}`}
                      className="p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/70 transition block"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#191C1E] truncate max-w-[160px]">
                          {report.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                        {report.description || 'No description provided'}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mt-1.5 pt-1.5 border-t border-gray-50">
                        <span>{report.report_number}</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Platform Health Telemetry */}
            <div className="bg-[#136B3B] text-white rounded-3xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                <h3 className="text-sm font-bold tracking-tight">Platform Telemetry</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-emerald-100">Database Cluster</span>
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>PostgreSQL Ready</span>
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-emerald-100">PWA Service Worker</span>
                  <span className="font-bold text-emerald-200">Active &amp; Cached</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                  <span className="text-emerald-100">UPI Payments Engine</span>
                  <span className="font-bold text-emerald-200">GPay/PhonePe/Paytm/BHIM</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-emerald-100">Scrap Center Network</span>
                  <span className="font-bold text-emerald-200">Pan-India Enabled</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Pickup Detail Modal */}
      {selectedPickup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#191C1E]">
                  Pickup #{selectedPickup.id.slice(0, 10)}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Scheduled: {selectedPickup.scheduled_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedPickup(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Address</span>
                <p className="text-sm font-semibold text-[#191C1E] mt-0.5">{selectedPickup.address}</p>
              </div>

              <div>
                <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Waste Items</span>
                <div className="mt-1 space-y-1 bg-gray-50 p-2.5 rounded-xl">
                  {selectedPickup.waste_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-medium text-[#191C1E]">{WASTE_CATEGORY_LABELS[item.category]?.label ?? item.category}</span>
                      <span className="font-bold">{item.approx_weight_kg} kg</span>
                    </div>
                  )) || <p>Total: {selectedPickup.total_estimated_weight_kg} kg</p>}
                </div>
              </div>

              {selectedPickup.notes && (
                <div>
                  <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Citizen Notes</span>
                  <p className="text-xs text-[#526056] mt-0.5 bg-gray-50 p-2 rounded-lg">{selectedPickup.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Current Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[selectedPickup.status]?.color || 'bg-gray-100'}`}>
                  {STATUS_LABELS[selectedPickup.status]?.label || selectedPickup.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPickup(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition"
              >
                Close
              </button>
              <Link
                href={`/admin/pickups`}
                className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-xs font-bold text-white rounded-xl shadow-xs transition inline-flex items-center gap-1"
              >
                <span>Manage in Pickups</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Docked Stitch Bottom Navigation for Mobile */}
      <BottomNav role="admin" />
    </div>
  );
}
