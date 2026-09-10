'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import MapContainer from '@/components/map/MapContainer';
import RequestCard from '@/components/request/RequestCard';
import { PickupRequest } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { MapPin, ArrowLeft, Navigation, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  triggerCollectorAcceptedNotification,
  triggerCollectorNearNotification,
  triggerPickupCompletedNotification,
  triggerPaymentReceivedNotification,
} from '@/lib/notification-service';

const MOCK_MAP_REQUESTS: PickupRequest[] = [
  {
    id: 'req-map-001',
    household_id: 'user-h101',
    status: 'pending',
    address: 'LBS Marg, Opp. Marathon Monte Carlo, Mulund West, Mumbai',
    latitude: 19.1726,
    longitude: 72.9565,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Paper & plastic recyclables ready at society gate.',
    total_estimated_weight_kg: 18.5,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PAPER', approx_weight_kg: 18.5 }],
  },
  {
    id: 'req-map-002',
    household_id: 'user-h102',
    status: 'pending',
    address: 'Nehru Road, Near Mulund Railway Station West, Mulund West, Mumbai',
    latitude: 19.1745,
    longitude: 72.9535,
    scheduled_date: 'Today · 6:00 PM',
    notes: 'Electronic waste, wiring, and computer scrap.',
    total_estimated_weight_kg: 35.0,
    photos: [
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'E_WASTE', approx_weight_kg: 35.0 }],
  },
  {
    id: 'req-map-003',
    household_id: 'user-h103',
    status: 'pending',
    address: 'Navghar Road, Near Mulund East Railway Station, Mulund East, Mumbai',
    latitude: 19.1685,
    longitude: 72.9642,
    scheduled_date: 'Today · 6:30 PM',
    notes: 'Heavy scrap metal, iron pieces, and packaging boxes.',
    total_estimated_weight_kg: 22.0,
    photos: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'METAL', approx_weight_kg: 22.0 }],
  },
  {
    id: 'req-map-004',
    household_id: 'user-h104',
    status: 'pending',
    address: 'Devidayal Road, Near Kalidas Auditorium, Mulund West, Mumbai',
    latitude: 19.1780,
    longitude: 72.9490,
    scheduled_date: 'Today · 7:00 PM',
    notes: 'Sorted plastic bottles and cardboard packaging.',
    total_estimated_weight_kg: 14.2,
    photos: [
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PLASTIC', approx_weight_kg: 14.2 }],
  },
];

