'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Recycle,
  Truck,
  MapPin,
  Shield,
  Calendar,
  Share2,
  MessageSquare,
  BarChart3,
  FileText,
  CheckCircle2,
  X,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';

interface ScrapRateItem {
  category: string;
  material: string;
  rate: string;
  unit: string;
  trend: 'up' | 'stable' | 'down';
}

const SCRAP_RATES: ScrapRateItem[] = [
  { category: 'Paper & Pulp', material: 'Newspaper (Raddi)', rate: '₹14 - ₹16', unit: 'per kg', trend: 'stable' },
  { category: 'Paper & Pulp', material: 'Corrugated Cardboard (Gatta)', rate: '₹10 - ₹13', unit: 'per kg', trend: 'up' },
  { category: 'Plastics', material: 'PET Bottles (Water / Soft Drink)', rate: '₹18 - ₹22', unit: 'per kg', trend: 'up' },
  { category: 'Plastics', material: 'Hard Plastics (HDPE / Buckets)', rate: '₹24 - ₹28', unit: 'per kg', trend: 'stable' },
  { category: 'Metals', material: 'Scrap Iron & Steel (Loha)', rate: '₹32 - ₹36', unit: 'per kg', trend: 'up' },
  { category: 'Metals', material: 'Brass (Pital)', rate: '₹360 - ₹395', unit: 'per kg', trend: 'stable' },
  { category: 'Metals', material: 'Copper (Tamba)', rate: '₹680 - ₹730', unit: 'per kg', trend: 'up' },
  { category: 'E-Waste', material: 'Computer Motherboards / CPUs', rate: '₹95 - ₹160', unit: 'per unit/kg', trend: 'up' },
  { category: 'Glass', material: 'Clear Beverage Bottles', rate: '₹3 - ₹5', unit: 'per kg', trend: 'stable' },
];

