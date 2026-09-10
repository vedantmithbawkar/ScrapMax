'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAdminReports } from '@/lib/reports-service';
import {
  Report, ReportStatus, REPORT_STATUS_CONFIG, REPORT_PRIORITY_CONFIG,
  TRANSACTION_REPORT_CATEGORIES, PLATFORM_REPORT_CATEGORIES,
} from '@/types';
import { Shield, Filter, ChevronRight, ArrowLeft } from 'lucide-react';

type TypeFilter = 'all' | 'transaction' | 'platform';
type StatusFilter = 'all' | ReportStatus;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getCategoryLabel(report: Report): string {
  if (report.report_type === 'transaction') {
    return TRANSACTION_REPORT_CATEGORIES[report.category as keyof typeof TRANSACTION_REPORT_CATEGORIES]?.label ?? report.category;
  }
  return PLATFORM_REPORT_CATEGORIES[report.category as keyof typeof PLATFORM_REPORT_CATEGORIES]?.label ?? report.category;
}

function getCategoryIcon(report: Report): string {
  if (report.report_type === 'transaction') {
    return TRANSACTION_REPORT_CATEGORIES[report.category as keyof typeof TRANSACTION_REPORT_CATEGORIES]?.icon ?? '🚩';
  }
  return PLATFORM_REPORT_CATEGORIES[report.category as keyof typeof PLATFORM_REPORT_CATEGORIES]?.icon ?? '🆘';
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/household'); return; }

      setIsAdmin(true);
      const { reports: data } = await getAdminReports();
      setReports(data);
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = reports.filter((r) => {
    if (typeFilter !== 'all' && r.report_type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === 'open').length,
    under_review: reports.filter((r) => r.status === 'under_review' || r.status === 'investigating').length,
    resolved: reports.filter((r) => r.status === 'resolved' || r.status === 'closed').length,
  };

  if (!isAdmin && !loading) return null;

  return (
    <div className="min-h-screen bg-[#0F1117] text-white font-sans">
      {/* Admin Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[16px] font-bold">ScrapMax Admin</span>
            <span className="ml-2 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Reports</span>
          </div>
        </div>
        <button onClick={() => router.push('/household')} className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to App
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'bg-white/10' },
            { label: 'Open', value: stats.open, color: 'bg-red-500/20 text-red-400' },
            { label: 'In Progress', value: stats.under_review, color: 'bg-amber-500/20 text-amber-400' },
            { label: 'Resolved', value: stats.resolved, color: 'bg-emerald-500/20 text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
              <p className="text-[28px] font-black leading-none mb-1">{s.value}</p>
              <p className="text-[12px] font-medium opacity-70">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-1.5 mr-2">
            <Filter className="w-4 h-4 text-white/50" />
            <span className="text-[12px] text-white/50 font-medium">Type:</span>
          </div>
          {(['all', 'transaction', 'platform'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition ${typeFilter === t ? 'bg-white text-[#0F1117]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              {t === 'all' ? 'All Types' : t === 'transaction' ? '🚩 Pickup' : '🆘 Platform'}
            </button>
          ))}
          <div className="w-px bg-white/10 mx-1" />
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[12px] text-white/50 font-medium">Status:</span>
          </div>
          {(['all', 'open', 'under_review', 'investigating', 'resolved', 'closed'] as const).map((s) => {
            const cfg = s !== 'all' ? REPORT_STATUS_CONFIG[s] : null;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition ${statusFilter === s ? 'bg-white text-[#0F1117]' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {s === 'all' ? 'All Statuses' : cfg?.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-white/40">
            <p className="text-[16px] font-bold">No reports found</p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((report) => {
              const statusCfg = REPORT_STATUS_CONFIG[report.status];
              const priorityCfg = REPORT_PRIORITY_CONFIG[report.priority];
              const isPickup = report.report_type === 'transaction';
              return (
                <Link
                  key={report.id}
                  href={`/admin/reports/${report.id}`}
                  className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-4 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl leading-none">{getCategoryIcon(report)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPickup ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {isPickup ? 'PICKUP' : 'PLATFORM'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityCfg.color}`}>
                        {priorityCfg.label}
                      </span>
                    </div>
                    <p className="text-[14px] font-bold text-white truncate">{getCategoryLabel(report)}</p>
                    {report.subject && <p className="text-[12px] text-white/50 truncate">{report.subject}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                      <span className="text-[11px] text-white/40 font-mono">{report.report_number}</span>
                      <span className="text-[11px] text-white/40">{formatDate(report.created_at)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
