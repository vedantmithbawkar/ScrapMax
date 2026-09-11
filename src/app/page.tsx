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
  Shield,
  Award,
  CheckCircle2,
  FileCheck,
  Scale,
  Landmark,
  ArrowRight,
  TrendingUp,
  PhoneCall,
  ExternalLink,
} from 'lucide-react';
import {
  EmblemOfIndia,
  SwachhBharatLogo,
  DigitalIndiaLogo,
  SihBadge,
  MissionLifeBadge,
  CpcbEprBadge,
} from '@/components/gov/GovLogos';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans" id="main-content">
      <Navbar />

      {/* ── 1. NATIONAL HERO BANNER ── */}
      <section className="relative pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        
        {/* Subtle Indian Flag Tri-color Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-orange-100/40 via-white/20 to-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* National Initiative Accreditation Badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-200/80 text-[#046A38] text-xs font-bold mb-6 shadow-xs">
          <SihBadge className="h-6 py-0 px-1 border-0 shadow-none bg-transparent" />
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="text-[11px] text-[#FF671F] font-extrabold uppercase tracking-wide">
            MoEF&amp;CC · Swachh Bharat Mission (Urban 2.0)
          </span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="text-[11px] text-[#526056]">Problem Statement: Circular Scrap Logistics</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B151F] max-w-5xl mx-auto leading-tight sm:leading-tight">
          National Circular Economy &amp; Digital Scrap Logistics Portal
        </h1>
        <p className="mt-2 text-base sm:text-xl font-serif font-bold text-[#FF671F]">
          राष्ट्रीय परिपत्र अर्थव्यवस्था एवं अपशिष्ट पुनर्चक्रण मंच
        </p>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-[#526056] max-w-3xl mx-auto leading-relaxed">
          An official Smart India Hackathon initiative empowering citizens with transparent doorstep recyclable scrap collection, verified digital weighing, instant UPI DBT payouts, and CPCB Extended Producer Responsibility (EPR) tracking.
        </p>

        {/* Official Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-2xl mx-auto">
          <Link
            href="/register?role=household"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#046A38] hover:bg-[#03522B] text-white font-bold text-sm shadow-md transition touch-feedback"
          >
            <Recycle className="w-4 h-4" />
            <span>Book Recyclable Pickup / कबाड़ पिकअप</span>
          </Link>

          <Link
            href="/register?role=collector"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-[#191C1E] border-2 border-[#DDE3EA] hover:border-[#046A38] font-bold text-sm shadow-xs transition touch-feedback"
          >
            <Truck className="w-4 h-4 text-[#FF671F]" />
            <span>Authorized Kabadiwala / कबाड़ीवाला</span>
          </Link>

          <Link
            href="/admin"
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border-2 border-purple-200 font-bold text-sm shadow-xs transition touch-feedback"
          >
            <Landmark className="w-4 h-4 text-purple-700" />
            <span>Municipal Admin / नगर निगम</span>
          </Link>
        </div>

        {/* Official Scheme Alignment Badges Strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs">
          <SwachhBharatLogo className="h-9" />
          <DigitalIndiaLogo className="h-8" />
          <MissionLifeBadge className="h-8" />
          <CpcbEprBadge className="h-8" />
        </div>
      </section>

      {/* ── 2. NATIONAL LIVE WASTE METRICS (DASHBOARD HIGHLIGHTS) ── */}
      <section className="bg-[#0B151F] text-white py-10 px-4 sm:px-6 lg:px-8 border-y-2 border-[#FF671F]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#FF9933] uppercase">
                राष्ट्रीय सांख्यिकी | Real-Time Impact Counters
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                National Circular Economy Impact Matrix
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Audited under SWM Rules 2016 &amp; CPCB Guidelines</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-2">
                <Recycle className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                  +18.4% MoM
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">3,480 MT</div>
              <p className="text-xs text-gray-300 font-bold mt-1">Diverted from Landfills</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Paper, Plastic, Metal &amp; E-Waste</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] font-mono text-blue-300 font-bold bg-blue-950/60 px-2 py-0.5 rounded">
                  100% Verified
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">1,240+</div>
              <p className="text-xs text-gray-300 font-bold mt-1">Authorized Kabadiwalas</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Municipal ID &amp; Police Cleared</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-5 h-5 text-amber-400" />
                <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded">
                  Direct UPI DBT
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">₹ 42.8 Lakh</div>
              <p className="text-xs text-gray-300 font-bold mt-1">Disbursed to Citizens</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Direct into Bank Accounts</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition">
              <div className="flex items-center justify-between mb-2">
                <Leaf className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">
                  Mission LiFE
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white">5,890 Tons</div>
              <p className="text-xs text-gray-300 font-bold mt-1">CO₂ Emissions Averted</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Certified Carbon Credits</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FOUR OFFICIAL CORE PILLARS ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3 py-1 rounded-full bg-[#E6F4EA] border border-[#A6D5B8] text-[#046A38] text-xs font-bold uppercase tracking-wider">
            मुख्य स्तंभ | Four Core Operational Pillars
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191C1E] mt-3">
            Institutionalized Recycling Architecture for India
          </h2>
          <p className="text-sm text-[#526056] mt-2">
            Structured for seamless nationwide deployment across ULBs (Urban Local Bodies) and Smart Cities under the Swachh Bharat Mission (SBM-U 2.0).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-[#046A38] shadow-xs hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-[#E6F4EA] text-[#046A38] flex items-center justify-center font-bold mb-5 group-hover:bg-[#046A38] group-hover:text-white transition">
              <Scale className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-black uppercase text-[#FF671F] tracking-wide">Pillar 1 · Citizen</div>
            <h3 className="text-base font-bold text-[#191C1E] mt-1">
              नागरिक सेवाएं | Transparent Doorstep Collection
            </h3>
            <p className="text-xs text-[#526056] mt-2.5 leading-relaxed">
              Standardized daily scrap MSP commodity rates, zero-tampering certified digital scales, transparent weight verification, and instant UPI payment.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#191C1E]">
              <li className="flex items-center gap-1.5 text-[#046A38] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Zero-Key GPS Live Map Dispatch</span>
              </li>
              <li className="flex items-center gap-1.5 text-[#046A38] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Instant Digital Recycling Receipt</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-[#FF671F] shadow-xs hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF671F] flex items-center justify-center font-bold mb-5 group-hover:bg-[#FF671F] group-hover:text-white transition">
              <Truck className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-black uppercase text-[#FF671F] tracking-wide">Pillar 2 · Formalization</div>
            <h3 className="text-base font-bold text-[#191C1E] mt-1">
              अधिकृत कबाड़ीवाला | Collector Formalization
            </h3>
            <p className="text-xs text-[#526056] mt-2.5 leading-relaxed">
              Transforming informal waste workers into formalized green entrepreneurs with municipal ID cards, route navigation, and safety gear.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#191C1E]">
              <li className="flex items-center gap-1.5 text-[#FF671F] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>QR-Verified Identity Cards</span>
              </li>
              <li className="flex items-center gap-1.5 text-[#FF671F] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Dynamic Cluster Route Optimiser</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-blue-600 shadow-xs hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold mb-5 group-hover:bg-blue-700 group-hover:text-white transition">
              <FileCheck className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-black uppercase text-blue-700 tracking-wide">Pillar 3 · Compliance</div>
            <h3 className="text-base font-bold text-[#191C1E] mt-1">
              ईपीआर एवं सीपीसीबी | EPR Circular Tracking
            </h3>
            <p className="text-xs text-[#526056] mt-2.5 leading-relaxed">
              Auditable chain-of-custody tracking verifying that collected recyclables are delivered directly to authorized CPCB-registered recyclers.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#191C1E]">
              <li className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>CPCB E-Waste &amp; Plastic EPR Credits</span>
              </li>
              <li className="flex items-center gap-1.5 text-blue-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Tamper-Proof Audit Certificates</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 hover:border-purple-600 shadow-xs hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold mb-5 group-hover:bg-purple-700 group-hover:text-white transition">
              <Landmark className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-black uppercase text-purple-700 tracking-wide">Pillar 4 · Governance</div>
            <h3 className="text-base font-bold text-[#191C1E] mt-1">
              नगर निगम पोर्टल | Municipal Admin Console
            </h3>
            <p className="text-xs text-[#526056] mt-2.5 leading-relaxed">
              Ward-by-ward solid waste monitoring for Municipal Commissioners and SWM officers to eradicate open dumps and achieve 100% source segregation.
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#191C1E]">
              <li className="flex items-center gap-1.5 text-purple-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Ward-Level Recycling Heatmaps</span>
              </li>
              <li className="flex items-center gap-1.5 text-purple-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Swachh Survekshan Score Booster</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 4. OFFICIAL 3-STEP CITIZEN SERVICE WORKFLOW ── */}
      <section className="bg-white border-y border-gray-200 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold text-[#046A38] uppercase tracking-wider">
              नागरिक सेवा प्रक्रिया | Citizen Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E] mt-1">
              How Doorstep Recycling Works in 3 Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F7F9FA] border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[#046A38] text-white font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <h3 className="font-bold text-base text-[#191C1E]">Request Doorstep Pickup</h3>
              <p className="text-xs text-[#526056] mt-2 leading-relaxed">
                Pin your address on the interactive zero-key GPS map, choose your recyclable waste categories (paper, plastic, metal, e-waste), and pick a convenient time slot.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F7F9FA] border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[#FF671F] text-white font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <h3 className="font-bold text-base text-[#191C1E]">Verified Kabadiwala Arrives</h3>
              <p className="text-xs text-[#526056] mt-2 leading-relaxed">
                An authorized, background-checked collector arrives at your gate with a certified digital scale. Real-time live chat and phone coordination are built in.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F7F9FA] border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-700 text-white font-black text-lg flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <h3 className="font-bold text-base text-[#191C1E]">Instant UPI DBT &amp; Receipt</h3>
              <p className="text-xs text-[#526056] mt-2 leading-relaxed">
                Weight is calculated transparently against live government scrap benchmark rates. Receive instant payment via UPI and download your official recycling certificate.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/register?role=household"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#046A38] hover:bg-[#03522B] text-white font-bold text-sm shadow-md transition"
            >
              <span>Get Started Now / अभी शुरू करें</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. SWACHHATA PUBLIC GRIEVANCE & EMERGENCY HELPLINE CALLOUT ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-[#046A38] via-[#0C5A34] to-[#044424] text-white p-6 sm:p-10 shadow-lg relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-amber-300 text-xs font-bold">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>National Citizen Swachhata Support</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              Spot Illegal Scrap Dumps in Your Ward? Report Directly to ULB
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 max-w-2xl leading-relaxed">
              Citizens can photograph illegal garbage or scrap dumping spots. Municipal officers receive geo-tagged alerts with reverse geocoding for immediate remediation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10">
            <Link
              href="/household/report"
              className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0B151F] font-extrabold text-xs sm:text-sm shadow-md transition"
            >
              Lodge Swachhata Report / रिपोर्ट करें
            </Link>
            <a
              href="tel:1969"
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call 1969</span>
            </a>
          </div>

          {/* Decorative Ashoka Chakra Silhouette in Background */}
          <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/5 pointer-events-none" />
        </div>
      </section>

    </div>
  );
}
