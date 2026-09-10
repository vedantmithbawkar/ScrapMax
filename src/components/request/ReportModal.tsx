'use client';

import React, { useState } from 'react';
import { X, Flag, CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import { ReportCategory, REPORT_CATEGORIES, Report } from '@/types';

interface ReportModalProps {
  requestId: string;
  requestAddress?: string;
  onClose: () => void;
}

type Phase = 'select' | 'describe' | 'submitting' | 'success';

export default function ReportModal({ requestId, requestAddress, onClose }: ReportModalProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selected, setSelected] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');

  const categories = Object.entries(REPORT_CATEGORIES) as [
    ReportCategory,
    { label: string; icon: string; description: string },
  ][];

  function handleCategorySelect(cat: ReportCategory) {
    setSelected(cat);
    setTimeout(() => setPhase('describe'), 150);
  }

  async function handleSubmit() {
    if (!selected) return;
    setPhase('submitting');

    const report: Report = {
      id: `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      request_id: requestId,
      category: selected,
      description: description.trim() || undefined,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    try {
      const key = 'scrapmax_reports';
      const existing: Report[] = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(report);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // silently ignore
    }

    await new Promise((r) => setTimeout(r, 900));
    setPhase('success');
    setTimeout(onClose, 2200);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report a problem"
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '92dvh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ─── SELECT / DESCRIBE PHASES ─── */}
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
                    Report a problem
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
                aria-label="Close report modal"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Category Grid ── */}
            {phase === 'select' && (
              <div className="px-5 py-5 space-y-4">
                <p className="text-[13px] font-semibold text-[#526056]">What went wrong?</p>
                <div className="grid grid-cols-2 gap-3">
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
                      <span className="text-[13px] font-bold text-[#191C1E] leading-snug">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Describe Phase ── */}
            {phase === 'describe' && selected && (
              <div className="px-5 py-5 space-y-5">
                {/* Back + selected chip */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPhase('select')}
                    className="text-[13px] font-bold text-[#136B3B] hover:underline"
                  >
                    ← Back
                  </button>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF5EE] border border-[#A6D5B8]">
                    <span className="text-base leading-none">{REPORT_CATEGORIES[selected].icon}</span>
                    <span className="text-[12px] font-bold text-[#136B3B]">
                      {REPORT_CATEGORIES[selected].label}
                    </span>
                  </div>
                </div>

                {/* Description textarea */}
                <div className="space-y-2">
                  <label
                    htmlFor="report-description"
                    className="text-[13px] font-semibold text-[#526056]"
                  >
                    Tell us more{' '}
                    <span className="font-normal text-[#9CA3AF]">(optional)</span>
                  </label>
                  <textarea
                    id="report-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={REPORT_CATEGORIES[selected].description}
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded-2xl border border-gray-200 bg-[#F7F9FA] px-4 py-3 text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 focus:border-[#136B3B] transition"
                  />
                  <p className="text-right text-[11px] text-[#9CA3AF] font-medium">
                    {description.length}/500
                  </p>
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-base leading-none mt-0.5">🔒</span>
                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Your report is private. We use it only to improve service quality.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  id="report-submit-btn"
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
            <p className="text-[13px] text-[#6B7280] text-center">We take every report seriously.</p>
          </div>
        )}

        {/* ─── SUCCESS ─── */}
        {phase === 'success' && (
          <div className="flex flex-col items-center justify-center gap-5 py-14 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#EAF5EE] flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-[#136B3B]" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[20px] font-extrabold text-[#191C1E]">Report submitted</h3>
              <p className="text-[14px] text-[#526056] leading-relaxed max-w-xs">
                Thank you for letting us know. We&apos;ll review this and get back to you.
              </p>
            </div>
            {selected && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F9FA] border border-gray-200">
                <span className="text-xl">{REPORT_CATEGORIES[selected].icon}</span>
                <span className="text-[13px] font-bold text-[#526056]">
                  {REPORT_CATEGORIES[selected].label}
                </span>
              </div>
            )}
            <p className="text-[12px] text-[#9CA3AF] font-medium">Closing automatically…</p>
          </div>
        )}

        {/* Safe area bottom spacer */}
        <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
      </div>
    </div>
  );
}
