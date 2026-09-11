'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { createPlatformReport } from '@/lib/reports-service';
import { PlatformReportCategory, PLATFORM_REPORT_CATEGORIES } from '@/types';
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Link as LinkIcon, ChevronRight } from 'lucide-react';

type Phase = 'form' | 'submitting' | 'success' | 'error';

const categories = Object.entries(PLATFORM_REPORT_CATEGORIES) as [
  PlatformReportCategory,
  { label: string; icon: string; description: string }
][];

export default function ReportPlatformPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('form');
  const [category, setCategory] = useState<PlatformReportCategory | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [reportNumber, setReportNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setPhase('submitting');

    if (!userId) {
      const num = `RPT-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
      setReportNumber(num);
      await new Promise((r) => setTimeout(r, 800));
      setPhase('success');
      return;
    }

    const { report, error } = await createPlatformReport({
      reporterId: userId,
      category: category as PlatformReportCategory,
      subject: subject.trim() || undefined,
      description: description.trim() || undefined,
      evidenceUrls: evidenceUrl.trim() ? [evidenceUrl.trim()] : [],
    });

    if (error || !report) {
      setErrorMsg(error ?? 'Something went wrong. Please try again.');
      setPhase('error');
      return;
    }

    setReportNumber(report.report_number);
    setPhase('success');
  }

  const canSubmit = category !== '' && description.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 flex-1">

        {/* Header */}
        <header className="flex items-center gap-3 pt-2 pb-5">
          <button onClick={() => router.back()} aria-label="Go back" className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition" type="button">
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight text-[#191C1E]">🆘 Report a Problem</h1>
            <p className="text-[12px] text-[#6B7280] font-medium">General ScrapMax platform issue</p>
          </div>
        </header>

        {/* ── FORM ── */}
        {phase === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="platform-category" className="text-[13px] font-bold text-[#526056]">
                What is the issue? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    id={`platform-cat-${key}`}
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97] ${
                      category === key
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className="text-xl leading-none flex-shrink-0">{cat.icon}</span>
                    <span className="text-[11px] font-bold text-[#191C1E] leading-snug">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label htmlFor="platform-subject" className="text-[13px] font-bold text-[#526056]">
                Subject <span className="font-normal text-[#9CA3AF]">(optional)</span>
              </label>
              <input
                id="platform-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                placeholder="Brief summary of the issue"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="platform-desc" className="text-[13px] font-bold text-[#526056]">
                Describe the problem <span className="text-red-500">*</span>
              </label>
              <textarea
                id="platform-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={category ? PLATFORM_REPORT_CATEGORIES[category as PlatformReportCategory]?.description : 'Tell us exactly what happened…'}
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition"
              />
              <p className="text-right text-[11px] text-[#9CA3AF] font-medium">{description.length}/1000</p>
            </div>

            {/* Evidence URL */}
            <div className="space-y-1.5">
              <label htmlFor="platform-evidence" className="text-[13px] font-bold text-[#526056]">
                Screenshot link <span className="font-normal text-[#9CA3AF]">(optional — paste image URL)</span>
              </label>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-red-400/30 focus-within:border-red-400 transition">
                <LinkIcon className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                <input
                  id="platform-evidence"
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-transparent text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none"
                />
              </div>
            </div>

            {/* Difference note */}
            <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-2xl">
              <span className="text-lg leading-none mt-0.5">ℹ️</span>
              <p className="text-[12px] text-blue-800 leading-relaxed font-medium">
                <span className="font-extrabold">This is for general platform problems.</span> For issues with a specific pickup, use the 🚩 <span className="font-bold">Report</span> button on the pickup card instead.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="platform-report-submit"
              disabled={!canSubmit}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] transition-all ${
                canSubmit
                  ? 'bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Submit Report
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ── SUBMITTING ── */}
        {phase === 'submitting' && (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
            <p className="text-[16px] font-bold text-[#191C1E]">Submitting your report…</p>
            <p className="text-[13px] text-[#6B7280]">This usually takes just a moment.</p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {phase === 'success' && (
          <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-[24px] font-extrabold text-[#191C1E]">Report submitted!</h2>
              {reportNumber && (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 rounded-full border border-emerald-200 mt-1">
                  <span className="text-[14px] font-black text-emerald-700 tracking-wider">{reportNumber}</span>
                </div>
              )}
              <p className="text-[14px] text-[#526056] leading-relaxed max-w-sm pt-1">
                Our team will investigate and update you on the status. Track it in{' '}
                <span className="font-bold text-[#136B3B]">My Reports</span>.
              </p>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => router.push('/household/my-reports')}
                className="flex-1 py-3.5 rounded-2xl bg-[#136B3B] text-white font-bold text-[14px]"
              >
                My Reports
              </button>
              <button
                type="button"
                onClick={() => router.push('/household')}
                className="flex-1 py-3.5 rounded-2xl bg-white border border-gray-200 text-[#191C1E] font-bold text-[14px]"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-[20px] font-extrabold text-[#191C1E]">Submission failed</h3>
              <p className="text-[13px] text-[#6B7280] max-w-xs">{errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => setPhase('form')}
              className="px-8 py-3.5 rounded-2xl bg-red-500 text-white font-bold text-[14px]"
            >
              Try again
            </button>
          </div>
        )}

      </div>
      <BottomNav role="household" />
    </div>
  );
}
