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
      full_name: 'Aarav Sharma (Flat 402, Green Heights)',
      phone: '+91 98201 54321',
      role: 'household',
    },
    status: 'pending',
    address: 'Flat 402, Green Heights, Main Market Road, City Center',
    latitude: 19.0760,
    longitude: 72.8777,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Paper & plastic recyclables ready at society gate. Ring bell twice upon arrival.',
    total_estimated_weight_kg: 18.5,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
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
    address: 'Tower B, Station Road West, Commercial Tech Park, Andheri East',
    latitude: 19.1136,
    longitude: 72.8697,
    scheduled_date: 'Today · 6:00 PM',
    notes: 'Electronic waste, wiring, and computer scrap. Please call before arriving.',
    total_estimated_weight_kg: 35.0,
    photos: [
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'E_WASTE', approx_weight_kg: 35.0 }],
  },
  {
    id: 'req-map-003',
    household_id: 'user-h103',
    household: {
      id: 'user-h103',
      full_name: 'Vikram Mehta (Gala 14)',
      phone: '+91 98112 34567',
      role: 'household',
    },
    status: 'pending',
    address: 'Ring Road Link, Industrial Estate, Gala No 14, Kurla West',
    latitude: 19.0685,
    longitude: 72.8842,
    scheduled_date: 'Today · 6:30 PM',
    notes: 'Heavy scrap metal, iron pieces, and packaging boxes.',
    total_estimated_weight_kg: 22.0,
    photos: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
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
    address: 'Green Park Colony, Sector 4, Behind Central Bank, Bandra West',
    latitude: 19.0596,
    longitude: 72.8295,
    scheduled_date: 'Today · 7:00 PM',
    notes: 'Sorted plastic bottles and cardboard packaging.',
    total_estimated_weight_kg: 14.2,
    photos: [
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PLASTIC', approx_weight_kg: 14.2 }],
  },
  {
    id: 'req-map-005',
    household_id: 'user-h105',
    household: {
      id: 'user-h105',
      full_name: 'Ananya Deshmukh (Flat 801)',
      phone: '+91 98205 67890',
      role: 'household',
    },
    status: 'pending',
    address: 'Sunview Heights, 10th Road, JVPD Scheme, Juhu',
    latitude: 19.1075,
    longitude: 72.8263,
    scheduled_date: 'Tomorrow · 10:00 AM',
    notes: 'Glass bottles and newspaper bundles ready on balcony.',
    total_estimated_weight_kg: 26.0,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'GLASS', approx_weight_kg: 12.0 },
      { category: 'PAPER', approx_weight_kg: 14.0 },
    ],
  },
  {
    id: 'req-map-006',
    household_id: 'user-h106',
    household: {
      id: 'user-h106',
      full_name: 'Rajesh Kulkarni (Tower 12B)',
      phone: '+91 98701 23456',
      role: 'household',
    },
    status: 'pending',
    address: 'Cliff Tower 12B, Central Avenue, Hiranandani Gardens, Powai',
    latitude: 19.1197,
    longitude: 72.9051,
    scheduled_date: 'Tomorrow · 11:30 AM',
    notes: 'Old CPU cabinets, aluminium frames, and copper wires.',
    total_estimated_weight_kg: 41.5,
    photos: [
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'E_WASTE', approx_weight_kg: 21.5 },
      { category: 'METAL', approx_weight_kg: 20.0 },
    ],
  },
  {
    id: 'req-map-007',
    household_id: 'user-h107',
    household: {
      id: 'user-h107',
      full_name: 'Kavita Nair (House 19)',
      phone: '+91 98198 76543',
      role: 'household',
    },
    status: 'pending',
    address: 'Shivaji Park View, Cadell Road, Dadar West',
    latitude: 19.0282,
    longitude: 72.8384,
    scheduled_date: 'Tomorrow · 2:00 PM',
    notes: 'Old school notebooks and magazines tied in rope.',
    total_estimated_weight_kg: 16.0,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PAPER', approx_weight_kg: 16.0 }],
  },
  {
    id: 'req-map-008',
    household_id: 'user-h108',
    household: {
      id: 'user-h108',
      full_name: 'Mohit Agarwal (Flat 302)',
      phone: '+91 98212 34987',
      role: 'household',
    },
    status: 'pending',
    address: 'Diamond Garden Society, 2nd Main Road, Chembur East',
    latitude: 19.0522,
    longitude: 72.8994,
    scheduled_date: 'Tomorrow · 3:30 PM',
    notes: 'Stainless steel utensils and crushed plastic bottles.',
    total_estimated_weight_kg: 29.0,
    photos: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'METAL', approx_weight_kg: 15.0 },
      { category: 'PLASTIC', approx_weight_kg: 14.0 },
    ],
  },
  {
    id: 'req-map-009',
    household_id: 'user-h109',
    household: {
      id: 'user-h109',
      full_name: 'Sunil Joshi (Wing C)',
      phone: '+91 98331 45678',
      role: 'household',
    },
    status: 'pending',
    address: 'Neelkanth Valley, Building 4, Ghatkopar East',
    latitude: 19.0864,
    longitude: 72.9082,
    scheduled_date: 'Tomorrow · 4:30 PM',
    notes: 'Large cardboard appliance packaging boxes and plastic containers.',
    total_estimated_weight_kg: 19.5,
    photos: [
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 270).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PAPER', approx_weight_kg: 19.5 }],
  },
  {
    id: 'req-map-010',
    household_id: 'user-h110',
    household: {
      id: 'user-h110',
      full_name: 'Farhan Shaikh (Silver Arch)',
      phone: '+91 98200 87654',
      role: 'household',
    },
    status: 'pending',
    address: 'Silver Arch, Lokhandwala Complex, Andheri West',
    latitude: 19.1392,
    longitude: 72.8265,
    scheduled_date: 'Tomorrow · 5:00 PM',
    notes: 'Old microwave, broken toaster, and brass fittings.',
    total_estimated_weight_kg: 24.0,
    photos: [
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      { category: 'E_WASTE', approx_weight_kg: 14.0 },
      { category: 'METAL', approx_weight_kg: 10.0 },
    ],
  },
  {
    id: 'req-map-011',
    household_id: 'user-h111',
    household: {
      id: 'user-h111',
      full_name: 'Meera Sen (Sea Face Enclave)',
      phone: '+91 98190 11223',
      role: 'household',
    },
    status: 'pending',
    address: 'Sea Face Enclave, Dr. Annie Besant Road, Worli',
    latitude: 19.0125,
    longitude: 72.8182,
    scheduled_date: 'Tomorrow · 6:00 PM',
    notes: 'Corrugated cartons and newspapers packed in sacks.',
    total_estimated_weight_kg: 15.0,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 330).toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PAPER', approx_weight_kg: 15.0 }],
  },
  {
    id: 'req-map-012',
    household_id: 'user-h112',
    household: {
      id: 'user-h112',
      full_name: 'Deepak Chawla (Panchsheel Heights)',
      phone: '+91 98209 99887',
      role: 'household',
    },
    status: 'completed',
    address: 'Panchsheel Heights, New Link Road, Malad West',
    latitude: 19.1865,
    longitude: 72.8481,
    scheduled_date: 'Yesterday · 4:00 PM',
    notes: 'Completed scrap pickup. Verified weight & instant UPI payment settled.',
    total_estimated_weight_kg: 21.0,
    payment: {
      transactionId: 'TXN-882194',
      method: 'upi',
      totalAmount: 380,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      items: [
        { category: 'PAPER', verifiedWeightKg: 11.0, ratePerKg: 14, subtotal: 154 },
        { category: 'PLASTIC', verifiedWeightKg: 10.0, ratePerKg: 22, subtotal: 226 },
      ],
      paidBy: 'Ramesh Kumar (Verified Kabadiwala)',
      receivedBy: 'Deepak Chawla',
    },
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    waste_items: [
      { category: 'PAPER', approx_weight_kg: 11.0 },
      { category: 'PLASTIC', approx_weight_kg: 10.0 },
    ],
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active'>('all');
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

      // 2. Query Supabase joining customer profile
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*), household:profiles!household_id(id, full_name, phone, role)')
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false });

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

      // Deduplicate by ID
      const unique = Array.from(
        new Map(combinedRequests.map((item) => [item.id, item])).values()
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
      const startCollectorPos: [number, number] =
        collectorPos || savedCollectorLoc.pos || [householdPos[0] + 0.012, householdPos[1] - 0.014];

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
        setIsSimulating(isSimulationRunning(selectedReq!.id));
      }
    }

    initRoute();

    // Subscribe to live tracking updates (from multi-tab / real GPS)
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
                  </div>
                </div>

                {/* Simulation Controls & Doorstep Actions */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleToggleSimulation}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm touch-feedback ${
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

                  {/* Doorstep Safety OTP reminder */}
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
