'use client';

import React from 'react';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import SpeakButton from '@/components/common/SpeakButton';
import { useI18n } from '@/i18n/context';
import { ShieldCheck, Recycle, AlertTriangle, PhoneCall, HardHat } from 'lucide-react';

export default function SafetyGuidancePage() {
  const { t, locale } = useI18n();

  const fullPageText = `
    ${t('safety.title')}. ${t('safety.subtitle')}.
    ${t('safety.householdTitle')}:
    1. ${t('safety.householdItem1Title')}: ${t('safety.householdItem1Desc')}
    2. ${t('safety.householdItem2Title')}: ${t('safety.householdItem2Desc')}
    3. ${t('safety.householdItem3Title')}: ${t('safety.householdItem3Desc')}
    ${t('safety.collectorTitle')}:
    1. ${t('safety.collectorItem1Title')}: ${t('safety.collectorItem1Desc')}
    2. ${t('safety.collectorItem2Title')}: ${t('safety.collectorItem2Desc')}
    3. ${t('safety.collectorItem3Title')}: ${t('safety.collectorItem3Desc')}
    ${t('safety.emergencyTitle')}: ${t('safety.emergencyDesc')}
  `;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-28">
      <Navbar />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 flex-1 space-y-7">
        
        {/* Page Hero Banner */}
        <header className="bg-[#136B3B] text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden space-y-4">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold backdrop-blur-xs">
                <ShieldCheck className="w-4 h-4 text-[#A6D5B8]" />
                <span>ScrapMax Eco-Safety Protocol</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {t('safety.title')}
              </h1>
              <p className="text-sm text-[#A6D5B8] leading-relaxed">
                {t('safety.subtitle')}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-3 z-10">
              <LanguageSwitcher />
              <SpeakButton
                text={fullPageText}
                locale={locale}
                label={t('safety.listenAll')}
                className="bg-white hover:bg-emerald-50 text-[#136B3B] border-none shadow-md"
              />
            </div>
          </div>

          <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        </header>

        {/* Section 1: Household Safety & Waste Segregation */}
        <section className="space-y-4" data-purpose="household-safety-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                <Recycle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h2 className="text-xl font-bold text-[#191C1E] tracking-tight">
                {t('safety.householdTitle')}
              </h2>
            </div>

            <SpeakButton
              text={`${t('safety.householdTitle')}. 1. ${t('safety.householdItem1Title')}: ${t('safety.householdItem1Desc')}. 2. ${t('safety.householdItem2Title')}: ${t('safety.householdItem2Desc')}. 3. ${t('safety.householdItem3Title')}: ${t('safety.householdItem3Desc')}.`}
              locale={locale}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Household Rule 1 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#136B3B] flex items-center justify-center font-bold text-sm mb-3">
                  1
                </div>
                <h3 className="font-bold text-[#191C1E] text-base leading-snug">
                  {t('safety.householdItem1Title')}
                </h3>
                <p className="text-xs text-[#526056] leading-relaxed mt-1.5">
                  {t('safety.householdItem1Desc')}
                </p>
              </div>
              <div className="pt-2">
                <SpeakButton
                  text={`${t('safety.householdItem1Title')}: ${t('safety.householdItem1Desc')}`}
                  locale={locale}
                />
              </div>
            </div>

            {/* Household Rule 2 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm mb-3">
                  2
                </div>
                <h3 className="font-bold text-[#191C1E] text-base leading-snug">
                  {t('safety.householdItem2Title')}
                </h3>
                <p className="text-xs text-[#526056] leading-relaxed mt-1.5">
                  {t('safety.householdItem2Desc')}
                </p>
              </div>
              <div className="pt-2">
                <SpeakButton
                  text={`${t('safety.householdItem2Title')}: ${t('safety.householdItem2Desc')}`}
                  locale={locale}
                />
              </div>
            </div>

            {/* Household Rule 3 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm mb-3">
                  3
                </div>
                <h3 className="font-bold text-[#191C1E] text-base leading-snug">
                  {t('safety.householdItem3Title')}
                </h3>
                <p className="text-xs text-[#526056] leading-relaxed mt-1.5">
                  {t('safety.householdItem3Desc')}
                </p>
              </div>
              <div className="pt-2">
                <SpeakButton
                  text={`${t('safety.householdItem3Title')}: ${t('safety.householdItem3Desc')}`}
                  locale={locale}
                />
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Collector Field Safety & Hazards */}
        <section className="space-y-4 pt-2" data-purpose="collector-safety-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-800">
                <HardHat className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h2 className="text-xl font-bold text-[#191C1E] tracking-tight">
                {t('safety.collectorTitle')}
              </h2>
            </div>

            <SpeakButton
              text={`${t('safety.collectorTitle')}. 1. ${t('safety.collectorItem1Title')}: ${t('safety.collectorItem1Desc')}. 2. ${t('safety.collectorItem2Title')}: ${t('safety.collectorItem2Desc')}. 3. ${t('safety.collectorItem3Title')}: ${t('safety.collectorItem3Desc')}.`}
              locale={locale}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Collector Rule 1 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm mb-3">
                  1
                </div>
                <h3 className="font-bold text-[#191C1E] text-base leading-snug">
                  {t('safety.collectorItem1Title')}
                </h3>
                <p className="text-xs text-[#526056] leading-relaxed mt-1.5">
                  {t('safety.collectorItem1Desc')}
                </p>
              </div>
              <div className="pt-2">
                <SpeakButton
                  text={`${t('safety.collectorItem1Title')}: ${t('safety.collectorItem1Desc')}`}
                  locale={locale}
                />
              </div>
            </div>

            {/* Collector Rule 2 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-[#E6F4EA] text-[#136B3B] flex items-center justify-center font-bold text-sm mb-3">
                  2
                </div>
                <h3 className="font-bold text-[#191C1E] text-base leading-snug">
                  {t('safety.collectorItem2Title')}
                </h3>
                <p className="text-xs text-[#526056] leading-relaxed mt-1.5">
                  {t('safety.collectorItem2Desc')}
                </p>
              </div>
              <div className="pt-2">
                <SpeakButton
                  text={`${t('safety.collectorItem2Title')}: ${t('safety.collectorItem2Desc')}`}
                  locale={locale}
                />
              </div>
            </div>

            {/* Collector Rule 3 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm mb-3">
                  3
                </div>
                <h3 className="font-bold text-[#191C1E] text-base leading-snug">
                  {t('safety.collectorItem3Title')}
                </h3>
                <p className="text-xs text-[#526056] leading-relaxed mt-1.5">
                  {t('safety.collectorItem3Desc')}
                </p>
              </div>
              <div className="pt-2">
                <SpeakButton
                  text={`${t('safety.collectorItem3Title')}: ${t('safety.collectorItem3Desc')}`}
                  locale={locale}
                />
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: Emergency Helpline & Protocol Card */}
        <section className="bg-rose-50/80 border border-rose-200 rounded-3xl p-6 space-y-3.5" data-purpose="emergency-helpline-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-bold text-rose-950 text-base">
                  {t('safety.emergencyTitle')}
                </h3>
                <p className="text-xs text-rose-800 font-medium">ScrapMax Support & Safety Hotline</p>
              </div>
            </div>

            <SpeakButton
              text={`${t('safety.emergencyTitle')}: ${t('safety.emergencyDesc')}`}
              locale={locale}
            />
          </div>

          <p className="text-xs text-rose-900 leading-relaxed">
            {t('safety.emergencyDesc')}
          </p>

          <div className="pt-1 flex items-center gap-3">
            <a
              href="tel:180012372727"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Emergency Hotline: 1800-123-SCRAP</span>
            </a>
          </div>
        </section>

      </main>

      <BottomNav role="household" />
    </div>
  );
}