export default function IndiaGovHero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [showRateModal, setShowRateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const categories = [
    'All Categories',
    'Scrap Rates & Pricing',
    'Doorstep Pickups',
    'E-Waste & Recycling Kendras',
    'EPR Certificates & Norms',
    'Swachhata Grievance',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setShowRateModal(true);
      return;
    }

    if (query.includes('rate') || query.includes('price') || query.includes('bhav') || query.includes('cost')) {
      setShowRateModal(true);
    } else if (query.includes('pickup') || query.includes('sell') || query.includes('schedule') || query.includes('doorstep')) {
      router.push('/register?role=household');
    } else if (query.includes('collector') || query.includes('kabadi') || query.includes('truck')) {
      router.push('/register?role=collector');
    } else if (query.includes('store') || query.includes('kendra') || query.includes('center') || query.includes('location') || query.includes('map')) {
      router.push('/stores');
    } else if (query.includes('admin') || query.includes('login') || query.includes('gov')) {
      router.push('/admin/login');
    } else if (query.includes('report') || query.includes('grievance') || query.includes('dump')) {
      router.push('/household/report');
    } else {
      setShowRateModal(true);
    }
  };

  const handleTrendingClick = (tag: string) => {
    switch (tag) {
      case 'Schedule Doorstep Pickup':
        router.push('/register?role=household');
        break;
      case 'Live Scrap Rate Card':
        setShowRateModal(true);
        break;
      case 'Find Nearest E-Waste Kendra':
        router.push('/stores');
        break;
      case 'EPR Green Certificate':
        setShowRateModal(true);
        break;
      case 'Kabadiwala Route Tracking':
        router.push('/register?role=collector');
        break;
      case 'Admin Governance Console':
        router.push('/admin/login');
        break;
      default:
        break;
    }
  };

  const todayDate = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <section className="relative w-full bg-[#03132B] text-white overflow-hidden select-none border-b-4 border-[#FF9933]">
      {/* Background Image: Illuminated India Gate at Night */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/india-gate-hero.jpg"
          alt="India Gate Illuminated at Night"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-45 mix-blend-luminosity brightness-90 contrast-125"
        />
        {/* Layered Vignettes for Maximum Readability and Atmospheric Mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#021024]/90 via-[#051c3d]/80 to-[#03132B]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#021024]/60 to-[#020b18]/95" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-12 md:pb-20 flex flex-col items-center text-center">
        
        {/* Top Header Utilities Bar (matching india.gov.in header) */}
        <div className="w-full flex items-center justify-between pb-6 border-b border-white/10 mb-8 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#38EF7D] animate-ping" />
            <span className="font-semibold text-white/90">
              Government of India &bull; Ministry of Environment, Forest &amp; Climate Change
            </span>
          </div>

          <div className="flex items-center gap-3.5 sm:gap-5">
            {/* Sort / Reorder Icon */}
            <button
              type="button"
              title="Page Controls"
              className="p-1 hover:text-white transition opacity-80 hover:opacity-100"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {/* Date Display */}
            <div className="hidden sm:flex items-center gap-1.5 opacity-90">
              <Calendar className="w-3.5 h-3.5 text-[#FF9933]" />
              <span className="font-mono text-[11px]">{todayDate}</span>
            </div>

            {/* Accessibility Icon */}
            <button
              type="button"
              onClick={() => alert('Accessibility Mode: Screen reader and high-contrast support active.')}
              title="Accessibility Controls"
              className="p-1 hover:text-white transition rounded-full border border-white/20 text-white/80 hover:border-white"
            >
              <span className="text-[11px] font-bold px-1">&#9855;</span>
            </button>

            {/* Bilingual Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(l => (l === 'en' ? 'hi' : 'en'))}
              className="px-2 py-0.5 rounded border border-white/25 hover:border-white bg-white/5 text-[11px] font-bold tracking-wider hover:bg-white/10 transition"
              title="Toggle Language"
            >
              {language === 'en' ? 'अ | A' : 'A | अ'}
            </button>

            {/* Indian Tricolor Badge */}
            <div className="flex flex-col w-6 h-4 rounded-xs overflow-hidden shadow-xs border border-white/40" title="National Portal of India">
              <div className="h-1/3 bg-[#FF9933]" />
              <div className="h-1/3 bg-white flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-[#000080]" />
              </div>
              <div className="h-1/3 bg-[#138808]" />
            </div>
          </div>
        </div>

        {/* National Emblem of India (Lion Capital with Satyameva Jayate) */}
        <div className="flex flex-col items-center mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 relative drop-shadow-[0_2px_12px_rgba(255,255,255,0.45)]">
            <Image
              src="/images/national-emblem.png"
              alt="State Emblem of India"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span className="text-[11px] font-semibold text-white/80 tracking-widest uppercase mt-1">
            सत्यमेव जयते
          </span>
        </div>

        {/* Portal Name & Branding (Styled identically to india.gov.in) */}
        <div className="space-y-1.5 mb-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
            scrapmax<span className="text-[#FF9933]">.</span><span className="text-white">gov</span><span className="text-[#38EF7D]">.</span><span className="text-white">in</span>
          </h1>
          <p className="text-sm sm:text-lg md:text-xl font-bold text-white/95 tracking-wide">
            {language === 'en'
              ? 'National Circular Economy & Eco-Waste Portal of India'
              : 'भारत का राष्ट्रीय चक्रीय अर्थव्यवस्था एवं पर्यावरण-अनुकूल अपशिष्ट पोर्टल'}
          </p>
        </div>

        {/* Subtitle Tagline */}
        <p className="text-xs sm:text-sm text-[#A6C8E0] font-medium max-w-2xl mx-auto mb-8 leading-relaxed">
          {language === 'en'
            ? 'Where National Circular Economy, Clean India Governance & Recyclables Converge'
            : 'जहाँ राष्ट्रीय चक्रीय अर्थव्यवस्था, स्वच्छ भारत एवं पुनर्चक्रण योग्य सामग्री का समन्वय होता है'}
        </p>

        {/* Interactive Search Bar (Replica of india.gov.in Search UI) */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-3xl bg-white rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.4)] p-1.5 sm:p-2 flex flex-col sm:flex-row items-center gap-2 border border-gray-200"
        >
          {/* Search Input Box */}
          <div className="flex items-center gap-2.5 px-3 py-2 flex-1 w-full text-left">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for recyclables, scrap rates, pickup Kendra, EPR rules..."
              className="w-full bg-transparent text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none font-medium"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-auto relative border-t sm:border-t-0 sm:border-l border-gray-200 px-3 py-1.5 flex items-center justify-between sm:justify-center">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="appearance-none bg-transparent text-gray-700 text-xs sm:text-sm font-semibold pr-6 focus:outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="text-gray-800">
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Search Action Button (Red / Vermillion as in user screenshot) */}
          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-2.5 rounded-lg bg-[#E62E2D] hover:bg-[#D12322] text-white font-bold text-sm tracking-wide shadow-sm transition active:scale-95 shrink-0"
          >
            Search
          </button>
        </form>

        {/* Trending Searches Tags */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-white/90 max-w-3xl">
          <span className="font-semibold text-white/70 mr-1">Trending Searches :</span>
          
          {[
            'Schedule Doorstep Pickup',
            'Live Scrap Rate Card',
            'Find Nearest E-Waste Kendra',
            'EPR Green Certificate',
            'Kabadiwala Route Tracking',
            'Admin Governance Console',
          ].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleTrendingClick(tag)}
              className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-white text-[11px] sm:text-xs font-medium transition active:scale-95"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Quick Portal Action Tiles */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl">
          <Link
            href="/register?role=household"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition group text-left"
          >
            <Recycle className="w-4 h-4 text-[#38EF7D] shrink-0 group-hover:scale-110 transition" />
            <div>
              <div className="text-xs font-bold text-white">Citizen Portal</div>
              <div className="text-[10px] text-white/70">Sell Recyclables</div>
            </div>
          </Link>

          <Link
            href="/register?role=collector"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition group text-left"
          >
            <Truck className="w-4 h-4 text-[#FF9933] shrink-0 group-hover:scale-110 transition" />
            <div>
              <div className="text-xs font-bold text-white">Collector Portal</div>
              <div className="text-[10px] text-white/70">Kabadiwala Network</div>
            </div>
          </Link>

          <Link
            href="/stores"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition group text-left"
          >
            <MapPin className="w-4 h-4 text-[#60A5FA] shrink-0 group-hover:scale-110 transition" />
            <div>
              <div className="text-xs font-bold text-white">Recycling Kendras</div>
              <div className="text-[10px] text-white/70">GPS Store Locator</div>
            </div>
          </Link>

          <Link
            href="/admin/login"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-400/40 backdrop-blur-md transition group text-left"
          >
            <Shield className="w-4 h-4 text-purple-300 shrink-0 group-hover:scale-110 transition" />
            <div>
              <div className="text-xs font-bold text-white">Admin Console</div>
              <div className="text-[10px] text-purple-200">Official Gov Access</div>
            </div>
          </Link>
        </div>

      </div>

      {/* Floating Right-Hand Utility Dock (Matching india.gov.in dock in screenshot) */}
      <aside
        aria-label="Government Portal Quick Tools"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1 p-1 bg-[#021024]/85 backdrop-blur-md border-l border-y border-white/20 rounded-l-xl shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setShowFeedbackModal(true)}
          title="Citizen Feedback & Support"
          className="p-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition group relative"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="sr-only">Feedback</span>
        </button>

        <Link
          href="/household/report"
          title="Swachhata Grievance Portal"
          className="p-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition group relative"
        >
          <FileText className="w-4 h-4" />
          <span className="sr-only">Grievance</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowRateModal(true)}
          title="Official Scrap Rate Chart"
          className="p-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition group relative"
        >
          <Calendar className="w-4 h-4" />
          <span className="sr-only">Rates</span>
        </button>

        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          title="Share Portal"
          className="p-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition group relative"
        >
          <Share2 className="w-4 h-4" />
          <span className="sr-only">Share</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMetricsModal(true)}
          title="National Circular Waste Metrics"
          className="p-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition group relative"
        >
          <BarChart3 className="w-4 h-4 text-[#38EF7D]" />
          <span className="sr-only">Metrics</span>
        </button>
      </aside>

      {/* Modal 1: Official Scrap Rate Chart */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-gray-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
                  <Recycle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Official Standard Scrap Benchmark Rates</h3>
                  <p className="text-xs text-gray-500">Government circular economy market price index</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {SCRAP_RATES.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100/60 transition text-xs sm:text-sm"
                >
                  <div>
                    <div className="font-bold text-gray-900">{item.material}</div>
                    <div className="text-[11px] text-gray-500">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-[#136B3B]">{item.rate}</div>
                    <div className="text-[10px] text-gray-400">{item.unit}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">Rates updated weekly per CPCB &amp; MPCB benchmarks</span>
              <button
                type="button"
                onClick={() => setShowRateModal(false)}
                className="px-4 py-2 rounded-lg bg-[#136B3B] text-white font-bold text-xs hover:bg-[#0F5730] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Citizen Feedback & Suggestions */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#136B3B]" />
                <span>Citizen Feedback &amp; Suggestions</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSuccess(false);
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedbackSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#136B3B] mx-auto" />
                <h4 className="font-bold text-gray-900">Thank You for Your Feedback!</h4>
                <p className="text-xs text-gray-600">Your suggestion has been logged with the municipal circular desk.</p>
              </div>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  setFeedbackSuccess(true);
                  setTimeout(() => {
                    setShowFeedbackModal(false);
                    setFeedbackSuccess(false);
                  }, 2200);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name or Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahil / 9876543210"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-[#136B3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Feedback or Suggestion</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us how we can improve scrap collection in your locality..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-[#136B3B]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#136B3B] text-white font-bold text-xs hover:bg-[#0F5730] transition"
                >
                  Submit Citizen Feedback
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Share Portal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-gray-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#136B3B]" />
                <span>Share National Portal</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-600 leading-relaxed">
              Help your neighbors sell recyclables and support circular waste management in your municipality.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Portal URL copied to clipboard!');
                    setShowShareModal(false);
                  }
                }}
                className="w-full py-2.5 rounded-lg bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8] font-bold text-xs hover:bg-[#d8eedf] transition text-center"
              >
                Copy Portal Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: National Circular Waste Metrics */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#136B3B]" />
                <span>National Circular Waste Metrics</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-xs text-emerald-700 font-semibold">Total Recycled</div>
                <div className="text-lg font-extrabold text-emerald-900">142.8 MT</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-xs text-blue-700 font-semibold">Active Kabadiwalas</div>
                <div className="text-lg font-extrabold text-blue-900">1,840+</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-xs text-amber-700 font-semibold">Direct Citizen Payouts</div>
                <div className="text-lg font-extrabold text-amber-900">₹28.4 Lakh</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="text-xs text-purple-700 font-semibold">CO2 Offset</div>
                <div className="text-lg font-extrabold text-purple-900">314 MT eq</div>
              </div>
            </div>
            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowMetricsModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
