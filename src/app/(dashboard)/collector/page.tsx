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
} from 'lucide-react';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import {
  calculateDistanceMeters,
  getCollectorSavedLocation,
  setCollectorSavedLocation,
  DEFAULT_COLLECTOR_HUBS,
  CollectorSavedLocation,
  acceptPickupInTracking,
} from '@/lib/tracking-service';
import {
  triggerCollectorAcceptedNotification,
  triggerCollectorNearNotification,
  triggerPickupCompletedNotification,
  triggerPaymentReceivedNotification,
} from '@/lib/notification-service';

const DEMO_COLLECTOR_REQUESTS: PickupRequest[] = [
  {
    id: 'req-c301-demo-uuid',
    household_id: 'user-h101',
    household: {
      id: 'user-h101',
      full_name: 'Customer (Flat 402, Green Heights)',
      phone: '+91 98201 54321',
      role: 'household',
    },
    status: 'pending',
    address: 'Flat 402, Green Heights, Main Market Road, Near City Center',
    latitude: 19.0760,
    longitude: 72.8777,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Items packed in bags in garage. Ring bell twice upon arrival.',
    total_estimated_weight_kg: 28.5,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      {
        category: 'PAPER',
        approx_weight_kg: 15.0,
        photos: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'],
      },
      {
        category: 'PLASTIC',
        approx_weight_kg: 13.5,
        photos: ['https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'req-c302-demo-uuid',
    household_id: 'user-h102',
    household: {
      id: 'user-h102',
      full_name: 'Priya Verma (Building 3B, Tech Park)',
      phone: '+91 98334 12789',
      role: 'household',
    },
    status: 'pending',
    address: 'Tower B, Station Road West, Commercial Tech Park',
    latitude: 19.0820,
    longitude: 72.8820,
    scheduled_date: 'Today · 6:00 PM',
    notes: 'Copper scrap and e-waste motherboards. Security pass needed at gate.',
    total_estimated_weight_kg: 42.0,
    photos: [
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      {
        category: 'E_WASTE',
        approx_weight_kg: 22.0,
        photos: ['https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80'],
      },
      {
        category: 'METAL',
        approx_weight_kg: 20.0,
        photos: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
];

export default function CollectorDashboard() {
  const [requests, setRequests] = useState<PickupRequest[]>(DEMO_COLLECTOR_REQUESTS);
  const [filterTab, setFilterTab] = useState<'available' | 'my_pickups'>('available');
  const [collectorLoc, setCollectorLoc] = useState<CollectorSavedLocation>(() => getCollectorSavedLocation());
  const [radiusFilter, setRadiusFilter] = useState<'5' | '10' | '25' | 'all'>('10');
  const [showHubPicker, setShowHubPicker] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  useEffect(() => {
    async function loadCollectorData() {
      // 1. Check local pickup requests created by households
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const local = JSON.parse(raw);
          if (Array.isArray(local) && local.length > 0) {
            setRequests((prev) => {
              const combined = [...local, ...prev];
              const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
              return unique as PickupRequest[];
            });
          }
        }
      } catch (err) {
        console.warn('Local request load notice:', err);
      }

      // 2. Query Supabase
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*)')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setRequests((prev) => {
            const combined = [...(data as PickupRequest[]), ...prev];
            const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
            return unique as PickupRequest[];
          });
        }
      } catch (err) {
        console.warn('Supabase collector load notice:', err);
      }
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
          setCollectorLoc({ pos: coords, hubName: areaName, updatedAt: new Date().toISOString() });
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
        setCollectorLoc({ pos: coords, hubName: areaName, updatedAt: new Date().toISOString() });
        setIsDetectingGps(false);
        setShowHubPicker(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        alert('Could not lock GPS location. Please select one of the operating hubs.');
        setIsDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectHub = (hub: { name: string; pos: [number, number] }) => {
    setCollectorSavedLocation(hub.pos, hub.name);
    setCollectorLoc({ pos: hub.pos, hubName: hub.name, updatedAt: new Date().toISOString() });
    setShowHubPicker(false);
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
        const cached = localStorage.getItem('scrapmax_personal_info') || localStorage.getItem('aicle_personal_info');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.fullName) collectorFullName = parsed.fullName;
          if (parsed.phone) collectorPhoneNum = parsed.phone;
        }
      } catch {}
    }

    const finalCollectorName = collectorFullName || (user?.email ? user.email.split('@')[0] : 'Verified Scrap Collector');
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
      acceptPickupInTracking(requestId, collectorObj, collectorLoc.pos, collectorLoc.hubName);
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
          total_estimated_weight_kg: payment?.items.reduce((a, c) => a + c.verifiedWeightKg, 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase payment complete notice:', err);
    }

    setRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'completed' as const,
              collector_id: user?.id || 'demo-collector-id',
              payment,
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

        {/* Personal Recycling Dashboard for Collector */}
        <PersonalDashboard role="collector" />

        {/* Collector Operating Location & Hub Selector */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#136B3B] flex items-center justify-center shrink-0 border border-emerald-200">
                <Compass className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#526056] uppercase tracking-wider">
                  Your Current Operating Base / Hub
                </p>
                <h4 className="text-sm font-extrabold text-[#191C1E] truncate">
                  {collectorLoc.hubName}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={isDetectingGps}
                className="px-3 py-2 rounded-xl bg-[#F4FAF6] hover:bg-[#E6F4EA] text-[#136B3B] text-xs font-bold transition flex items-center gap-1.5 border border-[#A6D5B8]"
              >
                {isDetectingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5" />
                )}
                <span>{isDetectingGps ? 'Locking GPS...' : 'Use My GPS'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHubPicker(!showHubPicker)}
                className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition flex items-center gap-1 border border-gray-200"
              >
                <span>Change Hub</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHubPicker ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Hub Dropdown */}
          {showHubPicker && (
            <div className="pt-2 border-t border-gray-100 space-y-2 animate-in fade-in">
              <p className="text-xs font-bold text-[#191C1E]">Select an Operating Area Hub:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {DEFAULT_COLLECTOR_HUBS.map((hub, idx) => {
                  const isCurrent = collectorLoc.hubName === hub.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectHub(hub)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                        isCurrent
                          ? 'bg-[#E6F4EA] border-[#136B3B] text-[#136B3B]'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="truncate">{hub.name}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#136B3B] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
              Try expanding your radius filter to &quot;All Region&quot; or update your operating base to see more jobs.
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