export default function CollectorMapPage() {
  const [requests, setRequests] = useState<PickupRequest[]>(MOCK_MAP_REQUESTS);
  const [selectedReq, setSelectedReq] = useState<PickupRequest | null>(MOCK_MAP_REQUESTS[0]);
  const [collectorPos, setCollectorPos] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load and merge local and database requests
  useEffect(() => {
    async function loadLiveRequests() {
      // 1. Check localStorage for local pickup requests created by citizens
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const local = JSON.parse(raw);
          if (Array.isArray(local) && local.length > 0) {
            // Migrate any old Bangalore fallback coordinates to Mulund West, Mumbai
            const migrated = local.map((req: PickupRequest) => {
              if (
                req.address?.includes('Indiranagar') ||
                (Math.abs((req.latitude || 0) - 12.9784) < 0.1 &&
                  Math.abs((req.longitude || 0) - 77.6408) < 0.1)
              ) {
                return {
                  ...req,
                  address: 'LBS Marg, Mulund West, Mumbai',
                  latitude: 19.1726,
                  longitude: 72.9565,
                };
              }
              return req;
            });
            localStorage.setItem('local_pickup_requests', JSON.stringify(migrated));

            setRequests((prev) => {
              const combined = [...migrated, ...prev];
              const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
              return unique as PickupRequest[];
            });
            setSelectedReq(migrated[0]);
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
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setRequests((prev) => {
            const combined = [...(data as PickupRequest[]), ...prev];
            const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
            return unique as PickupRequest[];
          });
          setSelectedReq(data[0] as PickupRequest);
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err);
      }
    }
    loadLiveRequests();
  }, []);

  // Handle live GPS detection for collector truck position
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCollectorPos(coords);
        setIsLocating(false);
        showToast('📍 Collector GPS location updated on route map');
      },
      (err) => {
        console.warn('GPS notice:', err);
        setIsLocating(false);
        alert('Could not detect GPS coordinates. Map will center on selected pickup.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real, fully reactive collector status updater
  const handleStatusUpdate = async (requestId: string, newStatus: PickupRequest['status']) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const collectorObj = {
      id: user?.id || 'collector-c201',
      full_name: 'Ramesh Kumar (Verified Kabadiwala)',
      phone: '+91 98201 45892',
      role: 'collector' as const,
      rating: 4.9,
      completed_pickups: 126,
    };

    // Trigger smart push notification
    if (newStatus === 'accepted') {
      triggerCollectorAcceptedNotification('Ramesh Kumar (Verified Kabadiwala)');
      showToast('✅ Pickup Accepted! You can now start route navigation or finalize deal.');
    } else if (newStatus === 'in_progress') {
      triggerCollectorNearNotification(500);
      showToast('🚚 Route Started! Household notified collector is nearby.');
    } else if (newStatus === 'completed') {
      triggerPickupCompletedNotification();
      showToast('🎉 Pickup Completed and verified!');
    }

    // 1. Update local requests list
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

    // 2. Update currently selected request in detail drawer
    setSelectedReq((prev) => {
      if (!prev || prev.id !== requestId) return prev;
      return {
        ...prev,
        status: newStatus,
        collector_id: collectorObj.id,
        collector: collectorObj,
        updated_at: new Date().toISOString(),
      };
    });

    // 3. Persist to Supabase
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

  // Handle deal finalization & payment settlement
  const handleCompletePayment = async (requestId: string, payment: PickupRequest['payment']) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (payment) {
      triggerPaymentReceivedNotification(payment.totalAmount, payment.method?.toUpperCase() || 'UPI');
    }
    triggerPickupCompletedNotification();
    showToast(`🤝 Deal Finalized! Digital receipt generated for ₹${payment?.totalAmount || 0}`);

    const verifiedTotalWeight = payment?.items.reduce((a, c) => a + c.verifiedWeightKg, 0);

    setRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'completed' as const,
              payment,
              total_estimated_weight_kg: verifiedTotalWeight ?? req.total_estimated_weight_kg,
              updated_at: new Date().toISOString(),
            }
          : req
      );
      try {
        localStorage.setItem('local_pickup_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setSelectedReq((prev) => {
      if (!prev || prev.id !== requestId) return prev;
      return {
        ...prev,
        status: 'completed' as const,
        payment,
        total_estimated_weight_kg: verifiedTotalWeight ?? prev.total_estimated_weight_kg,
        updated_at: new Date().toISOString(),
      };
    });

    try {
      await supabase
        .from('pickup_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase complete payment notice:', err);
    }
  };

  // Filter requests according to active status tab
  const displayedRequests = requests.filter((r) => {
    if (statusFilter === 'pending') return r.status === 'pending';
    if (statusFilter === 'accepted') return ['accepted', 'in_progress'].includes(r.status);
    return true;
  });

  // Dynamic map center: centers on selected request, collector live pos, or first request
  const mapCenter: [number, number] = selectedReq
    ? [selectedReq.latitude, selectedReq.longitude]
    : collectorPos || (requests.length > 0 ? [requests[0].latitude, requests[0].longitude] : [19.1726, 72.9565]);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#191C1E] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full flex flex-col space-y-4">
        
        {/* Header Strip with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/collector"
              className="p-2 bg-gray-50 hover:bg-gray-100 text-[#191C1E] rounded-xl transition border border-gray-200"
              title="Back to Collector Dashboard"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-[#191C1E] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#136B3B]" />
                <span>Pickup Route Map View</span>
              </h1>
              <p className="text-xs text-[#6B7280]">
                Live OpenStreetMap navigation for scrap pickups near you
              </p>
            </div>
          </div>

          {/* Quick Actions: GPS & Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center rounded-xl bg-gray-100 p-0.5 border border-gray-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#191C1E] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'pending'
                    ? 'bg-white text-[#191C1E] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Pending ({requests.filter((r) => r.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('accepted')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  statusFilter === 'accepted'
                    ? 'bg-white text-[#191C1E] shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Active Route ({requests.filter((r) => ['accepted', 'in_progress'].includes(r.status)).length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E6F4EA] hover:bg-[#D4EDDC] text-[#136B3B] border border-[#A6D5B8] rounded-xl text-xs font-bold transition"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>
        </div>

        {/* Grid Split: Map on left (8 cols), detail drawer on right (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[520px]">
          
          <div className="lg:col-span-8 relative bg-white p-2 rounded-2xl border border-gray-200 shadow-xs flex flex-col">
            <MapContainer
              center={mapCenter}
              zoom={14}
              requests={displayedRequests}
              collectorPos={collectorPos}
              onSelectRequest={(req) => setSelectedReq(req)}
              className="h-full min-h-[420px] lg:min-h-[540px] w-full rounded-xl overflow-hidden"
            />
          </div>

          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold text-[#6B7280] uppercase tracking-wider">
                Selected Pickup Details
              </h3>
              {selectedReq && (
                <span className="text-[11px] font-semibold text-[#136B3B] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Pin Selected
                </span>
              )}
            </div>

            {selectedReq ? (
              <RequestCard
                request={selectedReq}
                userRole="collector"
                onStatusUpdate={handleStatusUpdate}
                onCompletePayment={handleCompletePayment}
              />
            ) : (
              <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-2xl text-[#6B7280] text-sm space-y-2">
                <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="font-bold text-[#191C1E]">No pickup selected</p>
                <p className="text-xs text-gray-500">
                  Click any pickup marker on the map to view scrap details, accept the job, or finalize the deal.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

      <BottomNav role="collector" />
    </div>
  );
}
