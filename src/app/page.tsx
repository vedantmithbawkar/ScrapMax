import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import { Recycle, Truck, MapPin, Sparkles, Wallet, Leaf } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col justify-center items-center text-center">
        
        {/* Soft botanical ambient blur */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#E6F4EA]/80 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] text-xs font-bold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Eco-Waste & Circular Logistics System</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191C1E] max-w-4xl leading-tight sm:leading-tight">
          Turn Your Household Waste Into Value with{' '}
          <span className="text-[#136B3B]">Sampah Jujur</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-[#526056] max-w-2xl leading-relaxed">
          Connect with trusted local collectors, schedule effortless door-step scrap pickups, track live routes, and redeem circular recycling value.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3.5 w-full max-w-md">
          <Link
            href="/register?role=household"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-sm shadow-md transition touch-feedback"
          >
            <Recycle className="w-4 h-4" />
            <span>Sell Recyclables</span>
          </Link>

          <Link
            href="/register?role=collector"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-gray-50 text-[#191C1E] border border-[#DDE3EA] font-bold text-sm shadow-xs transition touch-feedback"
          >
            <Truck className="w-4 h-4 text-[#136B3B]" />
            <span>Collector Portal</span>
          </Link>
        </div>

        {/* Prototype Hero Card Preview */}
        <div className="mt-14 w-full max-w-lg bg-[#136B3B] rounded-3xl p-6 sm:p-7 text-white text-left shadow-lg relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
              Turn recyclables into value.
            </h2>
            <p className="text-sm text-[#A6D5B8] leading-normal">
              Schedule a pickup from a nearby collector.
            </p>
            <div className="pt-4">
              <Link
                href="/register?role=household"
                className="inline-block bg-white text-[#136B3B] text-xs font-bold px-5 py-2.5 rounded-full hover:bg-gray-50 shadow-xs transition"
              >
                Request pickup
              </Link>
            </div>
          </div>
          {/* Subtle background curved design accent */}
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full text-left max-w-5xl">
          
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">Zero-Key GPS Live Map</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              Interactive OpenStreetMap location picker with instant address reverse-geocoding for hassle-free collector dispatch.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">Transparent Fair Value</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              Standardized market rates for Paper, Plastic, Metal, Glass, and E-Waste calculated transparently on pickup verification.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition">
            <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#191C1E]">Real-Time Coordination</h3>
            <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
              Live WebSocket chat directly between households and assigned collectors using Supabase Realtime messaging.
            </p>
          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 bg-white text-center text-xs text-[#6B7280]">
        &copy; {new Date().getFullYear()} Sampah Jujur — Eco-Waste & Circular Logistics System.
      </footer>
    </div>
  );
}
