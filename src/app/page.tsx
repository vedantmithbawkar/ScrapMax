'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import {
  Recycle,
  Truck,
  TrendingUp,
  ShieldCheck,
  Leaf,
  Factory,
  Shield,
  ArrowRight,
  Globe2,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import { useTranslation, SUPPORTED_LANGUAGES, openLanguageModal, SupportedLanguage } from '@/lib/i18n';

export default function HomePage() {
  const { t, language, setLanguage } = useTranslation();

  const primaryLanguages = SUPPORTED_LANGUAGES.filter((l) =>
    ['English', 'Hindi', 'Marathi', 'Gujarati'].includes(l.code)
  );

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-8 pb-16 max-w-5xl mx-auto w-full">
        
        {/* PWA Multi-Language Quick Selector Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-white border border-emerald-200/80 rounded-full shadow-2xs notranslate" translate="no">
          <button
            type="button"
            onClick={() => openLanguageModal()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition notranslate"
            translate="no"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="notranslate">{t('switchLang')}:</span>
          </button>
          {primaryLanguages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code as SupportedLanguage)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition notranslate ${
                language === l.code
                  ? 'bg-[#136B3B] text-white shadow-2xs scale-105'
                  : 'bg-transparent text-gray-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
              translate="no"
            >
              <span className="notranslate">{l.flag} {l.nativeName}</span>
            </button>
          ))}
        </div>

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] text-xs font-bold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#136B3B] animate-pulse"></span>
          <span>{t('landingTopBadge')}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191C1E] max-w-3xl leading-[1.15]">
          {t('landingHeadline1')}{' '}
          <span className="text-[#136B3B]">{t('landingHeadline2')}</span>
        </h1>

        {/* Subtitle with dynamic translation */}
        <p className="mt-5 text-base sm:text-lg font-medium text-[#136B3B] max-w-2xl leading-relaxed">
          {t('turnRecyclables')}
        </p>
        <p className="mt-1 text-xs sm:text-sm text-[#526056] max-w-2xl leading-relaxed">
          {t('schedulePickup')}
        </p>

        {/* 4-Role Navigation CTAs */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-3xl">
          <Link
            href="/register?role=household"
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs sm:text-sm shadow-sm transition touch-feedback"
          >
            <Recycle className="w-4 h-4" />
            <span>{t('roleCitizenBtn')}</span>
          </Link>

          <Link
            href="/register?role=collector"
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-[#191C1E] border border-[#DDE3EA] font-bold text-xs sm:text-sm shadow-xs transition touch-feedback"
          >
            <Truck className="w-4 h-4 text-[#136B3B]" />
            <span>{t('roleCollectorBtn')}</span>
          </Link>

          <Link
            href="/register?role=recycler"
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 border border-amber-200 font-bold text-xs sm:text-sm shadow-xs transition touch-feedback"
          >
            <Factory className="w-4 h-4 text-amber-700" />
            <span>{t('roleRecyclerBtn')}</span>
          </Link>

          <Link
            href="/admin/login"
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs sm:text-sm shadow-xs transition touch-feedback"
          >
            <Shield className="w-4 h-4 text-purple-700" />
            <span>{t('roleAdminBtn')}</span>
          </Link>
        </div>

        {/* Marketplace Bridge Concept Banner */}
        <div className="mt-12 w-full max-w-4xl bg-gradient-to-br from-[#136B3B] to-[#0D4B29] rounded-3xl p-6 sm:p-8 text-white text-left shadow-lg relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6D5B8] bg-white/10 px-2.5 py-1 rounded-full">
                {t('collectorSideBadge')}
              </span>
              <h3 className="text-xl font-bold">{t('collectorSideTitle')}</h3>
              <p className="text-xs text-[#A6D5B8] leading-relaxed">
                {t('collectorSideDesc')}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <span className="text-xs font-bold text-[#A6D5B8] uppercase">{t('protocolBadge')}</span>
              <div className="my-2 flex items-center gap-2 font-black text-sm text-white">
                <span>{t('protocolTitle')}</span>
              </div>
              <p className="text-[11px] text-white/80">
                {t('protocolDesc')}
              </p>
            </div>

            <div className="space-y-2 md:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-1 rounded-full">
                {t('recyclerSideBadge')}
              </span>
              <h3 className="text-xl font-bold">{t('recyclerSideTitle')}</h3>
              <p className="text-xs text-[#A6D5B8] leading-relaxed">
                {t('recyclerSideDesc')}
              </p>
            </div>

          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* WORKER HEALTH & HAZARD SAFETY GUIDANCE BANNER */}
        <div className="mt-8 w-full max-w-4xl bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200 rounded-3xl p-5 sm:p-6 shadow-xs text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-red-950">
                    {t('navSafetyGuide')} &bull; E-Waste &amp; Hazardous Material Safety
                  </h3>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                    CPCB Rules 2022
                  </span>
                </div>
                <p className="text-xs text-red-800 font-medium">
                  कबाड़ कामगारों के लिए जीवन रक्षक सुरक्षा नियम &bull; तार न जलाएं, तेजाब न डालें, बैटरी न फोड़ें।
                </p>
              </div>
            </div>

            <Link
              href="/collector/safety"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-full shadow-sm hover:shadow transition shrink-0"
            >
              <Volume2 className="w-4 h-4" />
              <span>सुरक्षा मार्गदर्शिका खोलें (Safety Guide)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 bg-white/80 border border-red-200 rounded-xl space-y-0.5">
              <span className="font-bold text-red-800 flex items-center gap-1 text-[11px]">
                <span>🔋</span> <span>Batteries</span>
              </span>
              <p className="text-[10.5px] text-gray-700 leading-snug">
                कभी न तोड़ें, 1200°C विस्फोट खतरा।
              </p>
            </div>
            <div className="p-2.5 bg-white/80 border border-red-200 rounded-xl space-y-0.5">
              <span className="font-bold text-red-800 flex items-center gap-1 text-[11px]">
                <span>📺</span> <span>CRT Screens</span>
              </span>
              <p className="text-[10.5px] text-gray-700 leading-snug">
                कांच न फोड़ें, 2-3kg लेड जहर व धमाका।
              </p>
            </div>
            <div className="p-2.5 bg-white/80 border border-red-200 rounded-xl space-y-0.5">
              <span className="font-bold text-red-800 flex items-center gap-1 text-[11px]">
                <span>🔥</span> <span>Wire Burning</span>
              </span>
              <p className="text-[10.5px] text-gray-700 leading-snug">
                तार न जलाएं, छीलकर ₹130/kg ज्यादा पाएं।
              </p>
            </div>
            <div className="p-2.5 bg-white/80 border border-red-200 rounded-xl space-y-0.5">
              <span className="font-bold text-red-800 flex items-center gap-1 text-[11px]">
                <span>🧪</span> <span>PCBs &amp; Acid</span>
              </span>
              <p className="text-[10.5px] text-gray-700 leading-snug">
                तेजाब न डालें, साबुत ₹550/kg तक बेचें।
              </p>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full text-left max-w-6xl">
          
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">{t('feat1Title')}</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              {t('feat1Desc')}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">{t('feat2Title')}</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              {t('feat2Desc')}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">{t('feat3Title')}</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              {t('feat3Desc')}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">{t('feat4Title')}</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              {t('feat4Desc')}
            </p>
          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-white text-center text-xs text-[#6B7280] space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#526056]">
          <Link href="/register?role=household" className="hover:text-[#136B3B] transition">{t('footerHousehold')}</Link>
          <span>•</span>
          <Link href="/register?role=collector" className="hover:text-[#136B3B] transition">{t('footerCollector')}</Link>
          <span>•</span>
          <Link href="/register?role=recycler" className="hover:text-[#136B3B] transition">{t('footerRecycler')}</Link>
          <span>•</span>
          <Link href="/directory" className="hover:text-[#136B3B] transition">{t('footerDirectory')}</Link>
          <span>•</span>
          <Link href="/stores" className="hover:text-[#136B3B] transition">{t('footerStores')}</Link>
          <span>•</span>
          <Link href="/collector/safety" className="text-red-700 hover:text-red-900 font-bold transition flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{t('navSafetyGuide')}</span>
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-[#136B3B] transition">{t('footerPrivacy')}</Link>
          <span>•</span>
          <Link href="/admin/login" className="hover:text-purple-700 transition inline-flex items-center gap-1 font-bold text-purple-700">
            <Shield className="w-3.5 h-3.5" />
            {t('footerAdmin')}
          </Link>
        </div>
        <p>&copy; {new Date().getFullYear()} ScrapMax — {t('footerTagline')}</p>
      </footer>
    </div>
  );
}
