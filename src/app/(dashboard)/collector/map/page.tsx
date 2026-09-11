'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import MapContainer from '@/components/map/MapContainer';
import RequestCard from '@/components/request/RequestCard';
import HandoverModal from '@/components/request/HandoverModal';
import ReceiptModal from '@/components/request/ReceiptModal';
import { PickupRequest } from '@/types';
import { createClient } from '@/lib/supabase/client';
import {
  MapPin,
  ArrowLeft,
  Navigation,
  CheckCircle2,
  Phone,
  MessageSquare,
  ExternalLink,
  Copy,
  Check,
  Play,
  Pause,
  AlertCircle,
  ShieldCheck,
  Star,
  Truck,
  Receipt,
  RotateCw,
} from 'lucide-react';
import Link from 'next/link';
import {
  initializeTrackingState,
  getTrackingState,
  subscribeToTracking,
  startRouteSimulation,
  stopRouteSimulation,
  isSimulationRunning,
  markArrivedAtDoorstep,
  completeTrackingPayment,
  formatDistance,
  fetchDrivingRoute,
  getCollectorSavedLocation,
  updateCollectorLivePosition,
  LiveTrackingState,
} from '@/lib/tracking-service';
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
    notes: 'Paper & plastic recyclables ready at society gate. Ring bell twice upon arrival.',
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
    notes: 'Electronic waste, wiring, and computer scrap. Please call before arriving.',
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
    household: {
      id: 'user-h103',
      full_name: 'Vikram Mehta (Shop 12)',
      phone: '+91 98112 34567',
      role: 'household',
    },
    status: 'pending',
    address: 'Ring Road Link, Industrial Estate, Gala No 14',
    latitude: 19.0685,
    longitude: 72.8942,
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
    household: {
      id: 'user-h104',
      full_name: 'Sneha Patel (Bungalow 7)',
      phone: '+91 98450 98765',
      role: 'household',
    },
    status: 'pending',
    address: 'Green Park Colony, Sector 4, Behind Central Bank',
    latitude: 19.0780,
    longitude: 72.8690,
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

