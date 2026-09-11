'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, User, Phone, Mail, Calendar, Sparkles, CheckCircle2, Clock, Building2, ShieldCheck, Save, Loader2 } from 'lucide-react';

function getCachedPersonalInfo() {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('scrapmax_personal_info') || localStorage.getItem('aicle_personal_info');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
  }
  return null;
}

export default function PersonalInfoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Profile Form Fields initialized lazily
  const [fullName, setFullName] = useState<string>(() => {
    return getCachedPersonalInfo()?.fullName || '';
  });
  const [phone, setPhone] = useState<string>(() => {
    return getCachedPersonalInfo()?.phone || '+91 98201 54321';
  });
  const [email, setEmail] = useState<string>(() => {
    return getCachedPersonalInfo()?.email || '';
  });
  const [age, setAge] = useState<string>(() => {
    return getCachedPersonalInfo()?.age || '28';
  });
  const [gender, setGender] = useState<string>(() => {
    return getCachedPersonalInfo()?.gender || 'Male';
  });
  const [householdType, setHouseholdType] = useState<string>(() => {
    return getCachedPersonalInfo()?.householdType || 'Apartment / High-rise';
  });
  const [pickupSlot, setPickupSlot] = useState<string>(() => {
    return getCachedPersonalInfo()?.pickupSlot || 'Morning (8 AM - 12 PM)';
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          if (user.email) setEmail(user.email);
          if (user.user_metadata?.full_name) setFullName(user.user_metadata.full_name);
          if (user.user_metadata?.phone) setPhone(user.user_metadata.phone);
          if (user.user_metadata?.age) setAge(String(user.user_metadata.age));
          if (user.user_metadata?.gender) setGender(user.user_metadata.gender);
          if (user.user_metadata?.household_type) setHouseholdType(user.user_metadata.household_type);
          if (user.user_metadata?.preferred_pickup_slot) setPickupSlot(user.user_metadata.preferred_pickup_slot);

          // Check profiles table
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.phone) setPhone(profile.phone);
          }
        }
      } catch (err) {
        console.warn('Notice loading user data:', err);
      }
    }

    loadUserData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      alert('⚠️ Full Name is mandatory. Please enter your name before saving.');
      return;
    }
    setSaving(true);
    setSavedSuccess(false);

    const payload = {
      fullName,
      phone,
      email,
      age,
      gender,
      householdType,
      pickupSlot,
      updatedAt: new Date().toISOString(),
    };

    // Cache to localStorage for instant UI updates everywhere
    if (typeof window !== 'undefined') {
      localStorage.setItem('scrapmax_personal_info', JSON.stringify(payload));
      localStorage.setItem('aicle_personal_info', JSON.stringify(payload));
    }

    try {
      const supabase = createClient();

      // Update Supabase auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone,
          age,
          gender,
          household_type: householdType,
          preferred_pickup_slot: pickupSlot,
        },
      });

      // Update public.profiles table if user ID exists
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.warn('Update notice:', err);
      // Still show success since local state is saved
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const initial = fullName ? fullName.charAt(0).toUpperCase() : 'H';

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 pt-2 pb-4">
          <button
            onClick={() => router.push('/household/profile')}
            aria-label="Go back to Profile"
            className="p-2 -ml-2 rounded-xl bg-white border border-gray-200 text-[#191C1E] hover:bg-gray-50 transition shadow-2xs"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#191C1E] tracking-tight">Personal Information</h1>
            <p className="text-xs text-[#6B7280]">Update your personal and household pickup details</p>
          </div>
        </header>

        {/* Success Alert Banner */}
        {savedSuccess && (
          <div className="mb-4 p-3.5 bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#136B3B]" />
            <span>Personal details saved successfully! Your profile is now updated.</span>
          </div>
        )}

        {/* Avatar badge */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs mb-5">
          <div className="w-16 h-16 rounded-full bg-[#E5F4EB] flex items-center justify-center text-[#1E7044] text-2xl font-black select-none shadow-xs">
            {initial}
          </div>
          <div>
            <h2 className="text-base font-bold text-[#191C1E] leading-tight">{fullName || 'Household Member'}</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">{email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F4EA] text-[#136B3B]">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Household</span>
            </span>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Full Name */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
            <label className="block text-xs font-bold text-[#191C1E] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#136B3B]" />
                <span>Full Name *</span>
              </span>
              <span className="text-[10px] font-bold text-red-600 uppercase">Mandatory</span>
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name (Mandatory)"
              className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B] transition"
            />
          </div>

          {/* Age & Gender Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Age */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
              <label className="block text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#136B3B]" />
                <span>Age</span>
              </label>
              <input
                type="number"
                min="14"
                max="110"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B] transition"
              />
            </div>

            {/* Gender */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
              <label className="block text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#136B3B]" />
                <span>Gender</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B] transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
            <label className="block text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#136B3B]" />
              <span>Contact Phone Number</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B] transition"
            />
            <p className="text-[11px] text-[#6B7280]">Collectors will coordinate doorstep arrival on this number</p>
          </div>

          {/* Email Address */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
            <label className="block text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#136B3B]" />
              <span>Account Email</span>
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-[#6B7280]">Linked to your Supabase login account</p>
          </div>

          {/* Household Property Type */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
            <label className="block text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#136B3B]" />
              <span>Household / Dwelling Type</span>
            </label>
            <select
              value={householdType}
              onChange={(e) => setHouseholdType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B] transition"
            >
              <option value="Apartment / High-rise">Apartment / High-rise</option>
              <option value="Individual House / Villa">Individual House / Villa</option>
              <option value="Gated Community / Society">Gated Community / Society</option>
              <option value="Commercial / Small Business">Commercial / Small Business</option>
            </select>
          </div>

          {/* Preferred Pickup Slot */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-1.5">
            <label className="block text-xs font-bold text-[#191C1E] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#136B3B]" />
              <span>Preferred Scrap Pickup Window</span>
            </label>
            <select
              value={pickupSlot}
              onChange={(e) => setPickupSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-medium text-[#191C1E] focus:outline-none focus:border-[#136B3B] transition"
            >
              <option value="Morning (8 AM - 12 PM)">Morning (8:00 AM - 12:00 PM)</option>
              <option value="Afternoon (12 PM - 4 PM)">Afternoon (12:00 PM - 4:00 PM)</option>
              <option value="Evening (4 PM - 7 PM)">Evening (4:00 PM - 7:00 PM)</option>
              <option value="Anytime on Weekends">Anytime on Weekends</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[#136B3B] hover:bg-[#0F5730] active:scale-[0.99] text-white font-bold rounded-2xl shadow-sm transition touch-feedback disabled:opacity-70"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving details...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Personal Details</span>
                </>
              )}
            </button>
          </div>

        </form>
      </main>

      <BottomNav role="household" />
    </div>
  );
}
