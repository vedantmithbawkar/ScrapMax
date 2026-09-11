'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/common/Navbar';
import ReceiptModal from '@/components/request/ReceiptModal';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest, ChatMessage, STATUS_LABELS, WASTE_CATEGORY_LABELS } from '@/types';
import { getChatMessages, subscribeToChat, sendChatMessage } from '@/lib/chat-service';
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Send,
  Phone,
  ShieldCheck,
  Star,
  Receipt,
  Bell,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import {
  initializeTrackingState,
  subscribeToTracking,
  formatDistance,
  getPickupOtp,
  acceptPickupInTracking,
  LiveTrackingState,
} from '@/lib/tracking-service';

// Lazy-load map to avoid SSR issues
const MapContainer = dynamic(() => import('@/components/map/MapContainer'), { ssr: false });

// ─── Demo data fallback ───────────────────────────────────────────────────────
const DEMO_REQUEST: PickupRequest = {
  id: 'demo-track-001',
  household_id: 'user-h101',
  collector_id: 'collector-c201',
  collector: {
    id: 'collector-c201',
    full_name: 'Verified Scrap Collector',
    phone: '+91 98201 45892',
    role: 'collector',
    rating: 4.9,
    completed_pickups: 126,
  },
  status: 'accepted',
  address: 'Main Market Road, Near City Center',
  latitude: 19.0760,
  longitude: 72.8777,
  scheduled_date: 'Today · 5:30 PM',
  notes: 'Please call before arriving. Cardboard boxes packed neat.',
  total_estimated_weight_kg: 13.2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  waste_items: [
    { category: 'PAPER', approx_weight_kg: 8.5 },
    { category: 'PLASTIC', approx_weight_kg: 3.2 },
    { category: 'METAL', approx_weight_kg: 1.5 },
  ],
};

const DEMO_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    chat_id: 'chat-demo',
    sender_id: 'collector-c201',
    text: 'Hello! I have accepted your pickup request. I will be there by 5:30 PM.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    chat_id: 'chat-demo',
    sender_id: 'user-h101',
    text: 'Great! The recyclables are packed and ready near the gate.',
    created_at: new Date(Date.now() - 3000000).toISOString(),
  },
  {
    id: 'msg-3',
    chat_id: 'chat-demo',
    sender_id: 'collector-c201',
    text: 'Perfect. I am about 15 minutes away. See you soon! 🚛',
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
];

// ─── Timeline steps ───────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { status: 'pending', label: 'Request placed', icon: Package, desc: 'Looking for a collector nearby' },
  { status: 'accepted', label: 'Collector assigned', icon: CheckCircle2, desc: 'Collector is on the way' },
  { status: 'in_progress', label: 'Pickup in progress', icon: Truck, desc: 'Collector arrived at your location' },
  { status: 'completed', label: 'Completed & paid', icon: CheckCircle2, desc: 'Pickup done — payment received from collector' },
];

const STATUS_ORDER = ['pending', 'accepted', 'in_progress', 'completed'];