function CollectorMapContent() {
  const searchParams = useSearchParams();
  const queryRequestId = searchParams?.get('requestId');

  const [requests, setRequests] = useState<PickupRequest[]>(MOCK_MAP_REQUESTS);
  const [selectedReq, setSelectedReq] = useState<PickupRequest | null>(null);
  const [collectorPos, setCollectorPos] = useState<[number, number] | null>(() => {
    if (typeof window !== 'undefined') {
      return getCollectorSavedLocation().pos;
    }
    return null;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isWatchingGps, setIsWatchingGps] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Live tracking & navigation state for selected request
  const [trackingState, setTrackingState] = useState<LiveTrackingState | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load and merge local and database requests
  useEffect(() => {
    async function loadLiveRequests() {
      let combinedRequests = [...MOCK_MAP_REQUESTS];

      // 1. Check localStorage for local pickup requests
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const local = JSON.parse(raw);
          if (Array.isArray(local) && local.length > 0) {
            combinedRequests = [...local, ...combinedRequests];
          }
        }
      } catch (err) {
        console.warn('Error reading local requests:', err);
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
          combinedRequests = [...(data as PickupRequest[]), ...combinedRequests];
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err);
      }

      // Deduplicate
      const unique = Array.from(
        new Map(combinedRequests.map((item) => [item.id, item])).values()
      ) as PickupRequest[];

      setRequests(unique);

      // Auto-select request from URL query param if present
      if (queryRequestId) {
        const target = unique.find((r) => r.id === queryRequestId);
        if (target) {
          setSelectedReq(target);
          return;
        }
      }

      // Or select first accepted request, or first request
      const activeAccepted = unique.find((r) => ['accepted', 'in_progress'].includes(r.status));
      setSelectedReq(activeAccepted || unique[0] || null);
    }

    loadLiveRequests();
  }, [queryRequestId]);

  // Handle live tracking initialization when selectedReq changes
  useEffect(() => {
    if (!selectedReq) {
      setTrackingState(null);
      setRouteCoords([]);
      return;
    }

    let isMounted = true;

    async function initRoute() {
      const savedHub = getCollectorSavedLocation();
      const householdPos: [number, number] = [selectedReq!.latitude, selectedReq!.longitude];
      const startCollectorPos: [number, number] =
        collectorPos || savedHub.pos || [householdPos[0] + 0.012, householdPos[1] - 0.014];

      const state = await initializeTrackingState({
        requestId: selectedReq!.id,
        householdPos,
        collectorPos: startCollectorPos,
        collectorOriginPos: savedHub.pos,
        collectorOriginAddress: savedHub.hubName,
        householdName: selectedReq!.household?.full_name || 'Household Customer',
        householdPhone: selectedReq!.household?.phone || '+91 98201 54321',
        householdAddress: selectedReq!.address,
        householdLandmark: selectedReq!.notes || 'Opposite Green Park Gate #2',
      });

      if (isMounted) {
        setTrackingState(state);
        setCollectorPos(state.collectorPos);
        setRouteCoords(state.routeCoordinates);
        setIsSimulating(isSimulationRunning(selectedReq!.id));
      }
    }

    initRoute();

    // Subscribe to live tracking updates (from multi-tab / simulation)
    const unsubscribe = subscribeToTracking(selectedReq.id, (newState) => {
      if (isMounted) {
        setTrackingState(newState);
        setCollectorPos(newState.collectorPos);
        setRouteCoords(newState.routeCoordinates);
        setIsSimulating(isSimulationRunning(selectedReq.id));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedReq?.id]);

  // Continuously stream live GPS coordinates to household when on navigation screen
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCollectorPos(coords);
        setIsWatchingGps(true);

        if (selectedReq) {
          const updated = updateCollectorLivePosition(selectedReq.id, coords);
          if (updated) {
            setTrackingState(updated);
          }
        }
      },
      (err) => {
        console.warn('Live GPS background watch note:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [selectedReq?.id]);

  // Handle continuous live GPS watch toggle
  const toggleGpsWatch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    if (isWatchingGps) {
      setIsWatchingGps(false);
      showToast('Live GPS Watch paused');
      return;
    }

    setIsLocating(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCollectorPos(coords);
        setIsLocating(false);
        setIsWatchingGps(true);

        if (selectedReq) {
          const updated = updateCollectorLivePosition(selectedReq.id, coords);
          if (updated) {
            setTrackingState(updated);
          }
        }
      },
      (err) => {
        console.warn('GPS error:', err);
        setIsLocating(false);
        setIsWatchingGps(false);
        alert('Could not lock GPS signal. You can use Route Simulation instead.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyAddress = () => {
    if (!selectedReq?.address) return;
    navigator.clipboard.writeText(selectedReq.address);
    setCopiedAddress(true);
    showToast('📋 Address copied to clipboard!');
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  // Toggle route driving simulation
  const handleToggleSimulation = () => {
    if (!selectedReq) return;

    if (isSimulating) {
      stopRouteSimulation(selectedReq.id);
      setIsSimulating(false);
      showToast('⏸️ Route navigation simulation paused');
    } else {
      setIsSimulating(true);
      showToast('🚀 Simulated drive started! Household is tracking your movement live.');
      startRouteSimulation(selectedReq.id, {
        speedMs: 1400,
        onUpdate: (state) => {
          setTrackingState(state);
          setCollectorPos(state.collectorPos);
          if (state.isNearDoorstep && state.distanceMeters <= 300) {
            showToast('🔔 Doorstep proximity alert triggered for household!');
          }
        },
        onArrived: (state) => {
          setIsSimulating(false);
          setTrackingState(state);
          showToast('🏠 Arrived at household doorstep!');
        },
      });
    }
  };

  // Mark arrived at doorstep directly
  const handleMarkArrived = () => {
    if (!selectedReq) return;
    const updated = markArrivedAtDoorstep(selectedReq.id);
    if (updated) {
      setTrackingState(updated);
      setCollectorPos(updated.collectorPos);
      showToast('🚪 Doorstep arrival confirmed! Household has been notified.');
    }
  };

  // Real reactive collector status updater
  const handleStatusUpdate = async (requestId: string, newStatus: PickupRequest['status']) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        const cached = localStorage.getItem('aicle_personal_info');
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

    if (newStatus === 'accepted') {
      triggerCollectorAcceptedNotification(finalCollectorName);
      showToast('✅ Pickup Accepted! Live route navigation generated.');
    } else if (newStatus === 'in_progress') {
      triggerCollectorNearNotification(500);
      showToast('🚚 Route Started! Household notified collector is en route.');
    } else if (newStatus === 'completed') {
      triggerPickupCompletedNotification();
      showToast('🎉 Pickup Completed and verified!');
    }

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

  // Complete payment and finalize deal
  const handleCompletePayment = async (requestId: string, payment: PickupRequest['payment']) => {
    // 1. Sync via tracking service
    const updatedTracking = completeTrackingPayment(requestId, payment);
    if (updatedTracking) {
      setTrackingState(updatedTracking);
    }

    showToast(`🤝 Deal Settled! Payment of ₹${payment?.totalAmount || 0} credited.`);
    setShowHandoverModal(false);

    setRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'completed' as const,
              payment,
              updated_at: new Date().toISOString(),
            }
          : req
      );
      return updated;
    });

    setSelectedReq((prev) => {
      if (!prev || prev.id !== requestId) return prev;
      return {
        ...prev,
        status: 'completed' as const,
        payment,
        updated_at: new Date().toISOString(),
      };
    });
  };

  const displayedRequests = requests.filter((r) => {
    if (statusFilter === 'pending') return r.status === 'pending';
    if (statusFilter === 'accepted') return ['accepted', 'in_progress'].includes(r.status);
    return true;
  });

  const isActiveJob = selectedReq && ['accepted', 'in_progress'].includes(selectedReq.status);

  // Dynamic map center: prioritize route midpoint, collector pos, or selected pickup
  const mapCenter: [number, number] = collectorPos || (
    selectedReq
      ? [selectedReq.latitude, selectedReq.longitude]
      : requests.length > 0
      ? [requests[0].latitude, requests[0].longitude]
      : [19.076, 72.8777]
  );

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-[#191C1E] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full flex flex-col space-y-4">
        
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
                <Navigation className="w-5 h-5 text-[#136B3B]" />
                <span>ScrapMax Live Pickup Navigation</span>
              </h1>
              <p className="text-xs text-[#6B7280]">
                Live doorstep routing, customer contact details, and distance tracking
              </p>
            </div>
          </div>

          {/* Quick Filter & GPS Tracker Buttons */}
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
                Active ({requests.filter((r) => ['accepted', 'in_progress'].includes(r.status)).length})
              </button>
            </div>

            <button
              type="button"
              onClick={toggleGpsWatch}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                isWatchingGps
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-[#E6F4EA] hover:bg-[#D4EDDC] text-[#136B3B] border-[#A6D5B8]'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isWatchingGps ? 'GPS Watching' : 'Use Live GPS'}</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Map on Left (7 cols), Navigation & Customer Drawer on Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[560px]">
          
          {/* Interactive Map */}
          <div className="lg:col-span-7 relative bg-white p-2 rounded-3xl border border-gray-200 shadow-xs flex flex-col">
            
            {/* Top Overlay Badge when navigating an active route */}
            {isActiveJob && trackingState && (
              <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-emerald-200 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#136B3B] text-white flex items-center justify-center font-black shadow-xs">
                      <Truck className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#526056] uppercase tracking-wider">
                        {trackingState.hasArrived ? 'Arrived at Destination' : 'En Route to Doorstep'}
                      </p>
                      <h4 className="text-sm sm:text-base font-extrabold text-[#191C1E]">
                        {trackingState.hasArrived
                          ? 'At Customer Doorstep'
                          : `${formatDistance(trackingState.distanceMeters)} away • ~${trackingState.etaMinutes} min`}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSimulation}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs ${
                        isSimulating
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-[#136B3B] hover:bg-[#0F5730] text-white'
                      }`}
                    >
                      {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isSimulating ? 'Pause Drive' : 'Simulate Drive'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <MapContainer
              center={mapCenter}
              zoom={14}
              requests={displayedRequests}
              collectorPos={collectorPos}
              originPos={trackingState?.collectorOriginPos}
              originLabel={trackingState?.collectorOriginAddress || 'Collector Hub'}
              routeCoordinates={routeCoords}
              destinationPos={selectedReq ? [selectedReq.latitude, selectedReq.longitude] : null}
              destinationLabel={selectedReq?.household?.full_name ? `${selectedReq.household.full_name}'s Home` : 'Customer Doorstep'}
              fitBoundsToRoute={routeCoords.length >= 2}
              useTruckIconForCollector={true}
              onSelectRequest={(req) => setSelectedReq(req)}
              className="h-full min-h-[440px] lg:min-h-[580px] w-full rounded-2xl overflow-hidden"
            />
          </div>

          {/* Right Column: Customer & Navigation Details Panel */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {selectedReq ? (
              <div className="space-y-4">
                
                {/* 1. Proper Household Address & Customer Contact Card */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Household Customer</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-500">
                      Req #{selectedReq.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Customer Name & Direct Call / WhatsApp Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#136B3B] border border-emerald-200 flex items-center justify-center text-xl font-black shrink-0">
                        {(selectedReq.household?.full_name || 'Customer').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-sm text-[#191C1E] truncate">
                          {selectedReq.household?.full_name || 'Household Customer'}
                        </h3>
                        <p className="text-xs font-mono font-bold text-[#136B3B] mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{selectedReq.household?.phone || '+91 98201 54321'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${(selectedReq.household?.phone || '+919820154321').replace(/\s+/g, '')}`}
                        className="px-3 py-2 rounded-xl bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                        title="Call Customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${(selectedReq.household?.phone || '+919820154321').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedReq.household?.full_name || 'Sir/Madam'}, I am your ScrapMax collector arriving for your scrap pickup.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                        title="WhatsApp Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Complete Household Address Breakdown */}
                  <div className="bg-[#F8FAF9] p-3.5 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#136B3B] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-bold text-[#526056] uppercase tracking-wider">
                            Pickup Doorstep Address
                          </p>
                          <p className="text-xs sm:text-sm font-semibold text-[#191C1E] mt-0.5 leading-snug">
                            {selectedReq.address}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 transition shrink-0"
                        title="Copy Address"
                      >
                        {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {selectedReq.notes && (
                      <div className="pt-2 border-t border-gray-200/60 text-xs text-[#6B7280]">
                        <strong className="text-[#191C1E]">Notes:</strong> &quot;{selectedReq.notes}&quot;
                      </div>
                    )}
                  </div>

                  {/* Navigation Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedReq.latitude},${selectedReq.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Google Maps</span>
                    </a>

                    <Link
                      href={`/collector/chat/${selectedReq.id}`}
                      className="py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>In-App Chat</span>
                    </Link>
                  </div>
                </div>

                {/* 2. Driver Route Status & Doorstep Actions (When Active) */}
                {isActiveJob && (
                  <div className="bg-gradient-to-br from-[#E6F4EA] via-white to-emerald-50 rounded-3xl p-5 border-2 border-[#136B3B] shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#136B3B] animate-ping" />
                        <h4 className="font-extrabold text-sm text-[#136B3B]">
                          Live Navigation Active
                        </h4>
                      </div>
                      <span className="text-xs font-black text-[#191C1E] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                        {trackingState?.hasArrived ? 'Arrived at Doorstep' : `${formatDistance(trackingState?.distanceMeters || 1800)} away`}
                      </span>
                    </div>

                    {/* Simulation Controls */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleToggleSimulation}
                        className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm touch-feedback ${
                          isSimulating
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-[#136B3B] hover:bg-[#0F5730] text-white'
                        }`}
                      >
                        {isSimulating ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>Pause Live Drive Simulation</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            <span>Simulate Drive to Customer Doorstep</span>
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleMarkArrived}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#136B3B] border border-[#A6D5B8] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <span>🚪 Mark Arrived</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowHandoverModal(true)}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#136B3B] to-emerald-700 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span>🔐 Verify OTP &amp; Settle</span>
                        </button>
                      </div>

                      {/* Doorstep OTP reminder */}
                      <div className="bg-white/90 p-2.5 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔐</span>
                          <div>
                            <p className="font-extrabold text-[#191C1E] text-[11.5px]">Doorstep Safety OTP</p>
                            <p className="text-[10px] text-[#526056]">Ask customer for 4-digit PIN before handover</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowHandoverModal(true)}
                          className="px-2.5 py-1 bg-[#136B3B] hover:bg-[#0F5730] text-white rounded-lg text-[10.5px] font-bold transition shadow-2xs"
                        >
                          Enter OTP
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Deal Completed Banner if Completed */}
                {selectedReq.status === 'completed' && (
                  <div className="bg-gradient-to-br from-[#E6F4EA] to-white rounded-3xl p-5 border-2 border-[#136B3B] shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#136B3B] text-white flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#136B3B]">
                          Pickup Successfully Completed &amp; Settled!
                        </h4>
                        <p className="text-xs text-[#526056] mt-0.5">
                          Total Paid: ₹{selectedReq.payment?.totalAmount || Math.round((selectedReq.total_estimated_weight_kg || 5) * 18)} via {selectedReq.payment?.method?.toUpperCase() || 'UPI'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowReceiptModal(true)}
                      className="w-full py-3 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>View Official Digital Receipt</span>
                    </button>
                  </div>
                )}

                {/* 4. RequestCard with full details & payment modal trigger */}
                <RequestCard
                  request={selectedReq}
                  userRole="collector"
                  onStatusUpdate={handleStatusUpdate}
                  onCompletePayment={handleCompletePayment}
                />

              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] text-sm space-y-3">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="font-bold text-[#191C1E] text-base">Select a pickup on the map</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Click any pin to see the household address, call the customer, or start live turn-by-turn route navigation.
                </p>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Handover & Payment Settlement Modal */}
      {showHandoverModal && selectedReq && (
        <HandoverModal
          request={selectedReq}
          onClose={() => setShowHandoverModal(false)}
          onCompletePayment={async (reqId, payment) => {
            await handleCompletePayment(reqId, payment);
          }}
        />
      )}

      {/* Digital Recycling Receipt Modal */}
      {showReceiptModal && selectedReq && (
        <ReceiptModal
          request={selectedReq}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      <BottomNav role="collector" />
    </div>
  );
}

export default function CollectorMapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F9FA] flex items-center justify-center text-sm font-semibold text-gray-500">
          Loading Pickup Route Navigation...
        </div>
      }
    >
      <CollectorMapContent />
    </Suspense>
  );
}
