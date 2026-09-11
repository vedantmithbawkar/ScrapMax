'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import RequestCard from '@/components/request/RequestCard';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest } from '@/types';
import {
  MapPin,
  History,
  Filter,
  Navigation,
  Compass,
  Check,
  ChevronDown,
  Loader2,
  Crosshair,
  ShieldCheck,
} from 'lucide-react';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import {
  calculateDistanceMeters,
  getCollectorSavedLocation,
  setCollectorSavedLocation,
  CollectorSavedLocation,
  acceptPickupInTracking,
} from '@/lib/tracking-service';
import { resolveCollectorName } from '@/lib/name-resolver';
import {
  triggerCollectorAcceptedNotification,
  triggerCollectorNearNotification,
  triggerPickupCompletedNotification,
  triggerPaymentReceivedNotification,
} from '@/lib/notification-service';
import { isCollectorAadhaarVerified } from '@/lib/aadhaar-service';

export default function CollectorDashboard() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [filterTab, setFilterTab] = useState<'available' | 'my_pickups'>('available');
  const [collectorLoc, setCollectorLoc] = useState<CollectorSavedLocation>(() => getCollectorSavedLocation());
  const [radiusFilter, setRadiusFilter] = useState<'5' | '10' | '25' | 'all'>('10');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [collectorAadhaar, setCollectorAadhaar] = useState<string>('XXXX-XXXX-9842');

  useEffect(() => {
    async function loadCollectorData() {
      let combined: PickupRequest[] = [];

      // 1. Check local pickup requests created by households
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const local = JSON.parse(raw);
          if (Array.isArray(local) && local.length > 0) {
            combined = [...local];
          }
        }
      } catch (err) {
        console.warn('Local request load notice:', err);
      }

      // 2. Query Supabase joining customer profile
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*), household:profiles!household_id(id, full_name, phone, role)')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const normalized = (data as any[]).map((r) => ({
            ...r,
            payment: r.payment || r.payment_json || undefined,
            contact_name: r.household?.full_name || r.contact_name,
            contact_phone: r.household?.phone || r.contact_phone,
          }));
          combined = [...normalized, ...combined];
        }
      } catch (err) {
        console.warn('Supabase collector load notice:', err);
      }

      // Check current collector Aadhaar verification & enforce verification
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('aadhaar_number, aadhaar_verified, role')
            .eq('id', user.id)
            .maybeSingle();

          const isVerified = isCollectorAadhaarVerified(
            user.email,
            prof?.aadhaar_verified,
            user.user_metadata?.aadhaar_verified
          );

          if (!isVerified) {
            // Unverified collector accessed directly - redirect to login to complete verification
            window.location.href = '/login?notice=aadhaar_required';
            return;
          }

          if (prof?.aadhaar_number) {
            setCollectorAadhaar(prof.aadhaar_number);
          }
        }
      } catch {}

      try {
        const cached = localStorage.getItem('scrapmax_collector_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.aadhaarNumber) setCollectorAadhaar(parsed.aadhaarNumber);
        }
      } catch {}

      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values()) as PickupRequest[];
      setRequests(unique);
    }
    loadCollectorData();
  }, []);

  // Automatically acquire collector's live GPS position on dashboard load
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          let areaName = `Live GPS (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}`
            );
            const data = await res.json();
            if (data && data.address) {
              const road = data.address.road || data.address.suburb || data.address.neighbourhood;
              const city = data.address.city || data.address.town || 'Area';
              areaName = road ? `${road}, ${city}` : city;
            }
          } catch {}
          setCollectorSavedLocation(coords, areaName);
          setCollectorLoc({ pos: coords, locationName: areaName, hubName: areaName, updatedAt: new Date().toISOString() });
        },
        (err) => {
          console.warn('Auto GPS notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        let areaName = `Live GPS (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}`
          );
          const data = await res.json();
          if (data && data.address) {
            const road = data.address.road || data.address.suburb || data.address.neighbourhood;
            const city = data.address.city || data.address.town || 'Area';
            areaName = road ? `${road}, ${city}` : city;
          }
        } catch {}
        setCollectorSavedLocation(coords, areaName);
        setCollectorLoc({ pos: coords, locationName: areaName, hubName: areaName, updatedAt: new Date().toISOString() });
        setIsDetectingGps(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        alert('Could not detect live GPS. Please allow location access in your browser settings.');
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleStatusUpdate = async (requestId: string, newStatus: PickupRequest['status']) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Dynamically retrieve collector details from auth metadata, profiles, or cache
    let collectorFullName = user?.user_metadata?.full_name;
    let collectorPhoneNum = user?.user_metadata?.phone;

    if (user && (!collectorFullName || !collectorPhoneNum)) {
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();
        if (prof?.full_name) collectorFullName = prof.full_name;
        if (prof?.phone) collectorPhoneNum = prof.phone;
      } catch {}
    }

    if (!collectorFullName && typeof window !== 'undefined') {
      try {
        const colCached = localStorage.getItem('scrapmax_collector_profile');
        if (colCached) {
          const parsed = JSON.parse(colCached);
          if (parsed.fullName) collectorFullName = parsed.fullName;
          if (parsed.phone) collectorPhoneNum = parsed.phone;
        }
      } catch {}
    }

    const finalCollectorName = resolveCollectorName(
      collectorFullName || (user?.user_metadata?.full_name) || (user?.email ? user.email.split('@')[0] : null)
    );
    const finalCollectorPhone = collectorPhoneNum || '+91 98201 45892';

    const collectorObj = {
      id: user?.id || 'collector-c201',
      full_name: finalCollectorName,
      phone: finalCollectorPhone,
      role: 'collector' as const,
      rating: 4.9,
      completed_pickups: 126,
    };

    // Trigger live smart notifications & sync with collector location
    if (newStatus === 'accepted') {
      triggerCollectorAcceptedNotification(finalCollectorName);
      acceptPickupInTracking(requestId, collectorObj, collectorLoc.pos, collectorLoc.locationName || collectorLoc.hubName);
    } else if (newStatus === 'in_progress') {
      triggerCollectorNearNotification(500);
    } else if (newStatus === 'completed') {
      triggerPickupCompletedNotification();
    }

    // Local state update
    setRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: newStatus,
              collector_id: collectorObj.id,
              collector: collectorObj,
              updated_at: new Date().toISOString(),
            }
          : req
      );
      try {
        localStorage.setItem('local_pickup_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Update in Supabase
    try {
      await supabase
        .from('pickup_requests')
        .update({
          status: newStatus,
          collector_id: collectorObj.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase status update notice:', err);
    }
  };

  const handleCompletePayment = async (requestId: string, payment: PickupRequest['payment']) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Trigger payment received notification
    if (payment) {
      triggerPaymentReceivedNotification(payment.totalAmount, payment.method?.toUpperCase() || 'UPI');
    }
    triggerPickupCompletedNotification();

    try {
      await supabase
        .from('pickup_requests')
        .update({
          status: 'completed',
          collector_id: user?.id || 'demo-collector-id',
          payment_json: payment,
          total_estimated_weight_kg: payment?.items.reduce((a, c) => a + c.verifiedWeightKg, 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase payment complete notice:', err);
    }

    try {
      const notifications = JSON.parse(localStorage.getItem('scrapmax_payment_notifications') || '[]');
      notifications.push({
        id: payment?.transactionId || 'TXN-' + Date.now(),
        requestId,
        amount: payment?.totalAmount || 0,
        method: payment?.method || 'upi',
        timestamp: new Date().toISOString(),
        dismissed: false,
      });
      localStorage.setItem('scrapmax_payment_notifications', JSON.stringify(notifications));
    } catch {}

    setRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'completed' as const,
              collector_id: user?.id || 'demo-collector-id',
              payment,
              payment_json: payment as any,
              total_estimated_weight_kg: payment?.items.reduce((a, c) => a + c.verifiedWeightKg, 0),
            }
          : req
      );
      try {
        localStorage.setItem('local_pickup_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const filteredRequests = requests.filter((r) => {
    if (filterTab === 'available' && r.status !== 'pending') return false;
    if (filterTab === 'my_pickups' && r.status === 'pending') return false;

    // Radius filter for available jobs
    if (filterTab === 'available' && radiusFilter !== 'all') {
      const maxMeters = Number(radiusFilter) * 1000;
      const d = calculateDistanceMeters(collectorLoc.pos[0], collectorLoc.pos[1], r.latitude, r.longitude);
      if (d > maxMeters) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Hero Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Scrap Collector Portal</span>
            </h1>
            <p className="text-sm text-[#A6D5B8]">
              Browse household waste pickup requests, accept jobs, and navigate route maps.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8] shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>UIDAI Aadhaar Verified: {collectorAadhaar}</span>
              </span>
            </div>
          </div>

          <Link
            href="/collector/map"
            className="z-10 flex items-center gap-2 px-5 py-3 bg-white text-[#136B3B] font-bold rounded-full text-xs shadow-xs hover:bg-gray-50 transition"
          >
            <MapPin className="w-4 h-4" />
            <span>Open Map Route</span>
          </Link>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* RECYCLER MARKETPLACE INTEGRATION BANNER */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-[#136B3B] to-[#0A3D20] text-white rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                Two-Sided Recycling Market
              </span>
              <h2 className="text-lg sm:text-xl font-bold">
                Have Bulk Recyclables? Sell Directly to Recyclers
              </h2>
              <p className="text-xs text-[#A6D5B8] max-w-xl">
                Match your collected circuit boards, copper wire, aluminium, and batteries to verified facilities at locked rates per KG.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/collector/find-buyers"
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black rounded-full shadow-sm transition touch-feedback flex items-center gap-1.5"
              >
                <span>Find Buyers (Match Scrap)</span>
              </Link>
              <Link
                href="/collector/demand-board"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/20 text-white text-xs font-bold rounded-full transition touch-feedback"
              >
                Demand Board
              </Link>
              <Link
                href="/collector/offers"
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-full transition touch-feedback"
              >
                My Offers
              </Link>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Personal Recycling Dashboard for Collector */}
        <PersonalDashboard role="collector" />

        {/* Collector Live GPS Status */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-10 rounded-2xl bg-emerald-50 text-[#136B3B] flex items-center justify-center shrink-0 border border-emerald-200">
                <Compass className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-bold text-[#526056] uppercase tracking-wider">
                    Collector Live GPS
                  </p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8]">
                    Live Tracking On
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-[#191C1E] truncate mt-0.5">
                  {collectorLoc.locationName || collectorLoc.hubName || 'Live GPS Active'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="px-3.5 py-2 rounded-xl bg-[#F4FAF6] hover:bg-[#E6F4EA] text-[#136B3B] text-xs font-bold transition flex items-center gap-1.5 border border-[#A6D5B8] shadow-2xs touch-feedback"
              >
                {isDetectingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5" />
                )}
                <span>{isDetectingGps ? 'Locating...' : 'Refresh Live GPS'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterTab('available')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                filterTab === 'available'
                  ? 'bg-[#136B3B] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#191C1E] hover:bg-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Available Nearby Pickups ({requests.filter((r) => r.status === 'pending').length})</span>
            </button>

            <button
              onClick={() => setFilterTab('my_pickups')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                filterTab === 'my_pickups'
                  ? 'bg-[#136B3B] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#191C1E] hover:bg-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>My Active & Past Pickups ({requests.filter((r) => r.status !== 'pending').length})</span>
            </button>
          </div>

          {/* Radius Filter Pills when in available view */}
          {filterTab === 'available' && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 text-xs font-bold self-start sm:self-auto">
              <span className="text-[11px] text-gray-500 pl-2 pr-1 font-semibold">Radius:</span>
              {(['5', '10', '25', 'all'] as const).map((rad) => {
                const isSel = radiusFilter === rad;
                return (
                  <button
                    key={rad}
                    type="button"
                    onClick={() => setRadiusFilter(rad)}
                    className={`px-2.5 py-1 rounded-xl transition ${
                      isSel
                        ? 'bg-[#E6F4EA] text-[#136B3B] font-extrabold shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {rad === 'all' ? 'All Region' : `< ${rad} km`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feed List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] text-sm space-y-2">
            <p className="font-bold text-[#191C1E]">No pickup requests found within {radiusFilter === 'all' ? 'this region' : `${radiusFilter} km`}.</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Try expanding your radius filter to &quot;All Region&quot; or refresh your Live GPS to see more nearby jobs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => {
              const distanceKm = Number(
                (calculateDistanceMeters(collectorLoc.pos[0], collectorLoc.pos[1], req.latitude, req.longitude) / 1000).toFixed(1)
              );
              return (
                <RequestCard
                  key={req.id}
                  request={req}
                  userRole="collector"
                  collectorDistanceKm={distanceKm}
                  onStatusUpdate={handleStatusUpdate}
                  onCompletePayment={handleCompletePayment}
                />
              );
            })}
          </div>
        )}

      </main>

      <BottomNav role="collector" />
    </div>
  );
}
