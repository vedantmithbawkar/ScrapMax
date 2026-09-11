'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { getReportById } from '@/lib/reports-service';
import {
  Report, ReportEvent,
  REPORT_STATUS_CONFIG, REPORT_PRIORITY_CONFIG,
  TRANSACTION_REPORT_CATEGORIES, PLATFORM_REPORT_CATEGORIES,
} from '@/types';
import { ArrowLeft, Calendar, Tag, Hash, Circle } from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getCategoryInfo(report: Report) {
  if (report.report_type === 'transaction') {
    const cat = TRANSACTION_REPORT_CATEGORIES[report.category as keyof typeof TRANSACTION_REPORT_CATEGORIES];
    return cat ?? { label: report.category, icon: '🚩', description: '' };
  }
  const cat = PLATFORM_REPORT_CATEGORIES[report.category as keyof typeof PLATFORM_REPORT_CATEGORIES];
  return cat ?? { label: report.category, icon: '🆘', description: '' };
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Report created',
  status_change: 'Status updated',
  priority_change: 'Priority changed',
  note_added: 'Note added by admin',
  resolved: 'Report resolved',
};

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params?.reportId as string;

  const [report, setReport] = useState<Report | null>(null);
  const [events, setEvents] = useState<ReportEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!reportId) return;
      const { report: data, events: evts } = await getReportById(reportId);
      setReport(data);
      setEvents(evts);
      setLoading(false);
    }
    load();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#136B3B] border-t-transparent rounded-full animate-spin" />
        </div>
        <BottomNav role="household" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <span className="text-5xl">🔍</span>
          <p className="text-[18px] font-bold text-[#191C1E]">Report not found</p>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-2xl bg-[#136B3B] text-white font-bold text-[14px]">Go back</button>
        </div>
        <BottomNav role="household" />
      </div>
    );
  }

  const catInfo = getCategoryInfo(report);
  const statusCfg = (report.status && REPORT_STATUS_CONFIG[report.status]) || REPORT_STATUS_CONFIG['open'];
  const priorityCfg = (report.priority && REPORT_PRIORITY_CONFIG[report.priority]) || REPORT_PRIORITY_CONFIG['normal'];
  const isPickup = report.report_type === 'transaction';

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
            <h1 className="text-[20px] font-extrabold tracking-tight">Report Detail</h1>
            <p className="text-[12px] font-mono font-bold text-[#6B7280]">{report.report_number}</p>
          </div>
        </header>

        {/* Type badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[12px] font-bold ${isPickup ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
          {isPickup ? '🚩 Pickup Report' : '🆘 Platform Problem'}
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

          {/* Category + status row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{catInfo.icon}</span>
              <div>
                <p className="text-[16px] font-bold text-[#191C1E]">{catInfo.label}</p>
                {report.subject && <p className="text-[13px] text-[#6B7280]">{report.subject}</p>}
              </div>
            </div>
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full ${statusCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#9CA3AF]" />
              <div>
                <p className="text-[10px] text-[#9CA3AF] font-medium">Filed on</p>
                <p className="text-[12px] font-bold text-[#191C1E]">{formatDate(report.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#9CA3AF]" />
              <div>
                <p className="text-[10px] text-[#9CA3AF] font-medium">Priority</p>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${priorityCfg.color}`}>{priorityCfg.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#9CA3AF]" />
              <div>
                <p className="text-[10px] text-[#9CA3AF] font-medium">Report ID</p>
                <p className="text-[12px] font-bold text-[#191C1E] font-mono">{report.report_number}</p>
              </div>
            </div>
            {isPickup && report.pickup_id && (
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-[#9CA3AF]" />
                <div>
                  <p className="text-[10px] text-[#9CA3AF] font-medium">Pickup ID</p>
                  <p className="text-[12px] font-bold text-[#191C1E] font-mono">#{report.pickup_id.slice(0, 8)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {report.description && (
            <>
              <hr className="border-gray-100" />
              <div>
                <p className="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-[14px] text-[#191C1E] leading-relaxed">{report.description}</p>
              </div>
            </>
          )}

          {/* Resolution */}
          {report.resolution && (
            <>
              <hr className="border-gray-100" />
              <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">✅ Resolution</p>
                <p className="text-[13px] text-emerald-800 leading-relaxed">{report.resolution}</p>
              </div>
            </>
          )}
        </div>

        {/* Event timeline */}
        <div className="mt-6">
          <h2 className="text-[15px] font-bold text-[#191C1E] mb-3">Activity Timeline</h2>
          {events.length === 0 ? (
            <p className="text-[13px] text-[#9CA3AF] text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-0">
              {events.map((evt, i) => (
                <div key={evt.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${i === 0 ? 'bg-[#136B3B]' : 'bg-gray-300'}`} />
                    {i < events.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 my-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-[13px] font-bold text-[#191C1E]">{EVENT_LABELS[evt.event_type] ?? evt.event_type}</p>
                    {evt.old_value && evt.new_value && (
                      <p className="text-[12px] text-[#6B7280]">
                        <span className="line-through text-gray-400">{evt.old_value}</span>
                        {' → '}
                        <span className="font-bold text-[#136B3B]">{evt.new_value}</span>
                      </p>
                    )}
                    {evt.note && <p className="text-[12px] text-[#526056] mt-0.5 italic">{evt.note}</p>}
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formatDate(evt.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <BottomNav role="household" />
    </div>
  );
}
