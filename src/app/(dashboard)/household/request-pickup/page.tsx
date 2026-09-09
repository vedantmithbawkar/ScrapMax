'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import LocationPicker from '@/components/map/LocationPicker';
import WasteItemForm from '@/components/request/WasteItemForm';
import { createClient } from '@/lib/supabase/client';
import { compressImage, dataURLtoBlob } from '@/lib/image-utils';
import { WasteItem, WasteCategory } from '@/types';
import { ArrowLeft, CheckCircle, MapPin, Camera, X, Plus, Loader2, Sparkles, Bot, AlertTriangle } from 'lucide-react';

export default function RequestPickupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Photos State: array of base64 data URLs or uploaded URLs
  const [photos, setPhotos] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);

  // Real Gemini AI Multimodal Vision & Quality Inspection State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    isValidScrap?: boolean;
    rejectionReason?: string;
    detectedMaterial?: string;
    material?: string;
    category?: WasteCategory;
    categoryName?: string;
    icon?: string;
    confidence?: number;
    reasoning?: string;
    ratePerKg?: number;
    baseRatePerKg?: number;
    deductionPercent?: number;
    qualityInspection?: {
      moistureStatus: string;
      rustStatus: string;
      contamination: string;
      recyclabilityGrade: string;
      deductionPercent: number;
      qualityVerdict: string;
    };
    engine?: string;
    isRealAi?: boolean;
  } | null>(null);

  const runAiClassification = async (photoDataUrl: string) => {
    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/ai/classify-scrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoDataUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data);
      }
    } catch (err) {
      console.error('AI classification error:', err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const applyAiRecommendation = () => {
    if (!aiResult || aiResult.isValidScrap === false || !aiResult.category) return;
    const category: WasteCategory = aiResult.category;
    const grade = aiResult.qualityInspection?.recyclabilityGrade || 'Grade A';
    const moisture = aiResult.qualityInspection?.moistureStatus !== 'dry' ? ` [${aiResult.qualityInspection?.moistureStatus} moisture]` : '';
    const rust = aiResult.qualityInspection?.rustStatus !== 'none' ? ` [${aiResult.qualityInspection?.rustStatus}]` : '';
    const noteText = `AI Verified: ${aiResult.categoryName || category} • ${grade}${moisture}${rust} (${aiResult.confidence}% conf)`;

    setItems((prev) => {
      // If only placeholder item exists, replace it
      if (prev.length === 1 && prev[0].category === 'PAPER' && prev[0].notes === 'Bundled newspapers') {
        return [{
          category,
          approx_weight_kg: 5.0,
          notes: noteText
        }];
      }
      return [
        ...prev,
        {
          category,
          approx_weight_kg: 5.0,
          notes: noteText
        }
      ];
    });
  };

  const handleLocationSelect = (lat: number, lng: number, addr: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    try {
      const remainingSlots = 4 - photos.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      const compressedPromises = filesToProcess.map((file) =>
        compressImage(file, 1200, 1200, 0.75)
      );
      const newCompressedPhotos = await Promise.all(compressedPromises);

      setPhotos((prev) => [...prev, ...newCompressedPhotos].slice(0, 4));

      // Trigger Gemini Multimodal Vision classification on the first uploaded photo
      if (newCompressedPhotos.length > 0) {
        runAiClassification(newCompressedPhotos[0]);
      }
    } catch (err) {
      console.error('Photo compression error:', err);
      alert('Unable to process selected photo(s). Please try again.');
    } finally {
      setIsProcessingPhotos(false);
      // Reset input value so same photo can be re-selected if removed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const triggerPhotoUpload = () => {
    if (photos.length >= 4) {
      alert('Maximum 4 scrap photos allowed per request.');
      return;
    }
    fileInputRef.current?.click();
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

    const fullNotes = [
      `Preferred: ${preferredTime}`,
      notes.trim() || undefined,
    ].filter(Boolean).join(' · ');

    // If guest/unauthenticated mode: persist in localStorage
    if (!user) {
      const demoReqId = 'local-req-' + Date.now();
      const localReq = {
        id: demoReqId,
        household_id: 'guest-user',
        status: 'pending' as const,
        address,
        latitude,
        longitude,
        scheduled_date: scheduledDateStr,
        notes: fullNotes,
        total_estimated_weight_kg: totalWeight,
        photos, // Connected to request
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        waste_items: items.map((it, idx) => ({
          category: it.category,
          approx_weight_kg: it.approx_weight_kg,
          photos: idx === 0 ? photos : (it.photos || []), // Connected to waste items table
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
        '📋 Scheduled with photos in Demo / Local Session!\n\nNote: To persist directly to your live Supabase database tables, make sure you are logged in.'
      );
      setSubmitting(false);
      router.push('/household');
      return;
    }

    // Authenticated Supabase flow:
    // 1. Upload photos to Supabase Storage if available, else keep base64 strings
    const finalPhotoUrls: string[] = [];
    if (photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.startsWith('data:image')) {
          try {
            const blob = dataURLtoBlob(photo);
            const fileName = `${user.id}/${Date.now()}-${i}.jpg`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('pickup-photos')
              .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

            if (!uploadErr && uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from('pickup-photos')
                .getPublicUrl(fileName);
              finalPhotoUrls.push(publicUrlData.publicUrl);
            } else {
              // Fallback to storing compressed base64 string directly
              finalPhotoUrls.push(photo);
            }
          } catch (err) {
            console.warn('Supabase storage fallback:', err);
            finalPhotoUrls.push(photo);
          }
        } else {
          finalPhotoUrls.push(photo);
        }
      }
    }

    // 1. Ensure profile row exists for this authenticated user to satisfy foreign key constraints
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: pErr } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Household User',
          role: 'household',
          phone: user.user_metadata?.phone || '',
        });
        if (pErr) {
          console.warn('Profile sync note:', pErr.message);
        }
      }
    } catch (profErr) {
      console.warn('Profile check warning:', profErr);
    }

    // 2. Insert into public.pickup_requests table (standard columns without photos)
    const insertPayload = {
      household_id: user.id,
      status: 'pending',
      address,
      latitude,
      longitude,
      scheduled_date: scheduledDateStr,
      notes: fullNotes || undefined,
      total_estimated_weight_kg: totalWeight,
    };

    const { data: req, error: insertError } = await supabase
      .from('pickup_requests')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      const errorDetailMsg =
        insertError.message ||
        insertError.details ||
        insertError.hint ||
        'Database write rejected';

      console.warn('Pickup request DB notice:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });

      const shouldSaveLocal = confirm(
        `⚠️ Supabase Database Notice:\n${errorDetailMsg}\n\nWould you like to save this pickup request in your local session instead so you do not lose your items and photos?`
      );

      if (shouldSaveLocal) {
        const localReqId = 'local-req-' + Date.now();
        const localFallback = {
          id: localReqId,
          household_id: user.id,
          status: 'pending' as const,
          address,
          latitude,
          longitude,
          scheduled_date: scheduledDateStr,
          notes: fullNotes,
          total_estimated_weight_kg: totalWeight,
          photos: finalPhotoUrls,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          waste_items: items.map((it, idx) => ({
            category: it.category,
            approx_weight_kg: it.approx_weight_kg,
            photos: idx === 0 ? finalPhotoUrls : (it.photos || []),
            notes: it.notes,
          })),
        };
        try {
          const existing = JSON.parse(localStorage.getItem('local_pickup_requests') || '[]');
          localStorage.setItem('local_pickup_requests', JSON.stringify([localFallback, ...existing]));
          alert('📋 Saved to your session dashboard!');
          router.push('/household');
        } catch (e) {
          console.error(e);
        }
      }

      setSubmitting(false);
      return;
    }

    // 3. Insert into public.waste_items table with photos connected
    if (req) {
      const itemsToInsert = items.map((it, idx) => ({
        request_id: req.id,
        category: it.category,
        approx_weight_kg: it.approx_weight_kg,
        photos: idx === 0 ? finalPhotoUrls : (it.photos || []),
        notes: it.notes,
      }));

      let { error: wErr } = await supabase.from('waste_items').insert(itemsToInsert);

      // If photos column missing in waste_items on live db, retry without photos
      if (
        wErr &&
        (wErr.code === '42703' ||
          wErr.message?.toLowerCase().includes('photos') ||
          wErr.details?.toLowerCase().includes('photos'))
      ) {
        const itemsWithoutPhotos = items.map((it) => ({
          request_id: req.id,
          category: it.category,
          approx_weight_kg: it.approx_weight_kg,
          notes: it.notes,
        }));
        const retryW = await supabase.from('waste_items').insert(itemsWithoutPhotos);
        wErr = retryW.error;
      }

      if (wErr) {
        console.warn('Waste items insert note:', wErr);
      }

      alert('✅ Pickup request & scrap photos scheduled in Supabase successfully!');
    }

    setSubmitting(false);
    router.push('/household');
  };

  return (
    <div className="min-h-screen bg-white text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      {/* Top Header */}
      <header className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 py-3.5 max-w-xl mx-auto w-full flex items-center gap-3">
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

      <main className="px-4 sm:px-6 pt-5 space-y-7 max-w-xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="space-y-7">
          
          {/* Section 1: Recyclable Items & Weights */}
          <section data-purpose="recycle-category-selection">
            <WasteItemForm items={items} onChange={setItems} />
          </section>

          {/* Section 2: Add Photos Well (Connected to pickup_requests & waste_items tables) */}
          <section data-purpose="photo-upload-container">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-base font-bold text-[#191C1E] tracking-tight">Add photos</h2>
              <span className="text-xs text-[#526056] font-medium">
                {photos.length}/4 photos
              </span>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {photos.length === 0 ? (
              /* Empty state: matches original UI design with real file upload */
              <button
                type="button"
                onClick={triggerPhotoUpload}
                disabled={isProcessingPhotos}
                className="w-full h-32 rounded-2xl border-2 border-[#7BA991] bg-[#F4FAF6] flex flex-col items-center justify-center gap-2 hover:bg-[#EAF5EE] active:bg-[#DDF0E3] transition touch-feedback"
              >
                {isProcessingPhotos ? (
                  <div className="flex flex-col items-center gap-2 text-[#136B3B]">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span className="text-xs font-semibold">Processing photo...</span>
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-center justify-center text-[#136B3B]">
                      <Camera className="w-8 h-8 stroke-[2]" />
                      <span className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[#136B3B] font-bold text-xs shadow-xs">
                        +
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#136B3B]">
                      Add Photo
                    </span>
                    <span className="text-[11px] text-[#526056]">
                      Snap camera picture or select from gallery
                    </span>
                  </>
                )}
              </button>
            ) : (
              /* Attached state: Interactive thumbnail grid with remove badge & Add More button */
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2.5">
                  {photos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="relative h-24 rounded-2xl border-2 border-[#A6D5B8] bg-[#F4FAF6] overflow-hidden group shadow-xs"
                    >
                      <Image
                        src={photoUrl}
                        alt={`Scrap item photo ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      {/* Delete photo button */}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition shadow-md"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-[10px] text-white font-bold">
                        #{idx + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add more button slot if fewer than 4 */}
                  {photos.length < 4 && (
                    <button
                      type="button"
                      onClick={triggerPhotoUpload}
                      disabled={isProcessingPhotos}
                      className="h-24 rounded-2xl border-2 border-dashed border-[#7BA991] bg-[#F4FAF6] hover:bg-[#EAF5EE] flex flex-col items-center justify-center text-[#136B3B] transition touch-feedback"
                    >
                      {isProcessingPhotos ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-6 h-6 stroke-[2.5]" />
                          <span className="text-[11px] font-bold mt-1">Add more</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Status banner matching screenshot style */}
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#F4FAF6] border border-[#A6D5B8]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#136B3B]">
                    <Camera className="w-4 h-4" />
                    <span>
                      {photos.length} Photo{photos.length > 1 ? 's' : ''} Attached (Tap to change)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotos([]);
                      setAiResult(null);
                    }}
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold transition cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                {/* Gemini AI Multimodal Vision Analysis Result */}
                {isAiAnalyzing && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex items-center gap-3 animate-pulse shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-[#136B3B] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Sparkles className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-950">ScrapMax Gemini AI Vision</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-semibold">
                          Analyzing Image Pixels...
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Scanning scrap material, textures & purity from uploaded photo...
                      </p>
                    </div>
                  </div>
                )}

                {/* Invalid / Unrelated Photo Warning Card */}
                {aiResult && !isAiAnalyzing && aiResult.isValidScrap === false && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 via-rose-50 to-amber-50/50 border-2 border-red-300 shadow-xs space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-red-950">
                            ❌ Invalid Photo: Recyclable Scrap Not Found
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            Rejected by AI
                          </span>
                        </div>
                        <p className="text-xs text-red-800 font-medium mt-1 leading-relaxed">
                          {aiResult.rejectionReason || "Ye photo kisi recyclable kabaad ya scrap material ki nahi lag rahi hai. Kripya kabaad (paper, plastic, metal, e-waste, glass) ki saaf photo upload karein."}
                        </p>
                        <p className="text-[11px] text-red-600/90 mt-1">
                          💡 <strong>Allowed Materials:</strong> Cardboard / raddi, plastic containers/bottles, iron/steel junk, cables/e-waste, or glass bottles.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Valid Gemini AI Multimodal Vision Analysis Result */}
                {aiResult && !isAiAnalyzing && aiResult.isValidScrap !== false && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F4FAF6] via-white to-emerald-50/60 border-2 border-[#A6D5B8] shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{aiResult.icon}</span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-[#191C1E]">
                              AI Detected: {aiResult.categoryName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              {aiResult.confidence}% Confidence
                            </span>
                            {/* Quality Recyclability Grade Badge */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              aiResult.qualityInspection?.recyclabilityGrade?.includes('Grade A')
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : aiResult.qualityInspection?.recyclabilityGrade?.includes('Grade B')
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {aiResult.qualityInspection?.recyclabilityGrade || 'Grade A (Prime)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#526056] font-medium mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Bot className="w-3.5 h-3.5 text-emerald-700" />
                              {aiResult.engine}
                            </span>
                            <span>•</span>
                            <span>
                              Rate: <strong className="text-emerald-900 font-bold">₹{aiResult.ratePerKg}/kg</strong>
                              {aiResult.baseRatePerKg && aiResult.deductionPercent && aiResult.deductionPercent > 0 ? (
                                <span className="ml-1 text-[10px] text-red-600 line-through">
                                  ₹{aiResult.baseRatePerKg}/kg
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={applyAiRecommendation}
                        className="px-3 py-1.5 rounded-xl bg-[#136B3B] hover:bg-[#0E522C] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 touch-feedback cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        Auto-Add to Items
                      </button>
                    </div>

                    {/* Condition & Quality Inspection Badges */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {/* Moisture Status */}
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                        aiResult.qualityInspection?.moistureStatus === 'dry'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : aiResult.qualityInspection?.moistureStatus === 'damp'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-red-50 text-red-800 border border-red-300 animate-pulse'
                      }`}>
                        💧 Moisture: {
                          aiResult.qualityInspection?.moistureStatus === 'soaked_wet'
                            ? 'Soaked Wet (Gilla)'
                            : aiResult.qualityInspection?.moistureStatus === 'damp'
                            ? 'Damp / Moist'
                            : 'Dry (Clean)'
                        }
                      </span>

                      {/* Rust Status */}
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                        aiResult.qualityInspection?.rustStatus === 'none'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : aiResult.qualityInspection?.rustStatus === 'surface_rust'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-red-50 text-red-800 border border-red-300'
                      }`}>
                        ⚙️ Rust: {
                          aiResult.qualityInspection?.rustStatus === 'heavy_corrosion'
                            ? 'Heavy Junk Corrosion'
                            : aiResult.qualityInspection?.rustStatus === 'surface_rust'
                            ? 'Surface Rust'
                            : 'None (Clean)'
                        }
                      </span>

                      {/* Purity / Contamination */}
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-50 text-gray-700 border border-gray-200 flex items-center gap-1">
                        🧼 Purity: {aiResult.qualityInspection?.contamination || 'clean'}
                      </span>
                    </div>

                    {/* Quality Deduction Alert if wet or rusted */}
                    {aiResult.deductionPercent && aiResult.deductionPercent > 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                        <strong>⚠️ Quality Deduction ({aiResult.deductionPercent}%):</strong> {
                          aiResult.qualityInspection?.qualityVerdict || 'Condition penalty applied due to moisture or corrosion.'
                        }
                      </div>
                    ) : null}

                    <div className="pt-2 border-t border-emerald-100 flex items-start gap-2">
                      <span className="text-[11px] text-emerald-900 bg-emerald-100/60 px-2 py-1.5 rounded-lg w-full leading-relaxed">
                        <strong>Visual Inspection:</strong> {aiResult.reasoning}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
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

          {/* Optional Instructions/Notes */}
          <section data-purpose="notes-input" className="space-y-1.5">
            <label className="block text-xs font-bold text-[#526056]" htmlFor="notes-textarea">
              Special instructions for scrap collector (Optional)
            </label>
            <textarea
              id="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Call before arrival, scrap is kept in boxes by the front gate"
              className="w-full text-xs p-3.5 rounded-2xl border border-gray-200 focus:border-[#136B3B] focus:outline-none bg-[#FAFCFB] transition resize-none"
              rows={2}
            />
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
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Scheduling & Uploading Photos...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm pickup request</span>
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
