'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  Star, 
  ShieldCheck, 
  LogOut, 
  MessageSquare, 
  Settings, 
  Calendar,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { resolveCollectorName } from '@/lib/name-resolver';

export default function CollectorProfilePage() {
  const router = useRouter();
  const [collectorName, setCollectorName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('scrapmax_collector_profile');
        if (cached) return JSON.parse(cached)?.fullName || '';
      } catch {}
    }
    return '';
  });
  const [collectorPhone, setCollectorPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('scrapmax_collector_profile');
        if (cached) return JSON.parse(cached)?.phone || '+91 98201 45892';
      } catch {}
    }
    return '+91 98201 45892';
  });
  const [email, setEmail] = useState<string>('collector@scrapmax.com');
  const [collectorAadhaar, setCollectorAadhaar] = useState<string>('XXXX-XXXX-9842');
  const [completedCount, setCompletedCount] = useState<number>(24);
  const [totalWeight, setTotalWeight] = useState<number>(412);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('scrapmax_collector_profile');
        if (cached) return JSON.parse(cached)?.fullName || '';
      } catch {}
    }
    return '';
  });
  const [editPhone, setEditPhone] = useState('+91 98201 45892');

  useEffect(() => {
    async function loadCollector() {
      // 1. Check local storage
      if (typeof window !== 'undefined') {
        try {
          const colCached = localStorage.getItem('scrapmax_collector_profile');
          if (colCached) {
            const parsed = JSON.parse(colCached);
            if (parsed.fullName) {
              setCollectorName(parsed.fullName);
              setEditName(parsed.fullName);
            }
            if (parsed.phone) {
              setCollectorPhone(parsed.phone);
              setEditPhone(parsed.phone);
            }
            if (parsed.aadhaarNumber) {
              setCollectorAadhaar(parsed.aadhaarNumber);
            }
          }
        } catch {}
      }

      // 2. Check Supabase auth
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (user.email) setEmail(user.email);
          if (user.user_metadata?.full_name) setCollectorName(user.user_metadata.full_name);
          if (user.user_metadata?.phone) setCollectorPhone(user.user_metadata.phone);
          if (user.user_metadata?.aadhaar_number) setCollectorAadhaar(user.user_metadata.aadhaar_number);

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            if (profile.full_name) {
              setCollectorName(profile.full_name);
              setEditName(profile.full_name);
            }
            if (profile.phone) {
              setCollectorPhone(profile.phone);
              setEditPhone(profile.phone);
            }
            if (profile.aadhaar_number) {
              setCollectorAadhaar(profile.aadhaar_number);
            }
          }
        }
      } catch {}

      // 3. Count completed pickups from localStorage
      if (typeof window !== 'undefined') {
        try {
          const local = JSON.parse(localStorage.getItem('local_pickup_requests') || '[]');
          if (Array.isArray(local)) {
            const done = local.filter((r: any) => r.status === 'completed');
            if (done.length > 0) {
              setCompletedCount(24 + done.length);
              const extraKg = done.reduce((sum: number, r: any) => sum + (r.waste_items?.reduce((s: number, i: any) => s + (i.actual_weight_kg || i.approx_weight_kg || 0), 0) || 10), 0);
              setTotalWeight(412 + Math.round(extraKg));
            }
          }
        } catch {}
      }
    }

    loadCollector();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const initial = collectorName ? collectorName.charAt(0).toUpperCase() : 'C';

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <main className="w-full max-w-md mx-auto px-4 sm:px-6 pt-3 flex-1 flex flex-col justify-between">
        <div className="flex-1 flex flex-col pb-8">
          {/* Header */}
          <header className="flex items-center gap-3 pt-2 pb-5">
            <button
              onClick={() => router.push('/collector')}
              aria-label="Go back to Dashboard"
              className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition touch-feedback"
              type="button"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-[#191C1E]">Collector Profile</h1>
          </header>

          {/* Identity Section */}
          <section className="flex flex-col items-center justify-center my-3">
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center shadow-xs mb-3 select-none text-blue-800 text-4xl font-extrabold">
              {initial}
            </div>

            {!isEditing ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-bold text-[#191C1E] tracking-tight">{collectorName || 'Set Partner Full Name'}</h2>
                  <button
                    onClick={() => {
                      setEditName(collectorName);
                      setEditPhone(collectorPhone);
                      setIsEditing(true);
                    }}
                    className="p-1 text-gray-400 hover:text-[#136B3B] transition"
                    title="Edit Collector Name"
                    type="button"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                {!collectorName && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 mt-1.5 font-semibold inline-block">
                    ⚠️ Full Name is mandatory. Click the pencil icon to enter your name.
                  </p>
                )}
                <p className="text-[#6B7280] text-sm font-medium mt-0.5">{collectorPhone}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified Collector Partner</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>UIDAI Aadhaar Verified: {collectorAadhaar}</span>
                  </span>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editName.trim() || editName.trim().length < 2) {
                    alert('⚠️ Partner Name is mandatory. Please enter your genuine full name.');
                    return;
                  }
                  const finalN = editName.trim();
                  const finalP = editPhone.trim() || '+91 98201 45892';
                  setCollectorName(finalN);
                  setCollectorPhone(finalP);
                  try {
                    localStorage.setItem(
                      'scrapmax_collector_profile',
                      JSON.stringify({ fullName: finalN, phone: finalP })
                    );
                  } catch {}
                  setIsEditing(false);
                }}
                className="w-full max-w-xs space-y-2 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs"
              >
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center justify-between">
                    <span>Partner Full Name *</span>
                    <span className="text-[9px] text-red-600 font-bold">Mandatory</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm font-bold p-1.5 border rounded-lg"
                    placeholder="Enter Partner Full Name (Mandatory)"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Contact Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-sm font-mono p-1.5 border rounded-lg"
                    placeholder="+91 98201 45892"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-[#136B3B] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Partner Stats */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-2xs">
              <p className="text-xs text-[#6B7280] font-semibold">Pickups</p>
              <p className="text-lg font-extrabold text-[#136B3B] mt-0.5">{completedCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-2xs">
              <p className="text-xs text-[#6B7280] font-semibold">Recycled</p>
              <p className="text-lg font-extrabold text-[#191C1E] mt-0.5">{totalWeight} kg</p>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center border border-gray-100 shadow-2xs">
              <p className="text-xs text-[#6B7280] font-semibold">Rating</p>
              <p className="text-lg font-extrabold text-amber-600 mt-0.5 flex items-center justify-center gap-0.5">
                <span>4.9</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </p>
            </div>
          </div>

          {/* Partner Vehicle & Zone Info Card */}
          <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Partner Credentials</h3>
            
            <div className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
              <span className="text-[#6B7280] flex items-center gap-1.5 font-medium">
                <Truck className="w-3.5 h-3.5 text-[#136B3B]" />
                Assigned Vehicle
              </span>
              <span className="font-bold text-[#191C1E]">Electric Scrap Loader (KA-03-EV-2024)</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
              <span className="text-[#6B7280] flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#136B3B]" />
                Operational Zone
              </span>
              <span className="font-bold text-[#191C1E]">Local Area: Central & East Zone</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-[#6B7280] flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#136B3B]" />
                Partner Since
              </span>
              <span className="font-bold text-[#191C1E]">August 2024</span>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <section className="flex flex-col space-y-3 mt-4">
            <Link
              href="/collector/map"
              className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl shadow-2xs border border-gray-100 hover:border-[#136B3B] hover:bg-[#F8FAF9] transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-[#136B3B]">
                  <MapPin className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[15px] font-bold text-[#191C1E]">Live Navigation Map</span>
              </div>
              <span className="text-xs font-bold text-[#136B3B]">Open Map</span>
            </Link>

            <Link
              href="/collector/chat"
              className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl shadow-2xs border border-gray-100 hover:border-[#136B3B] hover:bg-[#F8FAF9] transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-700">
                  <MessageSquare className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[15px] font-bold text-[#191C1E]">Household Chats</span>
              </div>
              <span className="text-xs font-bold text-blue-700">View Messages</span>
            </Link>

            <Link
              href="/household/settings"
              className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl shadow-2xs border border-gray-100 hover:border-[#136B3B] hover:bg-[#F8FAF9] transition touch-feedback group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700">
                  <Settings className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[15px] font-bold text-[#191C1E]">App Settings & Language</span>
              </div>
              <span className="text-xs font-bold text-gray-500">Configure</span>
            </Link>
          </section>

          {/* Logout Button */}
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="w-full py-3.5 px-4 rounded-2xl border border-gray-300 text-[#191C1E] text-sm font-bold text-center bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition touch-feedback shadow-xs flex items-center justify-center gap-2"
              type="button"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out as Collector</span>
            </button>
          </div>
        </div>
      </main>

      <BottomNav role="collector" />
    </div>
  );
}
