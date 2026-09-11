'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getAdminReports } from '@/lib/reports-service';
import {
  Report,
  ReportStatus,
  REPORT_STATUS_CONFIG,
  REPORT_PRIORITY_CONFIG,
  TRANSACTION_REPORT_CATEGORIES,
  PLATFORM_REPORT_CATEGORIES,
} from '@/types';
import {
  ArrowLeft,
  Search,
  AlertTriangle,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function getCategoryInfo(report: Report) {
  if (report.report_type === 'transaction') {
    return TRANSACTION_REPORT_CATEGORIES[report.category as keyof typeof TRANSACTION_REPORT_CATEGORIES] ?? { label: report.category, icon: '🚩' };
  }
  return PLATFORM_REPORT_CATEGORIES[report.category as keyof typeof PLATFORM_REPORT_CATEGORIES] ?? { label: report.category, icon: '🆘' };
}

const DEMO_REPORTS: Report[] = [
  {
    id: 'rpt-001',
    report_number: 'RPT-2026-004812',
    reporter_id: 'u101',
    report_type: 'transaction',
    category: 'wrong_weight',
    description: 'Collector recorded 12 kg paper instead of 15 kg weighed on home scale.',
    pickup_id: 'req-c301',
    collector_id: 'collector-c201',
    status: 'investigating',
    priority: 'high',
    created_at: new Date(Date.now() - 3600000).toISOString(),
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
    created_at: new Date(Date.now() - 18000000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rpt-003',
    report_number: 'RPT-2026-002190',
    reporter_id: 'u103',
    report_type: 'transaction',
    category: 'wrong_price',
    description: 'Received ₹450 instead of promised ₹495 rate for 15kg paper and plastic.',
    pickup_id: 'req-c302',
    collector_id: 'collector-c201',
    status: 'resolved',
    priority: 'normal',
    resolution: 'Collector refunded difference of ₹45 via UPI.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'rpt-004',
    report_number: 'RPT-2026-001855',
    reporter_id: 'u104',
    report_type: 'platform',
    category: 'account_login',
    description: 'Profile phone number update required admin verification.',
    status: 'closed',
    priority: 'low',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AdminReportsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [reports, setReports] = useState<Report[]>(DEMO_REPORTS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (profile?.role !== 'admin') {
            setIsDemoMode(true);
          }
        } else {
          setIsDemoMode(true);
        }

        const res = await getAdminReports();
        if (res.reports && res.reports.length > 0) {
          setReports(res.reports);
        } else {
          setReports(DEMO_REPORTS);
        }
      } catch {
        setIsDemoMode(true);
        setReports(DEMO_REPORTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = reports.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.report_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = r.report_number.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      return matchNum || matchCat || matchDesc;
    }
    return true;
  });

  const counts = {
    all: reports.length,
    open: reports.filter((r) => r.status === 'open').length,
    investigating: reports.filter((r) => r.status === 'investigating').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    closed: reports.filter((r) => r.status === 'closed').length,
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Emerald Hero Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-1 backdrop-blur-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trust &amp; Safety</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Disputes &amp; Issue Reports</span>
            </h1>
            <p className="text-sm text-[#A6D5B8] max-w-xl">
              Investigating {reports.length} citizen dispute submissions, weight mismatches, payment audits &amp; platform bugs.
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
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {isDemoMode && (
          <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Admin Demo Mode: Reviewing active dispute and incident tickets.</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by report number (e.g. RPT-2026), category, or description…"
                className="w-full pl-11 pr-4 py-3 bg-[#F8FAF9] rounded-2xl border border-gray-200 text-sm text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 focus:border-[#136B3B] transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 sm:w-64">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full py-3 px-3 bg-[#F8FAF9] rounded-2xl border border-gray-200 text-xs font-bold text-[#191C1E] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30"
              >
                <option value="all">All Report Types</option>
                <option value="transaction">Pickup Disputes</option>
                <option value="platform">Platform Bugs &amp; Issues</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { key: 'all', label: 'All Reports' },
              { key: 'open', label: '⏳ Open' },
              { key: 'investigating', label: '🔍 Investigating' },
              { key: 'resolved', label: '✅ Resolved' },
              { key: 'closed', label: '🔒 Closed' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusFilter(t.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === t.key
                    ? 'bg-[#191C1E] text-white shadow-xs'
                    : 'bg-[#F8FAF9] border border-gray-200 text-[#526056] hover:bg-gray-100'
                }`}
              >
                <span>{t.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    statusFilter === t.key ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {counts[t.key as keyof typeof counts] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#136B3B] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Loading reports queue…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-md mx-auto space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-[#191C1E]">No reports in this view</h3>
            <p className="text-xs text-[#6B7280]">All reports matching your criteria are cleared or resolved.</p>
          </div>
        )}

        {/* Reports Responsive Cards Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((report) => {
              const catInfo = getCategoryInfo(report);
              const statusCfg = REPORT_STATUS_CONFIG[report.status] || { label: report.status, color: 'bg-gray-100 text-gray-800' };
              const prioCfg = REPORT_PRIORITY_CONFIG[report.priority] || { label: report.priority, color: 'text-gray-600' };

              return (
                <Link
                  key={report.id}
                  href={`/admin/reports/${report.id}`}
                  className="bg-white rounded-3xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    {/* Top line: Category + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                          {catInfo.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-[#191C1E] group-hover:text-[#136B3B] transition-colors leading-tight">
                            {catInfo.label}
                          </h3>
                          <span className="font-mono text-[11px] text-[#6B7280]">
                            {report.report_number}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>

                    {/* Description snippet */}
                    <p className="text-xs text-[#526056] line-clamp-2 leading-relaxed bg-[#F8FAF9] p-3 rounded-2xl">
                      {report.description || 'No additional details provided.'}
                    </p>

                    {/* Resolution snippet if resolved */}
                    {report.resolution && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900">
                        <span className="font-bold">Resolution: </span>
                        <span>{report.resolution}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer metadata */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-[#6B7280]">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold capitalize ${prioCfg.color}`}>
                        {report.priority} priority
                      </span>
                      {report.pickup_id && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-[11px]">#{report.pickup_id.slice(0, 8)}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[#136B3B] font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </main>

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="admin" />
    </div>
  );
}
