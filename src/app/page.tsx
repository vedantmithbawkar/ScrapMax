import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import IndiaGovHero from '@/components/home/IndiaGovHero';
import {
  Recycle,
  Truck,
  MapPin,
  Sparkles,
  Wallet,
  Leaf,
  Shield,
  Award,
  CheckCircle2,
  Building2,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#191C1E] flex flex-col font-sans">
      <Navbar />

      {/* Hero Section: National Portal of India (india.gov.in aesthetic) */}
      <IndiaGovHero />

      {/* Main Government Circular Economy Pillars & Impact */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 flex-1 w-full space-y-16">
        
        {/* Government Initiative Mission Banner */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Smart India Hackathon &bull; National Circular Economy Framework</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Swachh Bharat Mission 2.0 &amp; Extended Producer Responsibility (EPR)
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              ScrapMax integrates informal waste pickers (Kabadiwalas) into a digitized, formal circular supply chain with certified weighing, fair rate governance, and verifiable green credits for municipal sustainability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/register?role=household"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs shadow-sm transition text-center"
            >
              Request Doorstep Pickup
            </Link>
            <Link
              href="/admin/login"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition text-center"
            >
              Admin Governance Portal
            </Link>
          </div>
        </div>

        {/* 4 Key Pillar Features Grid */}
        <section aria-labelledby="core-features">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <h3 id="core-features" className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Transparent, Direct &amp; Verified Circular Recycling
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Transforming municipal waste into high-grade circular secondary raw materials through citizen participation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#136B3B]/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4 group-hover:scale-105 transition">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Zero-Key GPS Live Map</h4>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Interactive OpenStreetMap location picker with instant address reverse-geocoding for automated Kabadiwala route dispatch.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#136B3B]/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4 group-hover:scale-105 transition">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Direct Benefit Transfer (DBT)</h4>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Standardized CPCB benchmark rates for Paper, Plastic, Metal, Glass, and E-Waste paid instantly to citizens via direct UPI.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#136B3B]/30 transition group">
              <div className="w-12 h-12 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] mb-4 group-hover:scale-105 transition">
                <Leaf className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Two-Way Realtime Chat</h4>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Live bidirectional messaging between households and assigned collectors using Supabase Realtime for arrival coordination.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-purple-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-purple-300 transition group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 mb-4 group-hover:scale-105 transition">
                <Shield className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Official Admin Hub</h4>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Moderation console for municipal authorities: user lifecycle verification, pickup audits, price tuning &amp; grievance resolution.
              </p>
            </div>

          </div>
        </section>

        {/* National Performance Metrics Banner */}
        <div className="bg-gradient-to-r from-[#03132B] to-[#0A2540] rounded-2xl p-6 sm:p-8 text-white shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#38EF7D]">142.8 MT</div>
              <div className="text-xs text-white/80">Recyclables Diverted</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#FF9933]">1,840+</div>
              <div className="text-xs text-white/80">Certified Kabadiwalas</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">99.4%</div>
              <div className="text-xs text-white/80">Digital Scale Accuracy</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#60A5FA]">₹28.4 L</div>
              <div className="text-xs text-white/80">Direct Citizen Earnings</div>
            </div>
          </div>
        </div>

      </main>

      {/* Indian Government GIGW-Compliant Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white text-xs text-gray-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-gray-800">
              <div className="w-6 h-6 rounded bg-[#136B3B] text-white flex items-center justify-center font-black text-xs">
                S
              </div>
              <span>ScrapMax &bull; National Circular Economy &amp; Eco-Waste Portal</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600">
              <Link href="/register?role=household" className="hover:text-[#136B3B] transition">Citizen Portal</Link>
              <span>•</span>
              <Link href="/register?role=collector" className="hover:text-[#136B3B] transition">Collector Portal</Link>
              <span>•</span>
              <Link href="/stores" className="hover:text-[#136B3B] transition">Recycling Kendras</Link>
              <span>•</span>
              <Link href="/household/report" className="hover:text-[#136B3B] transition">Swachhata Grievance</Link>
              <span>•</span>
              <Link href="/admin/login" className="hover:text-purple-700 transition font-bold text-purple-700 inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Admin Portal
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
            <p>
              Portal Content Managed by Ministry of Environment, Forest &amp; Climate Change &bull; Central Pollution Control Board (CPCB).
            </p>
            <p>&copy; {new Date().getFullYear()} ScrapMax — Smart India Hackathon (SIH) Initiative.</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
