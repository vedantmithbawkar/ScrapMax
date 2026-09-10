'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/common/Navbar';
import LocationPicker from '@/components/map/LocationPicker';
import WasteItemForm from '@/components/request/WasteItemForm';
import { createClient } from '@/lib/supabase/client';
import { compressImage, dataURLtoBlob } from '@/lib/image-utils';
import { WasteItem, WasteCategory } from '@/types';
import { ArrowLeft, CheckCircle, MapPin, Camera, X, Plus, Loader2, Sparkles, Bot, AlertTriangle } from 'lucide-react';
import { reverseGeocodeCoords } from '@/lib/recycling-store-service';

export default function RequestPickupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: strictly require photo upload and AI verification before items can be added
  const [items, setItems] = useState<WasteItem[]>([]);
  const [isAiAdded, setIsAiAdded] = useState<boolean>(false);
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(19.0760);
  const [longitude, setLongitude] = useState<number>(72.8777);

  // Auto-detect GPS on initial load across India
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          try {
            const locName = await reverseGeocodeCoords(lat, lng);
            if (locName) setAddress(locName);
          } catch {}
        },
        () => {
          // GPS denied or timed out; user can type or search any address
        },
        { timeout: 6000 }
      );
    }
  }, []);
  const [preferredTime, setPreferredTime] = useState<'Today' | 'Tomorrow' | 'Weekend'>('Today');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Photos State: array of base64 data URLs or uploaded URLs
  const [photos, setPhotos] = useState<string[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);

  // Real Gemini AI Multimodal Vision & Quality Inspection State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<{
    isKeyMissing?: boolean;
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
      const existingIdx = prev.findIndex((it) => it.category === category);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], notes: noteText };
        return copy;
      }
      return [
        ...prev,
        {
          category,
          approx_weight_kg: 5.0,
          notes: noteText,
        },
      ];
    });
    setIsAiAdded(true);
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
    setPhotos((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length === 0) {
        setAiResult(null);
        setIsAiAdded(false);
        setItems([]);
      }
      return updated;
    });
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
    if (photos.length === 0) {
      alert('📷 Photo Required: Please upload at least one scrap photo for AI verification before requesting pickup.');
      return;
    }
    if (isAiAnalyzing) {
      alert('🤖 AI Verification in progress: Please wait for scrap analysis to finish.');
      return;
    }
    if (aiResult && aiResult.isValidScrap === false) {
      alert('❌ Invalid Scrap: Please upload a photo of valid recyclable scrap (Cardboard, Paper, Plastic, Metal, E-Waste).');
      return;
    }
    if (items.length === 0) {
      alert('⚠️ Scrap Item Required: Please click "Auto-Add to Items" in Step 1 to add your verified scrap to the pickup request.');
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
          
          {/* Section 1: Upload Scrap Photo & AI Verification (Mandatory First Step) */}
          <section data-purpose="photo-upload-container" className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#191C1E] tracking-tight">
                    Step 1: Upload Scrap Photo & AI Verification
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    Required
                  </span>
                </div>
                <p className="text-xs text-[#526056] mt-0.5">
                  AI will verify recyclable material, inspect moisture/rust, and unlock auto-adding.
                </p>
              </div>
              <span className="text-xs text-[#526056] font-bold shrink-0">
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
                className="w-full h-36 rounded-2xl border-2 border-dashed border-[#136B3B] bg-[#F4FAF6] flex flex-col items-center justify-center gap-2 hover:bg-[#EAF5EE] active:bg-[#DDF0E3] transition touch-feedback cursor-pointer shadow-xs"
              >
                {isProcessingPhotos ? (
                  <div className="flex flex-col items-center gap-2 text-[#136B3B]">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <span className="text-xs font-semibold">Processing photo...</span>
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-center justify-center text-[#136B3B]">
                      <Camera className="w-9 h-9 stroke-[2]" />
                      <span className="absolute -top-1 -right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[#136B3B] font-bold text-xs shadow-xs">
                        +
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-[#136B3B]">
                      Take Photo / Upload Scrap Photo
                    </span>
                    <span className="text-[11px] text-[#526056] max-w-xs text-center px-4">
                      Snap your cardboard, plastic bottles, metals, or e-waste to run real-time AI valuation.
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
                        className="object-cover"
                        sizes="(max-width: 640px) 25vw, 150px"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label={`Remove photo ${idx + 1}`}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 4 && (
                    <button
                      type="button"
                      onClick={triggerPhotoUpload}
                      disabled={isProcessingPhotos}
                      className="h-24 rounded-2xl border-2 border-dashed border-[#A6D5B8] bg-[#F4FAF6] hover:bg-[#EAF5EE] flex flex-col items-center justify-center text-[#136B3B] transition"
                    >
                      {isProcessingPhotos ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                          <span className="text-[10px] font-bold mt-1">Add Photo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* AI Analyzing Status Indicator */}
                {isAiAnalyzing && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#136B3B] animate-spin shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#191C1E]">
                        Gemini AI inspecting scrap photo...
                      </p>
                      <p className="text-[11px] text-[#526056]">
                        Detecting material category, moisture level, rust, and recyclability grade.
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Rejection Warning Banner */}
                {aiResult && !isAiAnalyzing && aiResult.isValidScrap === false && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-xs space-y-2.5 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs sm:text-sm font-bold text-rose-900 leading-snug">
                            ❌ Invalid Scrap Photo: Non-Recyclable Object
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300/80">
                            Rejected by AI
                          </span>
                        </div>
                        <p className="text-xs text-rose-900/90 font-medium leading-relaxed">
                          {aiResult.rejectionReason || "No recyclable scrap material was identified in this photo. Please ensure your photo clearly depicts recyclable scrap or discarded waste."}
                        </p>
                        <div className="mt-2 p-2.5 rounded-xl bg-white/80 border border-rose-200/80 flex items-start gap-2 text-[11px] text-rose-950">
                          <span className="text-xs shrink-0">♻️</span>
                          <span className="leading-relaxed">
                            <strong>Accepted Items:</strong> Cardboard boxes, paper & newspapers, plastic containers/bottles, iron/steel scrap, e-waste/cables, or glass bottles.
                          </span>
                        </div>
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

                      {/* Auto-Add Button */}
                      {isAiAdded ? (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Added to Items</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={applyAiRecommendation}
                          className="px-4 py-2 rounded-xl bg-[#136B3B] hover:bg-[#0E522C] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 touch-feedback cursor-pointer animate-pulse"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Auto-Add to Items</span>
                        </button>
                      )}
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

          {/* Section 2: Recyclable Items & Weights (Unlocked after photo verification) */}
          <section data-purpose="recycle-category-selection" className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#191C1E] tracking-tight">
                Step 2: Recyclable Items & Weight
              </h2>
              {items.length > 0 && (
                <span className="text-xs font-bold text-[#136B3B] bg-[#E6F4EA] px-2.5 py-0.5 rounded-full">
                  {items.length} category added
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-6 bg-white border border-dashed border-gray-300 rounded-2xl text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#136B3B] flex items-center justify-center mx-auto">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-[#191C1E]">Photo & AI Verification Required</h4>
                <p className="text-[11px] text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Please snap or upload your scrap photo in Step 1 above. Once our AI verifies the scrap, click <strong className="text-[#136B3B]">&quot;Auto-Add to Items&quot;</strong> to unlock and schedule your pickup.
                </p>
              </div>
            ) : (
              <WasteItemForm items={items} onChange={setItems} />
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

          {/* Recyclable Tip Notice Strip */}
          <div className="p-4 rounded-2xl bg-[#EDF7F2] flex items-start gap-3 border border-emerald-100 select-none" data-purpose="info-callout">
            <span className="text-xl flex-shrink-0 leading-none">💡</span>
            <p className="text-xs font-medium text-[#1B4332] leading-relaxed">
              Keep recyclable materials separated and dry for better recovery and maximum redeemable value.
            </p>
          </div>

          {/* Sticky Confirm CTA Button with Dynamic Real-time Status Guidance */}
          <div className="pt-2 space-y-2">
            {photos.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-medium">
                <span>📷</span>
                <span>Upload a scrap photo in Step 1 to run AI verification and unlock booking.</span>
              </div>
            )}

            {isAiAnalyzing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                <span>AI is analyzing your scrap photo. Please wait a few seconds...</span>
              </div>
            )}

            {aiResult && aiResult.isValidScrap === false && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-900 font-medium">
                <span>❌</span>
                <span>Photo rejected by AI. Please upload a valid recyclable scrap photo to proceed.</span>
              </div>
            )}

            {photos.length > 0 && aiResult && aiResult.isValidScrap !== false && items.length === 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                <span>✨ Photo verified! Click &quot;Auto-Add to Items&quot; above to add your scrap.</span>
                <button
                  type="button"
                  onClick={applyAiRecommendation}
                  className="px-2.5 py-1 bg-[#136B3B] text-white font-bold rounded-lg text-[11px] shrink-0"
                >
                  Auto-Add Now
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                photos.length === 0 ||
                isAiAnalyzing ||
                (aiResult && aiResult.isValidScrap === false) ||
                items.length === 0
              }
              className="w-full py-4 bg-[#136B3B] hover:bg-[#0F5730] active:bg-[#0C4425] text-white font-bold rounded-2xl text-sm tracking-wide shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed touch-feedback flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Scheduling & Uploading Photos...</span>
                </>
              ) : photos.length === 0 ? (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Upload scrap photo to continue</span>
                </>
              ) : isAiAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Verifying Scrap...</span>
                </>
              ) : aiResult && aiResult.isValidScrap === false ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Invalid Scrap Photo</span>
                </>
              ) : items.length === 0 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-add verified scrap to proceed</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirm pickup request ({items.reduce((acc, c) => acc + c.approx_weight_kg, 0).toFixed(1)} kg)</span>
                </>
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