export default function TrackPickupPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) ?? 'demo';

  const [activeTab, setActiveTab] = useState<'track' | 'chat'>('track');
  const [request, setRequest] = useState<PickupRequest>(DEMO_REQUEST);
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages(requestId));
  const [inputText, setInputText] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentUserId] = useState('user-h101');
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat sync across tabs & portals
  useEffect(() => {
    setMessages(getChatMessages(requestId));
    const unsubscribe = subscribeToChat(requestId, (updatedMsgs) => {
      setMessages(updatedMsgs);
    });
    return () => unsubscribe();
  }, [requestId]);

  // Load request from Supabase or localStorage fallback
  useEffect(() => {
    async function load() {
      // Check localStorage first for demo / local session
      try {
        const localList = JSON.parse(localStorage.getItem('local_pickup_requests') || '[]');
        const localMatch = localList.find((r: any) => r.id === requestId);
        if (localMatch) {
          if (!localMatch.collector) {
            localMatch.collector = {
              id: localMatch.collector_id || 'collector-c201',
              full_name: 'Verified Scrap Collector',
              phone: '+91 98201 45892',
              role: 'collector',
              rating: 4.9,
              completed_pickups: 126,
            };
          }
          setRequest(localMatch);
        }
      } catch {}

      const supabase = createClient();
      const { data: req } = await supabase
        .from('pickup_requests')
        .select('*, waste_items(*)')
        .eq('id', requestId)
        .single();
      if (req) {
        if (!req.collector && req.collector_id) {
          const { data: colProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.collector_id)
            .maybeSingle();
          if (colProfile) {
            req.collector = colProfile;
          } else {
            req.collector = {
              id: req.collector_id,
              full_name: 'Verified Scrap Collector',
              phone: '+91 98201 45892',
              role: 'collector',
              rating: 4.9,
              completed_pickups: 126,
            };
          }
        }
        setRequest(req as PickupRequest);
      }
    }
    if (requestId !== 'demo') load();
  }, [requestId]);

  const [trackingState, setTrackingState] = useState<LiveTrackingState | null>(null);

  // Initialize and subscribe to live tracking across tabs
  useEffect(() => {
    let isMounted = true;

    async function init() {
      const lat = request.latitude || 19.076;
      const lng = request.longitude || 72.8777;

      const state = await initializeTrackingState({
        requestId,
        householdPos: [lat, lng],
        householdName: request.household?.full_name || 'Household Customer',
        householdPhone: request.household?.phone || '+91 98201 54321',
        householdAddress: request.address,
        collectorName: request.collector?.full_name,
        collectorPhone: request.collector?.phone,
      });

      if (isMounted) {
        setTrackingState(state);
      }
    }

    init();

    const unsubscribe = subscribeToTracking(requestId, (state) => {
      if (isMounted) {
        setTrackingState(state);
        // If collector accepted in another tab
        if ((state.status === 'accepted' || state.status === 'in_progress') && request.status === 'pending') {
          setRequest((prev) => ({
            ...prev,
            status: state.status,
            collector: {
              id: 'collector-c201',
              full_name: state.collectorName || request.collector?.full_name || 'Verified Scrap Collector',
              phone: state.collectorPhone || request.collector?.phone || '+91 98201 45892',
              role: 'collector',
              rating: 4.9,
              completed_pickups: 126,
            },
          }));
        } else if (state.status === 'completed') {
          setRequest((prev) => ({
            ...prev,
            status: 'completed',
            payment: state.payment || prev.payment,
          }));
        } else if (state.status === 'in_progress' && request.status === 'accepted') {
          setRequest((prev) => ({ ...prev, status: 'in_progress' }));
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [requestId, request.latitude, request.longitude, request.address, request.collector?.full_name, request.status]);

  const pickupOtp = getPickupOtp(requestId);

  const handleSimulateAccept = () => {
    const updated = acceptPickupInTracking(requestId, {
      full_name: request.collector?.full_name || 'Verified Scrap Collector',
      phone: request.collector?.phone || '+91 98201 45892',
    });
    if (updated) {
      setTrackingState(updated);
      setRequest((prev) => ({
        ...prev,
        status: 'accepted',
        collector: {
          id: 'collector-c201',
          full_name: updated.collectorName,
          phone: updated.collectorPhone,
          role: 'collector',
          rating: 4.9,
          completed_pickups: 126,
        },
      }));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    await sendChatMessage(requestId, currentUserId, text, 'household');
  };

  const currentStatusIdx = STATUS_ORDER.indexOf(request.status);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-6">
      <Navbar />

      {/* Sticky header */}
      <header className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 py-3.5 max-w-2xl mx-auto w-full flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Go back" className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition" type="button">
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-[#191C1E] truncate">
            {request.status === 'pending' ? 'Finding Collector…' :
             request.status === 'accepted' ? 'Collector On the Way' :
             request.status === 'in_progress' ? 'Pickup In Progress' : 'Pickup Complete'}
          </h1>
          <p className="text-[11px] text-[#6B7280]">Req #{requestId.slice(0, 8)}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-4 flex flex-col flex-1 space-y-4">

        {/* Status badge */}
        <div className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_LABELS[request.status].badgeColor}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {STATUS_LABELS[request.status].label}
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {[
            { id: 'track' as const, label: 'Track Pickup', icon: <Navigation className="w-4 h-4" /> },
            { id: 'chat' as const, label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
                activeTab === tab.id ? 'bg-white text-[#191C1E] shadow-sm' : 'text-[#6B7280] hover:text-[#191C1E]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {/* Unread badge on chat tab */}
              {tab.id === 'chat' && activeTab !== 'chat' && messages.length > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#136B3B] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── TRACK TAB ── */}
        {activeTab === 'track' && (
          <div className="space-y-4">

            {/* 1. WAITING FOR COLLECTOR STATE (When Pending) */}
            {request.status === 'pending' && (
              <div className="bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-sm space-y-4 text-center relative overflow-hidden">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-75" />
                  <span className="absolute inset-2 rounded-full bg-emerald-200 animate-pulse opacity-50" />
                  <div className="relative w-14 h-14 rounded-2xl bg-[#136B3B] text-white flex items-center justify-center shadow-md text-2xl">
                    📡
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Searching for Nearby Collectors...</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#191C1E]">
                    Waiting for a Collector to Accept
                  </h3>
                  <p className="text-xs text-[#526056] max-w-sm mx-auto leading-relaxed">
                    Your scrap pickup request has been broadcasted to verified collectors in your locality. Once accepted, their name, contact phone, live map route, and distance will appear here instantly.
                  </p>
                </div>

                {/* Instant Simulation / Demo Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateAccept}
                    className="py-3 px-5 rounded-2xl bg-[#136B3B] hover:bg-[#0F5730] text-white font-extrabold text-xs sm:text-sm transition flex items-center justify-center gap-2 mx-auto shadow-sm touch-feedback"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Simulate Collector Accepting (Demo Test)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. LIVE DOORSTEP DELIVERY TRACKING BANNER (When Accepted/In-Progress) */}
            {request.status !== 'pending' && (
              <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 shadow-xs ${
                        request.status === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : trackingState?.hasArrived
                          ? 'bg-emerald-500 text-white animate-bounce'
                          : trackingState?.isNearDoorstep
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-[#136B3B] text-white'
                      }`}
                    >
                      {request.status === 'completed' ? '🎉' : trackingState?.hasArrived ? '🚪' : '🚚'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#136B3B]">
                          {request.status === 'completed'
                            ? 'Pickup Completed'
                            : trackingState?.hasArrived
                            ? 'Arrived at Doorstep'
                            : trackingState?.isNearDoorstep
                            ? 'Arriving at Your Door'
                            : 'Collector En Route'}
                        </span>
                        {request.status !== 'completed' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-[#191C1E] mt-0.5">
                        {request.status === 'completed'
                          ? 'Deal Done & Payment Credited!'
                          : trackingState?.hasArrived
                          ? 'Collector is at your doorstep!'
                          : trackingState?.isNearDoorstep
                          ? 'Near your doorstep (< 1 min away)!'
                          : `Arriving in ~${trackingState?.etaMinutes || 5} mins`}
                      </h2>
                      <p className="text-xs text-[#526056] mt-0.5">
                        {request.status === 'completed'
                          ? `₹${request.payment?.totalAmount || Math.round((request.total_estimated_weight_kg || 5) * 18)} received via ${request.payment?.method?.toUpperCase() || 'UPI'}.`
                          : trackingState?.hasArrived
                          ? 'Please open the door with your scrap ready for honest weighing.'
                          : `${formatDistance(trackingState?.distanceMeters || 1400)} away from your home.`}
                      </p>
                    </div>
                  </div>

                  {/* Top Status Pill */}
                  <div className="bg-[#E6F4EA] border border-[#A6D5B8] px-3 py-1.5 rounded-2xl text-center shrink-0">
                    <p className="text-[10px] font-bold text-[#526056] uppercase tracking-wider">Distance</p>
                    <p className="text-sm font-black text-[#136B3B]">
                      {request.status === 'completed'
                        ? 'Done'
                        : trackingState?.hasArrived
                        ? '0 m'
                        : formatDistance(trackingState?.distanceMeters || 1400)}
                    </p>
                  </div>
                </div>

                {/* Animated Delivery Journey Progress Bar */}
                <div className="pt-2">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-[#136B3B] to-emerald-600 rounded-full transition-all duration-700"
                      style={{
                        width:
                          request.status === 'completed'
                            ? '100%'
                            : trackingState?.hasArrived
                            ? '95%'
                            : trackingState?.isNearDoorstep
                            ? '75%'
                            : '45%',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1.5 px-0.5">
                    <span className="text-[#136B3B]">Assigned</span>
                    <span className={trackingState?.distanceMeters ? 'text-[#136B3B]' : ''}>On The Way</span>
                    <span className={trackingState?.isNearDoorstep || trackingState?.hasArrived ? 'text-[#136B3B]' : ''}>Near Doorstep</span>
                    <span className={request.status === 'completed' ? 'text-[#136B3B]' : ''}>Paid</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PROMINENT DOORSTEP HANDOVER OTP CARD */}
            {request.status !== 'pending' && request.status !== 'completed' && (
              <div className="bg-gradient-to-r from-[#136B3B] to-emerald-700 text-white rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔐</span>
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-emerald-100">
                        Doorstep Handover OTP
                      </h4>
                      <p className="text-[11px] text-emerald-200">
                        Share this 4-digit code with collector when they arrive
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full text-white border border-white/30">
                    Security PIN
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 pt-1">
                  {pickupOtp.split('').map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-14 bg-white text-[#136B3B] font-black font-mono text-2xl rounded-2xl flex items-center justify-center shadow-md border-2 border-white/50"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. NEAR DOORSTEP PROXIMITY ALERT BOX */}
            {request.status !== 'completed' && (trackingState?.isNearDoorstep || trackingState?.hasArrived) && (
              <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">🔔</span>
                  <div>
                    <h4 className="text-sm font-black text-amber-950">
                      {trackingState?.hasArrived ? 'Collector is right outside your door!' : 'Collector is near your doorstep!'}
                    </h4>
                    <p className="text-xs text-amber-900 mt-0.5">
                      {request.collector?.full_name || 'Assigned Collector'} has reached your location. Please keep recyclables handy.
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${(request.collector?.phone || '+919820145892').replace(/\s+/g, '')}`}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition shadow-xs"
                >
                  Call
                </a>
              </div>
            )}

            {/* 5. INTERACTIVE MAP */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-64 sm:h-80 relative">
              <MapContainer
                center={[request.latitude || 19.076, request.longitude || 72.8777]}
                zoom={14}
                requests={[request]}
                collectorPos={request.status !== 'pending' ? trackingState?.collectorPos : null}
                originPos={request.status !== 'pending' ? trackingState?.collectorOriginPos : undefined}
                originLabel={trackingState?.collectorOriginAddress || 'Collector Starting Hub'}
                routeCoordinates={request.status !== 'pending' ? (trackingState?.routeCoordinates || []) : []}
                destinationPos={[request.latitude || 19.076, request.longitude || 72.8777]}
                destinationLabel="Your Doorstep"
                fitBoundsToRoute={request.status !== 'pending'}
                useTruckIconForCollector={true}
                className="h-full w-full"
              />
            </div>

            {/* Collector Dispatch Origin Information */}
            {request.status !== 'pending' && (trackingState?.collectorOriginAddress || trackingState?.collectorOriginPos) && (
              <div className="flex items-center gap-2.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <span className="text-base">🏢</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900">
                      Dispatched From Operating Hub
                    </p>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Origin Point
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                    {trackingState?.collectorOriginAddress || 'Local Regional Collector Hub'}
                  </p>
                  <p className="text-[11px] text-indigo-700/80 font-medium">
                    Route started towards your doorstep from this hub
                  </p>
                </div>
              </div>
            )}

            {/* Address */}
            <div className="flex items-center gap-2.5 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#EAF5EE] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#136B3B]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#526056]">Pickup address</p>
                <p className="text-sm font-semibold text-[#191C1E] truncate">{request.address}</p>
              </div>
            </div>

            {/* Assigned Collector Details Card (When Assigned) */}
            {request.status !== 'pending' && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#136B3B]/25 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Assigned Collector</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{request.collector?.rating || 4.9}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#526056] font-semibold">
                    {request.collector?.completed_pickups || 126} pickups completed
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-2xl bg-[#E6F4EA] border border-[#A6D5B8] flex items-center justify-center text-xl font-black text-[#136B3B] shrink-0 shadow-2xs">
                      {(request.collector?.full_name || 'Collector').charAt(0)}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-[#191C1E] truncate">
                        {request.collector?.full_name || 'Verified Scrap Collector'}
                      </h3>
                      <p className="text-xs font-mono font-bold text-[#136B3B] mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#136B3B]" />
                        <span>{request.collector?.phone || '+91 98201 45892'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${(request.collector?.phone || '+919820145892').replace(/\s+/g, '')}`}
                      className="px-3.5 py-2 rounded-xl bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs touch-feedback"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="px-3.5 py-2 rounded-xl bg-[#F4FAF6] hover:bg-[#E6F4EA] text-[#136B3B] border border-[#A6D5B8] text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-1">
              <h2 className="text-sm font-bold text-[#191C1E] mb-4">Pickup progress</h2>
              <div className="space-y-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStatusIdx;
                  const isCurrent = idx === currentStatusIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex gap-4">
                      {/* Icon + connector */}
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone ? 'bg-[#136B3B]' : 'bg-gray-100'
                        } ${isCurrent ? 'ring-2 ring-[#136B3B] ring-offset-2' : ''}`}>
                          <Icon className={`w-4 h-4 ${isDone ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 my-1 min-h-[24px] ${idx < currentStatusIdx ? 'bg-[#136B3B]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      {/* Text */}
                      <div className="pb-5 pt-1.5 min-w-0">
                        <p className={`text-sm font-bold leading-tight ${isDone ? 'text-[#191C1E]' : 'text-gray-400'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-2 inline-block text-[10px] font-bold px-2 py-0.5 bg-[#EAF5EE] text-[#136B3B] rounded-full">Now</span>}
                        </p>
                        <p className={`text-xs mt-0.5 ${isDone ? 'text-[#526056]' : 'text-gray-300'}`}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waste items summary */}
            {request.waste_items && request.waste_items.length > 0 && (
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-[#191C1E]">Items in this pickup</h2>
                <div className="space-y-2">
                  {request.waste_items.map((item, idx) => {
                    const meta = WASTE_CATEGORY_LABELS[item.category];
                    return (
                      <div key={idx} className="flex items-center gap-2.5">
                        <span className="text-lg">{meta.icon}</span>
                        <span className="text-sm font-semibold text-[#191C1E]">{meta.label.split('&')[0].trim()}</span>
                        <span className="ml-auto text-xs font-bold text-[#136B3B]">{item.approx_weight_kg} kg</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between">
                  <span className="text-xs font-bold text-[#526056]">Total weight</span>
                  <span className="text-sm font-extrabold text-[#191C1E]">{request.total_estimated_weight_kg} kg</span>
                </div>
              </div>
            )}

            {/* Deal Completed & Official Digital Receipt Card */}
            {request.status === 'completed' && (
              <div className="bg-gradient-to-br from-[#E6F4EA] via-white to-emerald-50 rounded-3xl p-5 border-2 border-[#136B3B] shadow-sm space-y-3 animate-in fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#136B3B] text-white flex items-center justify-center shadow-xs shrink-0">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-[#136B3B]">
                          Deal Done &amp; Payout Settled!
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#136B3B] text-white">
                          Official Receipt
                        </span>
                      </div>
                      <p className="text-xs text-[#526056] mt-0.5">
                        Total Payout Received: <strong className="text-[#191C1E] font-black text-sm">₹{request.payment?.totalAmount || Math.round((request.total_estimated_weight_kg || 5) * 18)}</strong> via <span className="uppercase font-bold text-[#136B3B]">{request.payment?.method || 'UPI'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full py-3.5 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-sm touch-feedback"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View &amp; Download Digital Recycling Receipt</span>
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-[#191C1E] hover:border-[#136B3B] hover:text-[#136B3B] transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Open Chat
              </button>
              <a
                href={`tel:${(request.collector?.phone || '+919820145892').replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-2 py-3.5 bg-[#EAF5EE] border border-[#A6D5B8] rounded-2xl text-sm font-bold text-[#136B3B] hover:bg-[#D4EBD9] transition shadow-sm"
              >
                <Phone className="w-4 h-4" />
                Call Collector
              </a>
            </div>
          </div>
        )}

        {/* ── CHAT TAB ── */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1" style={{ minHeight: '460px' }}>
            {/* Collector info strip */}
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm mb-3">
              <div className="w-10 h-10 rounded-full bg-[#EAF5EE] flex items-center justify-center text-xl flex-shrink-0 font-bold text-[#136B3B]">
                {(request.collector?.full_name || 'Collector').charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-[#191C1E]">
                  {request.collector?.full_name || 'Verified Scrap Collector'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-xs text-[#526056]">
                    {request.collector?.phone || '+91 98201 45892'} · On the way
                  </p>
                </div>
              </div>
              <a
                href={`tel:${(request.collector?.phone || '+919820145892').replace(/\s+/g, '')}`}
                className="ml-auto w-9 h-9 rounded-full bg-[#EAF5EE] flex items-center justify-center text-[#136B3B] hover:bg-[#D4EBD9] transition flex-shrink-0"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            {/* Chat bubble stream */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-[#F8FAF9]">
                <div className="w-2 h-2 rounded-full bg-[#136B3B] animate-pulse" />
                <span className="text-xs font-bold text-[#191C1E]">Live Coordination Chat</span>
                <span className="ml-auto text-[10px] text-[#6B7280] font-mono">#{requestId.slice(0, 8)}</span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F9FA]" style={{ maxHeight: '320px' }}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#6B7280] text-xs gap-2 py-8">
                    <span className="text-3xl">💬</span>
                    <p className="font-bold text-[#191C1E]">No messages yet</p>
                    <p>Say hi to your collector!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-[#136B3B] text-white rounded-br-sm shadow-xs'
                            : 'bg-white text-[#191C1E] rounded-bl-sm border border-gray-200 shadow-xs'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-[#6B7280] mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && ' ✓✓'}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="p-3.5 bg-white border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message collector…"
                  className="flex-1 px-4 py-2.5 bg-[#F7F9FA] border border-gray-200 rounded-full text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 bg-[#136B3B] hover:bg-[#0F5730] disabled:opacity-40 text-white font-bold rounded-full flex items-center justify-center transition shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Digital Recycling Receipt Modal */}
        {showReceiptModal && (
          <ReceiptModal
            request={request}
            onClose={() => setShowReceiptModal(false)}
          />
        )}

      </main>
    </div>
  );
}