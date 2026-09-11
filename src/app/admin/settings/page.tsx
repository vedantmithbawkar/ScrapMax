'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Settings,
  Scale,
  IndianRupee,
  Save,
  CheckCircle2,
  Users,
  Shield,
  Truck,
  Home,
  Bell,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface MaterialRate {
  id: string;
  name: string;
  category: string;
  ratePerKg: number;
  unit: string;
  icon: string;
}

const DEFAULT_RATES: MaterialRate[] = [
  { id: 'm1', name: 'Newspaper & Books', category: 'PAPER', ratePerKg: 15, unit: 'kg', icon: '📰' },
  { id: 'm2', name: 'Cardboard & Cartons', category: 'PAPER', ratePerKg: 12, unit: 'kg', icon: '📦' },
  { id: 'm3', name: 'PET Bottles & Containers', category: 'PLASTIC', ratePerKg: 20, unit: 'kg', icon: '🧴' },
  { id: 'm4', name: 'Hard Plastics & Crates', category: 'PLASTIC', ratePerKg: 18, unit: 'kg', icon: '🪣' },
  { id: 'm5', name: 'Iron & Steel Scrap', category: 'METAL', ratePerKg: 32, unit: 'kg', icon: '🔩' },
  { id: 'm6', name: 'Copper Wires & Utensils', category: 'METAL', ratePerKg: 440, unit: 'kg', icon: '🪙' },
  { id: 'm7', name: 'Aluminum Cans & Frames', category: 'METAL', ratePerKg: 110, unit: 'kg', icon: '🥫' },
  { id: 'm8', name: 'E-Waste & Motherboards', category: 'E_WASTE', ratePerKg: 65, unit: 'kg', icon: '💻' },
  { id: 'm9', name: 'Glass Bottles', category: 'GLASS', ratePerKg: 2.5, unit: 'kg', icon: '🍾' },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [rates, setRates] = useState<MaterialRate[]>(DEFAULT_RATES);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [minWeight, setMinWeight] = useState<number>(5);
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(12);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState<boolean>(true);
  const [pwaNotifications, setPwaNotifications] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('scrapmax_benchmark_rates');
      if (stored) {
        setRates(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const handleRateChange = (id: string, newRate: number) => {
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ratePerKg: Math.max(0, newRate) } : r))
    );
  };

  const handleSaveRates = () => {
    try {
      localStorage.setItem('scrapmax_benchmark_rates', JSON.stringify(rates));
      setSavedSuccess('Benchmark scrap material rates saved successfully!');
      setTimeout(() => setSavedSuccess(null), 3500);
    } catch {}
  };

  const handleSwitchRole = async (targetRole: 'household' | 'collector' | 'admin') => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ role: targetRole }).eq('id', user.id);
      }
    } catch {}

    if (targetRole === 'household') router.push('/household');
    else if (targetRole === 'collector') router.push('/collector');
    else router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Emerald Hero Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-1 backdrop-blur-xs">
              <Settings className="w-3.5 h-3.5" />
              <span>Platform Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>System &amp; Pricing Settings</span>
            </h1>
            <p className="text-sm text-[#A6D5B8] max-w-xl">
              Configure scrap category benchmark market rates, dispatch parameters &amp; role simulator.
            </p>
          </div>

          <div className="z-10 flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveRates}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#136B3B] font-bold rounded-full text-xs shadow-xs hover:bg-gray-50 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rates</span>
            </button>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full text-xs transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {savedSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{savedSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Columns: Scrap Material Benchmark Rates */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#136B3B] flex items-center justify-center font-bold">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#191C1E]">
                      Benchmark Material Rates (₹ / kg)
                    </h2>
                    <p className="text-xs text-[#6B7280] font-medium">
                      Applied as suggested rates when households request scrap pickups
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-[#136B3B] bg-[#E6F4EA] px-2.5 py-1 rounded-full">
                  Live Rates
                </span>
              </div>

              {/* Rates Table / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rates.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-gray-100 bg-[#F8FAF9] hover:border-emerald-200 hover:bg-white transition space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl select-none">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#191C1E] block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-xs font-black text-gray-700">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={item.ratePerKg}
                        onChange={(e) => handleRateChange(item.id, parseFloat(e.target.value) || 0)}
                        className="w-full py-1.5 px-2 bg-white rounded-xl border border-gray-200 text-sm font-black text-[#191C1E] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 text-right"
                      />
                      <span className="text-xs font-bold text-gray-500">/{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveRates}
                  className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl transition"
                >
                  Save Material Rates
                </button>
              </div>
            </div>

            {/* Platform & Dispatch Parameters */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#191C1E]">Dispatch &amp; Operations Parameters</h2>
                  <p className="text-xs text-[#6B7280] font-medium">Controls automatic collector routing and pickup minimums</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-gray-100 bg-[#F8FAF9] space-y-2">
                  <label className="font-bold text-[#191C1E] block">
                    Max Collector Assignment Radius (km)
                  </label>
                  <p className="text-[11px] text-[#6B7280]">
                    Maximum distance within which collectors receive real-time notifications
                  </p>
                  <input
                    type="number"
                    value={serviceRadiusKm}
                    onChange={(e) => setServiceRadiusKm(parseInt(e.target.value) || 5)}
                    className="w-full p-2 bg-white rounded-xl border border-gray-200 text-sm font-bold text-[#191C1E]"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-gray-100 bg-[#F8FAF9] space-y-2">
                  <label className="font-bold text-[#191C1E] block">
                    Minimum Scrap Pickup Weight (kg)
                  </label>
                  <p className="text-[11px] text-[#6B7280]">
                    Minimum total weight required to request an doorstep pickup
                  </p>
                  <input
                    type="number"
                    value={minWeight}
                    onChange={(e) => setMinWeight(parseInt(e.target.value) || 2)}
                    className="w-full p-2 bg-white rounded-xl border border-gray-200 text-sm font-bold text-[#191C1E]"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right 1 Column: Role Switcher & System Telemetry */}
          <div className="space-y-6">
            
            {/* Instant Role Testing Switcher */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-[#191C1E]">Role Testing Switcher</h3>
              </div>
              <p className="text-xs text-[#6B7280]">
                Quickly switch perspectives to test citizen bookings or collector payments:
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSwitchRole('household')}
                  className="w-full p-3 rounded-2xl border border-blue-100 bg-blue-50/60 hover:bg-blue-100/80 text-blue-900 font-bold text-xs flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4 text-blue-700" />
                    <span>Household Portal</span>
                  </div>
                  <span className="text-[10px] text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    Switch →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchRole('collector')}
                  className="w-full p-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-900 font-bold text-xs flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Collector Portal</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                    Switch →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchRole('admin')}
                  className="w-full p-3 rounded-2xl border border-purple-200 bg-purple-100/80 text-purple-900 font-bold text-xs flex items-center justify-between transition shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-purple-800" />
                    <span>Admin Console (Active)</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-purple-700" />
                </button>
              </div>
            </div>

            {/* Platform Specifications */}
            <div className="bg-[#191C1E] text-white rounded-3xl p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>PWA Deployment Specs</span>
              </h3>
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span>Application</span>
                  <span className="font-bold text-white">ScrapMax PWA</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span>Core Framework</span>
                  <span className="font-mono text-emerald-400">Next.js 16 (Turbopack)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span>Payment Gateway</span>
                  <span className="font-bold text-white">UPI Deep Link + QR</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Storage Engine</span>
                  <span className="font-bold text-white">Supabase PostgreSQL</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="admin" />
    </div>
  );
}
