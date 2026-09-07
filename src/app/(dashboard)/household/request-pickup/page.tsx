'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import LocationPicker from '@/components/map/LocationPicker';
import WasteItemForm from '@/components/request/WasteItemForm';
import { createClient } from '@/lib/supabase/client';
import { WasteItem } from '@/types';
import { ArrowLeft, CheckCircle, Calendar, MapPin, Camera } from 'lucide-react';

export default function RequestPickupPage() {
  const router = useRouter();

  // Form State
  const [items, setItems] = useState<WasteItem[]>([
    { category: 'PAPER', approx_weight_kg: 8.5, notes: 'Bundled newspapers' }
  ]);
  const [address, setAddress] = useState<string>('Indiranagar 100ft Road, Bangalore');
  const [latitude, setLatitude] = useState<number>(12.9716);
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [preferredTime, setPreferredTime] = useState<'Today' | 'Tomorrow' | 'Weekend'>('Today');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [photoAdded, setPhotoAdded] = useState<boolean>(false);

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one recyclable waste item.');
      return;
    }
    if (!address.trim()) {
      alert('Please enter or select a valid pickup address.');
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Calculate scheduled date based on preferred time selection
    const targetDate = new Date();
    if (preferredTime === 'Tomorrow') {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (preferredTime === 'Weekend') {
      targetDate.setDate(targetDate.getDate() + (6 - targetDate.getDay() + 7) % 7 || 7);
    }
    const scheduledDateStr = targetDate.toISOString().split('T')[0];

    const totalWeight = items.reduce((acc, curr) => acc + curr.approx_weight_kg, 0);

    if (!user) {
      // Save locally in demo session so users can test the UI flow without getting stuck
      const demoReqId = 'local-req-' + Date.now();
      const localReq = {
        id: demoReqId,
        household_id: 'guest-user',
        status: 'pending' as const,
        address,
        latitude,
        longitude,
        scheduled_date: `${preferredTime} · ${scheduledDateStr}`,
        notes: notes.trim() || undefined,
        total_estimated_weight_kg: totalWeight,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        waste_items: items.map((it) => ({
          category: it.category,
          approx_weight_kg: it.approx_weight_kg,
          notes: it.notes,
        })),
      };

      try {
        const existing = JSON.parse(localStorage.getItem('local_pickup_requests') || '[]');
        localStorage.setItem('local_pickup_requests', JSON.stringify([localReq, ...existing]));
      } catch (err) {
        console.warn('LocalStorage save notice:', err);
      }

      alert(
        '📋 Scheduled in Demo / Guest Mode!\n\nNote: You are currently not signed in. This request is saved in your local session. To persist rows into your live Supabase database (pickup_requests table), please log in with your Supabase account.'
      );
      setSubmitting(false);
      router.push('/household');
      return;
    }

    const { data: req, error } = await supabase
      .from('pickup_requests')
      .insert({
        household_id: user.id,
        status: 'pending',
        address,
        latitude,
        longitude,
        scheduled_date: `${preferredTime} · ${scheduledDateStr}`,
        notes: notes.trim() || undefined,
        total_estimated_weight_kg: totalWeight,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Pickup request error:', error);
      alert('Supabase Error: ' + error.message);
      setSubmitting(false);
      return;
    }

    if (req) {
      const itemsToInsert = items.map((it) => ({
        request_id: req.id,
        category: it.category,
        approx_weight_kg: it.approx_weight_kg,
        notes: it.notes,
      }));
      await supabase.from('waste_items').insert(itemsToInsert);
      alert('✅ Pickup request saved to Supabase successfully!');
    }

    setSubmitting(false);
    router.push('/household');
  };

  return (
    <div className="min-h-screen bg-white text-[#191C1E] flex flex-col font-sans pb-28">
      <Navbar />

      {/* Top Header */}
      <header className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 py-3.5 max-w-md mx-auto w-full flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition touch-feedback"
          type="button"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-[#191C1E]">Request pickup</h1>
      </header>

      <main className="px-4 sm:px-5 pt-5 space-y-7 max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-7">
          
          {/* Section 1: Recyclable Items & Weights */}
          <section data-purpose="recycle-category-selection">
            <WasteItemForm items={items} onChange={setItems} />
          </section>

          {/* Section 2: Add Photos Well */}
          <section data-purpose="photo-upload-container">
            <h2 className="text-base font-bold text-[#191C1E] mb-2.5 tracking-tight">Add photos</h2>
            <button
              type="button"
              onClick={() => setPhotoAdded(!photoAdded)}
              className="w-full h-32 rounded-2xl border-2 border-[#7BA991] bg-[#F4FAF6] flex flex-col items-center justify-center gap-2 hover:bg-[#EAF5EE] active:bg-[#DDF0E3] transition touch-feedback"
            >
              <div className="relative flex items-center justify-center text-[#136B3B]">
                <Camera className="w-8 h-8 stroke-[2]" />
                <span className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[#136B3B] font-bold text-xs shadow-xs">
                  +
                </span>
              </div>
              <span className="text-xs font-bold text-[#136B3B]">
                {photoAdded ? '1 Photo Attached (Tap to change)' : 'Add Photo'}
              </span>
            </button>
          </section>

          {/* Section 3: Pickup Address Input & Map */}
          <section data-purpose="pickup-address-input" className="space-y-2.5">
            <label className="block text-base font-bold text-[#191C1E] tracking-tight" htmlFor="address-input">
              Pickup address
            </label>
            <div className="flex items-center border border-gray-300 rounded-2xl px-3.5 py-3 bg-white focus-within:border-[#136B3B] transition">
              <MapPin className="w-4 h-4 text-[#136B3B] flex-shrink-0 mr-2.5" />
              <input
                id="address-input"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Pickup address or location name"
                className="w-full text-sm text-[#191C1E] placeholder-gray-400 bg-transparent border-none p-0 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-[#6B7280] font-normal px-1 leading-relaxed">
              Drag map marker below for GPS pin-point accuracy, or edit address above.
            </p>

            <div className="pt-1">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                defaultLat={latitude}
                defaultLng={longitude}
                defaultAddress={address}
              />
            </div>
          </section>

          {/* Section 4: Preferred Time Selection */}
          <section data-purpose="preferred-time-picker">
            <h2 className="text-base font-bold text-[#191C1E] mb-2.5 tracking-tight">Preferred time</h2>
            <div className="grid grid-cols-3 gap-2.5">
              {(['Today', 'Tomorrow', 'Weekend'] as const).map((timeOpt) => {
                const isSelected = preferredTime === timeOpt;
                return (
                  <button
                    key={timeOpt}
                    type="button"
                    onClick={() => setPreferredTime(timeOpt)}
                    className={`py-3 px-2 rounded-2xl text-center font-bold text-xs transition touch-feedback ${
                      isSelected
                        ? 'bg-[#136B3B] text-white shadow-xs'
                        : 'bg-white border border-gray-300 text-[#191C1E] hover:bg-gray-50'
                    }`}
                  >
                    {timeOpt}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 5: Recyclable Tip Notice Strip */}
          <div className="p-4 rounded-2xl bg-[#EDF7F2] flex items-start gap-3 border border-emerald-100 select-none" data-purpose="info-callout">
            <span className="text-xl flex-shrink-0 leading-none">💡</span>
            <p className="text-xs font-medium text-[#1B4332] leading-relaxed">
              Keep recyclable materials separated and dry for better recovery and maximum redeemable value.
            </p>
          </div>

          {/* Sticky Confirm CTA Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full py-4 bg-[#136B3B] hover:bg-[#0F5730] active:bg-[#0C4425] text-white font-bold rounded-2xl text-sm tracking-wide shadow-md transition disabled:opacity-50 touch-feedback flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{submitting ? 'Scheduling Pickup...' : 'Confirm pickup request'}</span>
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
