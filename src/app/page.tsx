import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import {
  Recycle,
  Truck,
  MapPin,
  Sparkles,
  Wallet,
  Leaf,
  Factory,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col justify-center items-center text-center">
        
        {/* Soft botanical ambient blur */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#E6F4EA]/80 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] text-xs font-bold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Two-Sided Circular Scrap &amp; Recycling Marketplace</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191C1E] max-w-4xl leading-tight sm:leading-tight">
          Bridge Scrap Supply to Industrial Demand with{' '}
          <span className="text-[#136B3B]">ScrapMax</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-[#526056] max-w-2xl leading-relaxed">
          From doorstep citizen scrap pickups to B2B multi-supplier aggregation for verified recycling facilities — transparent pricing, live GPS logistics, and circular chain-of-custody traceability.
        </p>

        {/* 3-Sided Portal Navigation CTAs */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
          <Link
            href="/register?role=household"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs sm:text-sm shadow-sm transition touch-feedback"
          >
            <Recycle className="w-4 h-4" />
            <span>Citizen / Sell Scrap</span>
          </Link>

          <Link
            href="/register?role=collector"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-[#191C1E] border border-[#DDE3EA] font-bold text-xs sm:text-sm shadow-xs transition touch-feedback"
          >
            <Truck className="w-4 h-4 text-[#136B3B]" />
            <span>Collector Marketplace</span>
          </Link>

          <Link
            href="/register?role=recycler"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 border border-amber-200 font-bold text-xs sm:text-sm shadow-xs transition touch-feedback"
          >
            <Factory className="w-4 h-4 text-amber-700" />
            <span>Recycler B2B Portal</span>
          </Link>
        </div>

        {/* Marketplace Bridge Concept Banner */}
        <div className="mt-12 w-full max-w-4xl bg-gradient-to-br from-[#136B3B] to-[#0D4B29] rounded-3xl p-6 sm:p-8 text-white text-left shadow-lg relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6D5B8] bg-white/10 px-2.5 py-1 rounded-full">
                Collector Side
              </span>
              <h3 className="text-xl font-bold">&quot;I Have Scrap&quot;</h3>
              <p className="text-xs text-[#A6D5B8] leading-relaxed">
                Aggregated supply of circuit boards, copper, metals, lithium batteries, and plastics ready for industrial procurement.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <span className="text-xs font-bold text-[#A6D5B8] uppercase">ScrapMax Protocol</span>
              <div className="my-2 flex items-center gap-2 font-black text-sm text-white">
                <span>Deterministic Matching</span>
              </div>
              <p className="text-[11px] text-white/80">
                Multi-Supplier Aggregation · Weight Slip Telemetry · End-to-End Traceability
              </p>
            </div>

            <div className="space-y-2 md:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-1 rounded-full">
                Recycler Side
              </span>
              <h3 className="text-xl font-bold">&quot;I Need Scrap&quot;</h3>
              <p className="text-xs text-[#A6D5B8] leading-relaxed">
                Verified recycling facilities publish material demands, set rates per KG, and fulfill large quotas from distributed collectors.
              </p>
            </div>

          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full text-left max-w-5xl">
          
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">Multi-Supplier Sourcing</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              Recyclers fulfill 500+ KG requirements across multiple local collectors with automatic lot management and overbooking protection.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">Verified Facilities Only</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              Comprehensive regulatory verification checking SPCB authorizations and CPCB EPR registrations before marketplace participation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">Circular Traceability</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              Verifiable chain of custody from citizen collection point to physical scale weight confirmation, instant settlement, and batch ingestion.
            </p>
          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white text-center text-xs text-[#6B7280]">
        &copy; {new Date().getFullYear()} ScrapMax — Circular Scrap &amp; Recycling Marketplace.
      </footer>
    </div>
  );
}
