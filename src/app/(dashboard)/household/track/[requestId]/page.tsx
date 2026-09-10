'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/common/Navbar';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest, ChatMessage, STATUS_LABELS, WASTE_CATEGORY_LABELS } from '@/types';
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
  IndianRupee,
} from 'lucide-react';
import Link from 'next/link';

// Lazy-load map to avoid SSR issues
const MapContainer = dynamic(() => import('@/components/map/MapContainer'), { ssr: false });

// ─── Demo data fallback ───────────────────────────────────────────────────────
const DEMO_REQUEST: PickupRequest = {
  id: 'demo-track-001',
  household_id: 'user-h101',
  collector_id: 'collector-c201',
  status: 'accepted',
  address: 'Indiranagar 100ft Road, Bangalore, Karnataka',
  latitude: 12.9784,
  longitude: 77.6408,
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
  { status: 'completed', label: 'Completed & paid', icon: IndianRupee, desc: 'Pickup done and payment settled' },
];

const STATUS_ORDER = ['pending', 'accepted', 'in_progress', 'completed'];

export default function TrackPickupPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) ?? 'demo';

  const [activeTab, setActiveTab] = useState<'track' | 'chat'>('track');
  const [request, setRequest] = useState<PickupRequest>(DEMO_REQUEST);
  const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentUserId] = useState('user-h101');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load request from Supabase
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: req } = await supabase
        .from('pickup_requests')
        .select('*, waste_items(*)')
        .eq('id', requestId)
        .single();
      if (req) setRequest(req as PickupRequest);

      // Init chat
      let { data: chat } = await supabase
        .from('chats')
        .select('*')
        .eq('request_id', requestId)
        .single();
      if (!chat && req) {
        const { data: newChat } = await supabase
          .from('chats')
          .insert({ request_id: requestId, household_id: req.household_id, collector_id: req.collector_id || 'demo' })
          .select('*')
          .single();
        chat = newChat;
      }
      if (chat) {
        setChatId(chat.id);
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });
        if (msgs && msgs.length > 0) setMessages(msgs as ChatMessage[]);
      }
    }
    if (requestId !== 'demo') load();
  }, [requestId]);

  // Realtime chat subscription
  useEffect(() => {
    if (!chatId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    const optimistic: ChatMessage = {
      id: String(Date.now()),
      chat_id: chatId || 'demo',
      sender_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    if (chatId) {
      const supabase = createClient();
      await supabase.from('messages').insert({ chat_id: chatId, sender_id: currentUserId, text });
    }
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
        {/* Pay button if accepted/in-progress */}
        {(request.status === 'accepted' || request.status === 'in_progress') && (
          <Link href={`/household/payment/${requestId}`} className="flex items-center gap-1 px-3 py-1.5 bg-[#136B3B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0F5730] transition flex-shrink-0">
            <IndianRupee className="w-3.5 h-3.5" />
            Pay
          </Link>
        )}
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
            {/* Map */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-56 sm:h-72">
              <MapContainer
                center={[request.latitude || 12.9716, request.longitude || 77.5946]}
                zoom={14}
                requests={[request]}
                className="h-full w-full"
              />
            </div>

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
                href={`tel:+919876543210`}
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
              <div className="w-10 h-10 rounded-full bg-[#EAF5EE] flex items-center justify-center text-xl flex-shrink-0 font-bold text-[#136B3B]">R</div>
              <div>
                <p className="text-sm font-bold text-[#191C1E]">Raju Kabadiwala</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-xs text-[#526056]">Active collector · On the way</p>
                </div>
              </div>
              <a href="tel:+919876543210" className="ml-auto w-9 h-9 rounded-full bg-[#EAF5EE] flex items-center justify-center text-[#136B3B] hover:bg-[#D4EBD9] transition flex-shrink-0">
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

      </main>
    </div>
  );
}