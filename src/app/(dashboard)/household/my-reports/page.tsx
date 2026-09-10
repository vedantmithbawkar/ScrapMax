'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getMyReports } from '@/lib/reports-service';
import { Report, REPORT_STATUS_CONFIG, TRANSACTION_REPORT_CATEGORIES, PLATFORM_REPORT_CATEGORIES } from '@/types';
import { ArrowLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react';

type Tab = 'all' | 'transaction' | 'platform';

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

export default function MyReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      if (user) {
        const { reports: data } = await getMyReports(user.id);
        setReports(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = reports.filter((r) => {
    if (tab === 'all') return true;
    return r.report_type === tab;
  });

  const txnCount = reports.filter((r) => r.report_type === 'transaction').length;
  const platCount = reports.filter((r) => r.report_type === 'platform').length;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 flex-1">

        {/* Header */}
        <header className="flex items-center gap-3 pt-2 pb-5">
          <button onClick={() => router.back()} aria-label="Go back" className="p-1 -ml-1 hover:opacity-75 transition" type="button">
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">My Reports</h1>
            <p className="text-[12px] text-[#6B7280] font-medium">{reports.length} total report{reports.length !== 1 ? 's' : ''}</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {([
            { key: 'all', label: 'All', count: reports.length },
            { key: 'transaction', label: '🚩 Pickup Reports', count: txnCount },
            { key: 'platform', label: '🆘 Platform', count: platCount },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition ${
                tab === t.key
                  ? 'bg-[#191C1E] text-white'
                  : 'bg-white border border-gray-200 text-[#526056] hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${tab === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#136B3B] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-[#6B7280]">Loading your reports…</p>
          </div>
        )}

        {/* Not logged in */}
        {!loading && !userId && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">🔐</span>
            <p className="text-[16px] font-bold text-[#191C1E]">Sign in to see your reports</p>
            <Link href="/login" className="px-6 py-3 rounded-2xl bg-[#136B3B] text-white font-bold text-[14px]">Sign in</Link>
          </div>
        )}

        {/* Empty */}
        {!loading && userId && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">{tab === 'transaction' ? '🚩' : tab === 'platform' ? '🆘' : '📋'}</span>
            <p className="text-[16px] font-bold text-[#191C1E]">No reports yet</p>
            <p className="text-[13px] text-[#6B7280] max-w-xs">
              {tab === 'transaction'
                ? 'Use the 🚩 Report button on a pickup card to report a pickup problem.'
                : tab === 'platform'
                ? 'Use Report a Problem in Settings to report a platform issue.'
                : 'Your submitted reports will appear here.'}
            </p>
          </div>
        )}

        {/* Report cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((report) => {
              const statusCfg = REPORT_STATUS_CONFIG[report.status];
              const isPickup = report.report_type === 'transaction';
              return (
                <Link
                  key={report.id}
                  href={`/household/my-reports/${report.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPickup ? 'bg-red-50' : 'bg-orange-50'}`}>
                        <span className="text-xl leading-none">{getCategoryIcon(report)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isPickup ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                            {isPickup ? '🚩 PICKUP' : '🆘 PLATFORM'}
                          </span>
                        </div>
                        <p className="text-[14px] font-bold text-[#191C1E] truncate">{getCategoryLabel(report)}</p>
                        {report.subject && (
                          <p className="text-[12px] text-[#6B7280] truncate">{report.subject}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                          <span className="text-[11px] text-[#9CA3AF] font-medium">{formatDate(report.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-gray-50">
                    <p className="text-[11px] font-mono font-bold text-[#9CA3AF]">{report.report_number}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* File a new report CTA */}
        {!loading && userId && (
          <div className="mt-8 p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#191C1E]">Report a platform problem</p>
                <p className="text-[11px] text-[#6B7280]">Bug, login issue, or feedback</p>
              </div>
            </div>
            <Link
              href="/household/report"
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#F7F9FA] border border-gray-200 text-[12px] font-bold text-[#191C1E] hover:bg-gray-100 transition"
            >
              Report
            </Link>
          </div>
        )}

      </div>
      <BottomNav role="household" />
    </div>
  );
}
