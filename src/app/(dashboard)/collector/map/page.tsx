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
import { resolveCollectorName, resolveHouseholdName } from '@/lib/name-resolver';
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
  markArrivedAtDoorstep,
  completeTrackingPayment,
  calculateDistanceMeters,
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

function CollectorMapContent() {
  const searchParams = useSearchParams();
  const queryRequestId = searchParams?.get('requestId');

  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [selectedReq, setSelectedReq] = useState<PickupRequest | null>(null);
  const [collectorPos, setCollectorPos] = useState<[number, number] | null>(() => {
    if (typeof window !== 'undefined') {
      return getCollectorSavedLocation().pos;
    }
    return null;
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isWatchingGps, setIsWatchingGps] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Live tracking & navigation state for selected request
  const [trackingState, setTrackingState] = useState<LiveTrackingState | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Load and merge local and database requests with fallback resilience
  useEffect(() => {
    async function loadLiveRequests() {
      let combinedRequests: PickupRequest[] = [];

      // 1. Check localStorage for local pickup requests
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const local = JSON.parse(raw);
          if (Array.isArray(local) && local.length > 0) {
            combinedRequests = [...local];
          }
        }
      } catch (err) {
        console.warn('Error reading local requests:', err);
      }

      // 2. Query Supabase joining customer profile with resilient fallback
      try {
        const supabase = createClient();
        let { data, error } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*)')
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false });

        if (!data || data.length === 0) {
          try {
            const res = await supabase
              .from('pickup_requests')
              .select('*, waste_items(*), household:profiles!household_id(id, full_name, phone, role)')
              .in('status', ['pending', 'accepted', 'in_progress'])
              .order('created_at', { ascending: false });
            if (res.data && res.data.length > 0) {
              data = res.data;
            }
          } catch {}
        }

        if (data && data.length > 0) {
          const normalized = (data as any[]).map((r) => ({
            ...r,
            payment: r.payment || r.payment_json || undefined,
            contact_name: r.household?.full_name || r.contact_name,
            contact_phone: r.household?.phone || r.contact_phone,
          }));
          combinedRequests = [...normalized, ...combinedRequests];
        }
      } catch (err) {
        console.warn('Supabase fetch notice:', err);
      }

      // Fallback demo pickups if no live/local requests exist
      const fallbackList: PickupRequest[] = [
        {
          id: 'req-c303',
          household_id: 'u3',
          status: 'pending',
          address: 'HSR Layout Sector 2, 19th Main, Bangalore',
          latitude: 12.9121,
          longitude: 77.6446,
          scheduled_date: 'Today · 4:00 PM',
          notes: 'Old CPU cabinet, aluminum vessels, copper wire bundles.',
          total_estimated_weight_kg: 18.5,
          created_at: new Date(Date.now() - 1800000).toISOString(),
          updated_at: new Date().toISOString(),
          waste_items: [
            { category: 'E_WASTE', approx_weight_kg: 10.5, notes: 'Desktop towers' },
            { category: 'METAL', approx_weight_kg: 8.0, notes: 'Copper coils' },
          ],
        },
        {
          id: 'req-c302',
          household_id: 'u2',
          collector_id: 'collector-c201',
          status: 'accepted',
          address: 'Koramangala 4th Block, 80ft Road, Bangalore',
          latitude: 12.9345,
          longitude: 77.6242,
          scheduled_date: 'Today · 3:00 PM',
          notes: 'Gate code 4092. Bags kept at porch.',
          total_estimated_weight_kg: 12.0,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          updated_at: new Date().toISOString(),
          waste_items: [
            { category: 'PLASTIC', approx_weight_kg: 7.0 },
            { category: 'PAPER', approx_weight_kg: 5.0 },
          ],
        },
      ];

      const finalList = combinedRequests.length > 0 ? combinedRequests : fallbackList;

      // Deduplicate by ID
      const unique = Array.from(
        new Map(finalList.map((item) => [item.id, item])).values()
      ) as PickupRequest[];

      setRequests(unique);

      // Auto-select request from URL query param if present
      if (queryRequestId) {
        const target = unique.find((r) => r.id === queryRequestId);
        if (target) {
          setSelectedReq(target);
          if (['accepted', 'in_progress'].includes(target.status)) {
            setStatusFilter('active');
          } else if (target.status === 'pending' || (target.status as string) === 'open') {
            setStatusFilter('pending');
          }
          return;
        }
      }

      // Or select first active request, or first request
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
      const savedCollectorLoc = getCollectorSavedLocation();
      const householdPos: [number, number] = [selectedReq!.latitude, selectedReq!.longitude];

      let startCollectorPos: [number, number];
      if (collectorPos) {
        const d = calculateDistanceMeters(collectorPos[0], collectorPos[1], householdPos[0], householdPos[1]);
        startCollectorPos = d < 50000 ? collectorPos : [householdPos[0] + 0.012, householdPos[1] - 0.014];
      } else if (savedCollectorLoc.pos) {
        const d = calculateDistanceMeters(savedCollectorLoc.pos[0], savedCollectorLoc.pos[1], householdPos[0], householdPos[1]);
        startCollectorPos = d < 50000 ? savedCollectorLoc.pos : [householdPos[0] + 0.012, householdPos[1] - 0.014];
      } else {
        startCollectorPos = [householdPos[0] + 0.012, householdPos[1] - 0.014];
      }

      const state = await initializeTrackingState({
        requestId: selectedReq!.id,
        householdPos,
        collectorPos: startCollectorPos,
        collectorOriginPos: savedCollectorLoc.pos,
        collectorOriginAddress: savedCollectorLoc.locationName || savedCollectorLoc.hubName || 'Collector Live Location',
        householdName: resolveHouseholdName(selectedReq!.household?.full_name || selectedReq!.contact_name),
        householdPhone: selectedReq!.household?.phone || selectedReq!.contact_phone || '+91 98201 54321',
        householdAddress: selectedReq!.address,
        householdLandmark: selectedReq!.notes || 'Opposite Green Park Gate #2',
      });

      if (isMounted) {
        setTrackingState(state);
        setCollectorPos(state.collectorPos);
        setRouteCoords(state.routeCoordinates);
      }
    }

    initRoute();

    // Subscribe to live tracking updates (from multi-tab / real GPS)
    const unsubscribe = subscribeToTracking(selectedReq.id, (newState) => {
      if (isMounted) {
        setTrackingState(newState);
        setCollectorPos(newState.collectorPos);
        setRouteCoords(newState.routeCoordinates);
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
        alert('Could not lock GPS signal. Please ensure location permissions are enabled.');
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

    if (newStatus === 'accepted') {
      const targetReq = requests.find((r) => r.id === requestId);
      if (targetReq && collectorPos) {
        const distKm = calculateDistanceMeters(collectorPos[0], collectorPos[1], targetReq.latitude, targetReq.longitude) / 1000;
        if (distKm > 25) {
          showToast(`❌ Out of Radius: Pickup is ${distKm.toFixed(1)} km away (exceeds 25 km service limit).`);
          return;
        }
      }
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
              payment_json: payment as any,
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
        payment_json: payment as any,
        updated_at: new Date().toISOString(),
      };
    });

    // 2. Persist to Supabase pickup_requests
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('pickup_requests')
        .update({
          status: 'completed',
          collector_id: user?.id || selectedReq?.collector_id || undefined,
          payment_json: payment,
          total_estimated_weight_kg:
            payment?.items?.reduce((a, c) => a + c.verifiedWeightKg, 0) ||
            selectedReq?.total_estimated_weight_kg,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase payment sync notice:', err);
    }

    // 3. Persist notification for household
    try {
      const notifications = JSON.parse(localStorage.getItem('scrapmax_payment_notifications') || '[]');
      notifications.push({
        id: payment?.transactionId || 'TXN-' + Date.now(),
        requestId,
        amount: payment?.totalAmount || 0,
        method: payment?.method || 'upi',
        timestamp: new Date().toISOString(),
        householdId: selectedReq?.household_id,
        dismissed: false,
      });
      localStorage.setItem('scrapmax_payment_notifications', JSON.stringify(notifications));
    } catch {}
  };

  const allCount = requests.length;
  const pendingCount = requests.filter(
    (r) => r.status === 'pending' || (r.status as string) === 'open'
  ).length;
  const activeCount = requests.filter(
    (r) => r.status === 'accepted' || r.status === 'in_progress'
  ).length;

  const displayedRequests = requests.filter((r) => {
    if (statusFilter === 'pending') {
      return r.status === 'pending' || (r.status as string) === 'open';
    }
    if (statusFilter === 'active') {
      return r.status === 'accepted' || r.status === 'in_progress';
    }
    return true;
  });

  // Automatically synchronize selectedReq whenever statusFilter or displayedRequests changes
  useEffect(() => {
    if (displayedRequests.length === 0) {
      setSelectedReq(null);
    } else if (!selectedReq || !displayedRequests.some((r) => r.id === selectedReq.id)) {
      setSelectedReq(displayedRequests[0]);
    }
  }, [statusFilter, displayedRequests]);

  const isActiveJob = Boolean(selectedReq && ['accepted', 'in_progress'].includes(selectedReq.status));

  // Dynamic map center: prioritize selected pickup, collector pos, or first displayed request
  const mapCenter: [number, number] = collectorPos || (
    selectedReq && displayedRequests.some((r) => r.id === selectedReq.id)
      ? [selectedReq.latitude, selectedReq.longitude]
      : displayedRequests.length > 0
      ? [displayedRequests[0].latitude, displayedRequests[0].longitude]
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
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-[#191C1E] shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({allCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'pending'
                    ? 'bg-white text-[#191C1E] shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === 'active'
                    ? 'bg-white text-[#191C1E] shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Active ({activeCount})
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
                    <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#136B3B] text-white flex items-center gap-1.5 shadow-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Live Route</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <MapContainer
              center={mapCenter}
              zoom={13}
              requests={displayedRequests}
              selectedRequestId={selectedReq?.id}
              originPos={trackingState?.collectorOriginPos}
              originLabel={trackingState?.collectorOriginAddress || 'Collector Live Location'}
              routeCoordinates={isActiveJob ? routeCoords : []}
              destinationPos={isActiveJob && selectedReq ? [selectedReq.latitude, selectedReq.longitude] : null}
              destinationLabel={selectedReq?.household?.full_name ? `${selectedReq.household.full_name}'s Home` : 'Customer Doorstep'}
              fitBoundsToRoute={Boolean(isActiveJob && routeCoords.length >= 2)}
              useTruckIconForCollector={true}
              onSelectRequest={(req) => setSelectedReq(req)}
              className="h-full min-h-[440px] lg:min-h-[580px] w-full rounded-2xl overflow-hidden"
            />
          </div>

          {/* Right Column: Blinkit Customer, Live Navigation, & Dynamic Requests List */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            
            {/* 1. Active Route Driving Controls & Customer Quick Actions (When Active Job is Selected) */}
            {isActiveJob && selectedReq && (
              <div className="bg-gradient-to-br from-[#E6F4EA] via-white to-emerald-50 rounded-3xl p-4 border-2 border-[#136B3B] shadow-xs space-y-3">
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

                {/* Customer Contact Strip */}
                <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-2xl border border-emerald-100 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#136B3B] border border-emerald-200 flex items-center justify-center text-sm font-black shrink-0">
                      {((resolveHouseholdName(selectedReq.household?.full_name || selectedReq.contact_name) || selectedReq.household?.full_name || selectedReq.contact_name || 'C').charAt(0)).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-xs text-[#191C1E] truncate">
                        {resolveHouseholdName(selectedReq.household?.full_name || selectedReq.contact_name) || selectedReq.household?.full_name || selectedReq.contact_name || 'Resident Citizen'}
                      </p>
                      <p className="text-[11px] text-[#526056] truncate">
                        {selectedReq.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${(selectedReq.household?.phone || selectedReq.contact_phone || '+919820154321').replace(/\s+/g, '')}`}
                      className="px-2.5 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="Call Customer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${(selectedReq.household?.phone || selectedReq.contact_phone || '+919820154321').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${resolveHouseholdName(selectedReq.household?.full_name || selectedReq.contact_name) || 'Customer'}, I am your ScrapMax collector arriving for your scrap pickup.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="WhatsApp Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <Link
                      href={`/collector/chat/${selectedReq.id}`}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                      title="In-App Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </Link>
                  </div>
                </div>

                {/* Real Navigation & Trip Lifecycle Actions */}
                <div className="space-y-2">
                  {/* 1. Turn-by-Turn GPS Navigation via Google Maps */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedReq.latitude},${selectedReq.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#136B3B] hover:bg-[#0F5730] text-white transition shadow-sm touch-feedback"
                  >
                    <Navigation className="w-4 h-4 fill-white" />
                    <span>Start Turn-by-Turn Navigation (Google Maps)</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-85" />
                  </a>

                  {/* 2. Lifecycle Status Buttons: Start Trip / Mark Arrived / Verify OTP */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedReq.status === 'accepted' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(selectedReq.id, 'in_progress')}
                        className="col-span-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#136B3B] hover:from-emerald-700 hover:to-[#0F5730] text-white text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-xs touch-feedback"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Start Trip (I&apos;m On The Way)</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleMarkArrived}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs touch-feedback ${
                            trackingState?.hasArrived
                              ? 'bg-emerald-100 text-[#136B3B] border-emerald-300 font-extrabold'
                              : 'bg-white hover:bg-emerald-50 text-[#136B3B] border-[#A6D5B8]'
                          }`}
                        >
                          <span>{trackingState?.hasArrived ? '✅ Arrived at Doorstep' : '🚪 Mark Arrived'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowHandoverModal(true)}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#136B3B] to-emerald-700 hover:from-[#0F5730] hover:to-emerald-800 text-white text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow-xs touch-feedback"
                        >
                          <span>🔐 Verify OTP &amp; Settle</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* 3. Live Device GPS Status */}
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-gray-200 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isWatchingGps ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
                      <div className="min-w-0 truncate">
                        <p className="font-extrabold text-[11px] text-[#191C1E]">
                          {isWatchingGps ? 'Live GPS Location Streaming' : 'Live GPS Standby'}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {isWatchingGps ? 'Device GPS transmitting coordinates to customer' : 'Tap to sync your real-time location'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleGpsWatch}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 text-[#136B3B] rounded-lg text-[10.5px] font-bold transition border border-gray-200 shrink-0"
                    >
                      {isWatchingGps ? 'GPS Active' : 'Sync GPS'}
                    </button>
                  </div>

                  {/* 4. Doorstep Safety OTP Card */}
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

            {/* 2. Deal Completed Settlement Banner if selected request is completed */}
            {selectedReq && selectedReq.status === 'completed' && (
              <div className="bg-gradient-to-br from-[#E6F4EA] to-white rounded-2xl p-4 border border-[#136B3B] shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#136B3B] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs text-[#136B3B] truncate">
                      Pickup Completed &amp; Settled
                    </p>
                    <p className="text-[11px] text-[#526056] truncate">
                      Total Paid: ₹{selectedReq.payment?.totalAmount || 380} via {selectedReq.payment?.method?.toUpperCase() || 'UPI'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </button>
              </div>
            )}

            {/* 3. Section Header for Filtered Pickups List */}
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-[#191C1E] uppercase tracking-wider">
                  {statusFilter === 'all'
                    ? 'All Pickup Requests'
                    : statusFilter === 'pending'
                    ? 'Pending Available Requests'
                    : 'Active Assigned Pickups'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8]">
                  {displayedRequests.length}
                </span>
              </div>
              <span className="text-[11px] text-[#6B7280]">
                {displayedRequests.length > 0 ? 'Click card or pin to select' : ''}
              </span>
            </div>

            {/* 4. Dynamic List of Request Cards or Empty State */}
            {displayedRequests.length > 0 ? (
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-240px)] pr-1.5 pb-8">
                {displayedRequests.map((req) => {
                  const isSelected = selectedReq?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      id={`pickup-card-${req.id}`}
                      onClick={() => setSelectedReq(req)}
                      className={`transition-all rounded-2xl cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-[#136B3B] shadow-md bg-emerald-50/15'
                          : 'hover:shadow-xs hover:border-gray-300'
                      }`}
                    >
                      <RequestCard
                        request={req}
                        userRole="collector"
                        collectorDistanceKm={
                          collectorPos
                            ? Number((calculateDistanceMeters(collectorPos[0], collectorPos[1], req.latitude, req.longitude) / 1000).toFixed(1))
                            : undefined
                        }
                        onStatusUpdate={handleStatusUpdate}
                        onCompletePayment={handleCompletePayment}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-10 text-center bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#136B3B] border border-emerald-200 flex items-center justify-center mx-auto text-2xl font-black">
                  {statusFilter === 'active' ? '🚚' : '📋'}
                </div>
                <div>
                  <h4 className="font-extrabold text-[#191C1E] text-base">
                    {statusFilter === 'active'
                      ? 'No active pickups currently'
                      : statusFilter === 'pending'
                      ? 'No pending pickups available'
                      : 'No pickups found'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    {statusFilter === 'active'
                      ? 'You have no pickups accepted or in progress. Switch to the Pending tab to review nearby requests and start navigation.'
                      : 'All pickup requests matching this filter have been processed.'}
                  </p>
                </div>
                {statusFilter === 'active' && pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <span>View Pending Requests ({pendingCount})</span>
                  </button>
                )}
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
