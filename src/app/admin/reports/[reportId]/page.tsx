'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getReportById, updateReportStatus, updateReportPriority, addAdminNote } from '@/lib/reports-service';
import {
  Report, ReportEvent, ReportStatus, ReportPriority,
  REPORT_STATUS_CONFIG, REPORT_PRIORITY_CONFIG,
  TRANSACTION_REPORT_CATEGORIES, PLATFORM_REPORT_CATEGORIES,
} from '@/types';
import { ArrowLeft, Shield, Save, Loader2 } from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getCategoryInfo(report: Report) {
  if (report.report_type === 'transaction') {
    return TRANSACTION_REPORT_CATEGORIES[report.category as keyof typeof TRANSACTION_REPORT_CATEGORIES] ?? { label: report.category, icon: '🚩' };
  }
  return PLATFORM_REPORT_CATEGORIES[report.category as keyof typeof PLATFORM_REPORT_CATEGORIES] ?? { label: report.category, icon: '🆘' };
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Report created',
  status_change: 'Status updated',
  priority_change: 'Priority changed',
  note_added: 'Admin note added',
  resolved: 'Resolved',
};

export default function AdminReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params?.reportId as string;

  const [report, setReport] = useState<Report | null>(null);
  const [events, setEvents] = useState<ReportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState<string | null>(null);

  // Admin actions state
  const [newStatus, setNewStatus] = useState<ReportStatus | ''>('');
  const [newPriority, setNewPriority] = useState<ReportPriority | ''>('');
  const [noteText, setNoteText] = useState('');
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setAdminId(user?.id || 'admin-demo-id');

        const { report: data, events: evts } = await getReportById(reportId);
        if (data) {
          setReport(data);
          setEvents(evts);
          setNewStatus(data.status ?? '');
          setNewPriority(data.priority ?? '');
          setNoteText(data.admin_notes ?? '');
          setResolution(data.resolution ?? '');
        } else {
          // Fallback demo report
          const demo: Report = {
            id: reportId,
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
          };
          setReport(demo);
          setNewStatus(demo.status);
          setNewPriority(demo.priority);
        }
      } catch {
        // demo fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportId]);

  async function handleSave() {
    if (!report || !adminId) return;
    setSaving(true);

    if (newStatus && newStatus !== report.status) {
      await updateReportStatus({
        reportId: report.id,
        actorId: adminId,
        oldStatus: report.status,
        newStatus: newStatus as ReportStatus,
        note: noteText || undefined,
        resolution: resolution || undefined,
      });
    }
    if (newPriority && newPriority !== report.priority) {
      await updateReportPriority({
        reportId: report.id,
        actorId: adminId,
        oldPriority: report.priority,
        newPriority: newPriority as ReportPriority,
      });
    }
    if (noteText && noteText !== report.admin_notes) {
      await addAdminNote({ reportId: report.id, actorId: adminId, note: noteText });
    }

    // Refresh
    const { report: updated, events: updatedEvts } = await getReportById(reportId);
    setReport(updated);
    setEvents(updatedEvts);
    setSaving(false);
    setSaveMsg('Changes saved!');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen bg-[#0F1117] text-white flex flex-col items-center justify-center gap-4">
      <p className="text-[18px] font-bold">Report not found</p>
      <button onClick={() => router.back()} className="px-6 py-3 rounded-2xl bg-emerald-500 font-bold text-[14px]">Go back</button>
    </div>
  );

  const catInfo = getCategoryInfo(report);
  const statusCfg = REPORT_STATUS_CONFIG[report.status];
  const priorityCfg = REPORT_PRIORITY_CONFIG[report.priority];

  return (
    <div className="min-h-screen bg-[#0F1117] text-white font-sans">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-[16px] font-bold">Admin · Report Detail</span>
        </div>
        <button onClick={() => router.push('/admin')} className="flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> All Reports
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Report info */}
        <div className="lg:col-span-2 space-y-5">

          {/* Header card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{catInfo.icon}</span>
                <div>
                  <p className="text-[18px] font-extrabold">{catInfo.label}</p>
                  {report.subject && <p className="text-[13px] text-white/60">{report.subject}</p>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${priorityCfg.color}`}>{priorityCfg.label}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div><span className="text-white/40 font-medium">Report #</span><p className="font-mono font-bold mt-0.5">{report.report_number}</p></div>
              <div><span className="text-white/40 font-medium">Type</span><p className="font-bold mt-0.5">{report.report_type === 'transaction' ? '🚩 Pickup Report' : '🆘 Platform Problem'}</p></div>
              <div><span className="text-white/40 font-medium">Filed</span><p className="font-bold mt-0.5">{formatDate(report.created_at)}</p></div>
              {report.pickup_id && <div><span className="text-white/40 font-medium">Pickup ID</span><p className="font-mono font-bold mt-0.5">#{report.pickup_id.slice(0, 8)}</p></div>}
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Reporter&apos;s Description</p>
              <p className="text-[14px] text-white/80 leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Evidence */}
          {report.evidence_urls && report.evidence_urls.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2">Evidence</p>
              {report.evidence_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-emerald-400 hover:underline block truncate">{url}</a>
              ))}
            </div>
          )}

          {/* Event timeline */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-4">Activity Timeline</p>
            {events.length === 0 ? (
              <p className="text-[13px] text-white/30">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {events.map((evt) => (
                  <div key={evt.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />
                    <div>
                      <p className="text-[13px] font-bold">{EVENT_LABELS[evt.event_type] ?? evt.event_type}</p>
                      {evt.old_value && evt.new_value && (
                        <p className="text-[12px] text-white/50">
                          <span className="line-through">{evt.old_value}</span> → <span className="text-emerald-400 font-bold">{evt.new_value}</span>
                        </p>
                      )}
                      {evt.note && <p className="text-[12px] text-white/60 italic mt-0.5">&quot;{evt.note}&quot;</p>}
                      <p className="text-[11px] text-white/30 mt-0.5">{formatDate(evt.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Admin actions */}
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sticky top-6">
            <p className="text-[13px] font-extrabold uppercase tracking-wider mb-4">Admin Actions</p>

            {/* Status */}
            <div className="space-y-1.5 mb-4">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-wide">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-[13px] font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(REPORT_STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key} className="bg-[#1a1d27]">{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5 mb-4">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-wide">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as ReportPriority)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-[13px] font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(REPORT_PRIORITY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key} className="bg-[#1a1d27]">{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Admin note */}
            <div className="space-y-1.5 mb-4">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-wide">Investigation Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Internal note for the team…"
                className="w-full resize-none bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Resolution */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[11px] font-bold text-white/50 uppercase tracking-wide">Resolution (shown to reporter)</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Explain how this was resolved…"
                className="w-full resize-none bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-[14px] transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saveMsg && <p className="text-[12px] text-emerald-400 text-center mt-2 font-bold">{saveMsg}</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
