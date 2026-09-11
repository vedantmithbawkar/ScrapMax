'use client';

import React, { useState, useEffect } from 'react';
import { X, Flag, CheckCircle2, Loader2, ChevronRight, Link as LinkIcon } from 'lucide-react';
import { TransactionReportCategory, TRANSACTION_REPORT_CATEGORIES } from '@/types';
import { createTransactionReport } from '@/lib/reports-service';
import { createClient } from '@/lib/supabase/client';

interface ReportModalProps {
  requestId: string;
  requestAddress?: string;
  collectorId?: string | null;
  onClose: () => void;
}

type Phase = 'select' | 'describe' | 'submitting' | 'success' | 'error';

export default function ReportModal({
  requestId,
  requestAddress,
  collectorId,
  onClose,
}: ReportModalProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selected, setSelected] = useState<TransactionReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [reportNumber, setReportNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const categories = Object.entries(TRANSACTION_REPORT_CATEGORIES) as [
    TransactionReportCategory,
    { label: string; icon: string; description: string },
  ][];

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  function handleCategorySelect(cat: TransactionReportCategory) {
    setSelected(cat);
    setTimeout(() => setPhase('describe'), 120);
  }

  async function handleSubmit() {
    if (!selected) return;
    setPhase('submitting');

    if (!userId) {
      // Unauthenticated — offline fallback with generated number
      const num = `RPT-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
      setReportNumber(num);
      try {
        const newLocalReport = {
          id: `rep-${Date.now()}`,
          report_number: num,
          report_type: 'transaction',
          reporter_id: 'guest-user',
          pickup_id: requestId,
          collector_id: collectorId ?? null,
          category: selected,
          description: description.trim() || undefined,
          evidence_urls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
          status: 'submitted',
          priority: 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const existing = JSON.parse(localStorage.getItem('local_reports') || '[]');
        localStorage.setItem('local_reports', JSON.stringify([newLocalReport, ...existing]));
      } catch {}
      await new Promise((r) => setTimeout(r, 800));
      setPhase('success');
      setTimeout(onClose, 3000);
      return;
    }

    const { report, error } = await createTransactionReport({
      reporterId: userId,
      category: selected,
      description: description.trim() || undefined,
      pickupId: requestId,
      collectorId: collectorId ?? null,
      evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
    });

    if (error || !report) {
      setErrorMsg(error ?? 'Something went wrong. Please try again.');
      setPhase('error');
      return;
    }

    setReportNumber(report.report_number);
    setPhase('success');
    setTimeout(onClose, 3500);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report a pickup problem"
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '92dvh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ─── SELECT / DESCRIBE ─── */}
        {(phase === 'select' || phase === 'describe') && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-[#191C1E] leading-tight">
                    Report pickup problem
                  </h2>
                  {requestAddress && (
                    <p className="text-[11px] text-[#6B7280] font-medium truncate max-w-[220px]">
                      {requestAddress}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Grid */}
            {phase === 'select' && (
              <div className="px-5 py-5 space-y-3">
                <p className="text-[13px] font-semibold text-[#526056]">What went wrong?</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map(([key, cat]) => (
                    <button
                      key={key}
                      type="button"
                      id={`report-category-${key}`}
                      onClick={() => handleCategorySelect(key)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                        selected === key
                          ? 'border-[#136B3B] bg-[#EAF5EE]'
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-2xl leading-none">{cat.icon}</span>
                      <span className="text-[12px] font-bold text-[#191C1E] leading-snug">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Describe Phase */}
            {phase === 'describe' && selected && (
              <div className="px-5 py-5 space-y-4">
                {/* Back + chip */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPhase('select')}
                    className="text-[13px] font-bold text-[#136B3B] hover:underline"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF5EE] border border-[#A6D5B8]">
                    <span className="text-base leading-none">
                      {TRANSACTION_REPORT_CATEGORIES[selected].icon}
                    </span>
                    <span className="text-[12px] font-bold text-[#136B3B]">
                      {TRANSACTION_REPORT_CATEGORIES[selected].label}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="txn-report-desc" className="text-[13px] font-semibold text-[#526056]">
                    Describe the issue{' '}
                    <span className="font-normal text-[#9CA3AF]">(optional)</span>
                  </label>
                  <textarea
                    id="txn-report-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={TRANSACTION_REPORT_CATEGORIES[selected].description}
                    rows={3}
                    maxLength={500}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-[#F7F9FA] px-4 py-3 text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 focus:border-[#136B3B] transition"
                  />
                  <p className="text-right text-[11px] text-[#9CA3AF] font-medium">
                    {description.length}/500
                  </p>
                </div>

                {/* Evidence URL */}
                <div className="space-y-1.5">
                  <label htmlFor="txn-evidence-url" className="text-[13px] font-semibold text-[#526056]">
                    Evidence link{' '}
                    <span className="font-normal text-[#9CA3AF]">(optional — paste photo link)</span>
                  </label>
                  <div className="flex items-center gap-2 bg-[#F7F9FA] border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#136B3B]/30 focus-within:border-[#136B3B] transition">
                    <LinkIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                    <input
                      id="txn-evidence-url"
                      type="url"
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-transparent text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-base leading-none mt-0.5">🔒</span>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Your report is private. We use it only to investigate and improve service quality.
                  </p>
                </div>

                {/* Auto-link note */}
                <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-base leading-none mt-0.5">🔗</span>
                  <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                    This report will be automatically linked to the pickup request{' '}
                    <span className="font-bold">#{requestId.slice(0, 8)}</span>.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="button"
                  id="txn-report-submit-btn"
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#136B3B] hover:bg-[#0F5730] active:scale-[0.98] text-white font-bold text-[15px] transition-all shadow-sm"
                >
                  Submit report
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── SUBMITTING ─── */}
        {phase === 'submitting' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
            <Loader2 className="w-10 h-10 text-[#136B3B] animate-spin" />
            <p className="text-[15px] font-bold text-[#191C1E]">Submitting your report…</p>
            <p className="text-[13px] text-[#6B7280] text-center">
              We take every report seriously.
            </p>
          </div>
        )}

        {/* ─── SUCCESS ─── */}
        {phase === 'success' && (
          <div className="flex flex-col items-center justify-center gap-5 py-14 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#EAF5EE] flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-[#136B3B]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[20px] font-extrabold text-[#191C1E]">Report submitted</h3>
              {reportNumber && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EAF5EE] rounded-full border border-[#A6D5B8] mt-1">
                  <span className="text-[13px] font-black text-[#136B3B] tracking-wide">
                    {reportNumber}
                  </span>
                </div>
              )}
              <p className="text-[13px] text-[#526056] leading-relaxed max-w-xs pt-1">
                We&apos;ll review this and get back to you. You can track it in{' '}
                <span className="font-bold text-[#136B3B]">My Reports</span>.
              </p>
            </div>
            {selected && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F9FA] border border-gray-200">
                <span className="text-xl">{TRANSACTION_REPORT_CATEGORIES[selected].icon}</span>
                <span className="text-[13px] font-bold text-[#526056]">
                  {TRANSACTION_REPORT_CATEGORIES[selected].label}
                </span>
              </div>
            )}
            <p className="text-[12px] text-[#9CA3AF] font-medium">Closing automatically…</p>
          </div>
        )}

        {/* ─── ERROR ─── */}
        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center gap-5 py-14 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[18px] font-extrabold text-[#191C1E]">Submission failed</h3>
              <p className="text-[13px] text-[#6B7280] leading-relaxed max-w-xs">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setPhase('describe')}
              className="px-6 py-3 rounded-2xl bg-[#136B3B] text-white font-bold text-[14px]"
            >
              Try again
            </button>
          </div>
        )}

        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  );
}
