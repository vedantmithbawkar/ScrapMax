'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest, ChatMessage, STATUS_LABELS, WASTE_CATEGORY_LABELS } from '@/types';
import { getChatMessages, subscribeToChat, sendChatMessage } from '@/lib/chat-service';
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  Navigation,
  Send,
  Phone,
  CheckCircle2,
  Truck,
  Package,
  IndianRupee,
  Weight,
} from 'lucide-react';

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), { ssr: false });

const DEFAULT_REQUEST: PickupRequest = {
  id: 'req-col-001',
  household_id: 'user-h101',
  collector_id: 'collector-c201',
  status: 'accepted',
  address: 'Main Market Road, Near City Center',
  latitude: 19.0760,
  longitude: 72.8777,
  scheduled_date: 'Today · 5:30 PM',
  notes: 'Items packed in bags in garage.',
  total_estimated_weight_kg: 13.2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  waste_items: [
    { category: 'PAPER', approx_weight_kg: 8.5 },
    { category: 'PLASTIC', approx_weight_kg: 3.2 },
    { category: 'METAL', approx_weight_kg: 1.5 },
  ],
};

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    chat_id: 'chat-req-001',
    sender_id: 'collector-c201',
    text: 'Hello! I have accepted your pickup. I\'ll be there by 5:30 PM.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    chat_id: 'chat-req-001',
    sender_id: 'user-h101',
    text: 'Great! The recyclables are packed near the gate.',
    created_at: new Date(Date.now() - 3000000).toISOString(),
  },
];

export default function CollectorChatPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) ?? 'req-col-001';

  const [activeTab, setActiveTab] = useState<'track' | 'chat'>('chat');
  const [request, setRequest] = useState<PickupRequest>(DEFAULT_REQUEST);
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages(requestId));
  const [inputText, setInputText] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [currentUserId] = useState('collector-c201');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat sync across tabs & portals
  useEffect(() => {
    setMessages(getChatMessages(requestId));
    const unsubscribe = subscribeToChat(requestId, (updatedMsgs) => {
      setMessages(updatedMsgs);
    });
    return () => unsubscribe();
  }, [requestId]);

  useEffect(() => {
    async function load() {
      // Check localStorage first
      try {
        const localList = JSON.parse(localStorage.getItem('local_pickup_requests') || '[]');
        const localMatch = localList.find((r: any) => r.id === requestId);
        if (localMatch) setRequest(localMatch);
      } catch {}

      const supabase = createClient();
      const { data: req } = await supabase
        .from('pickup_requests')
        .select('*, waste_items(*)')
        .eq('id', requestId)
        .single();
      if (req) setRequest(req as PickupRequest);
    }
    load();
  }, [requestId, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    await sendChatMessage(requestId, currentUserId, text, 'collector');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      {/* Header */}
      <header className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 py-3.5 max-w-2xl mx-auto w-full flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Go back" className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition" type="button">
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight text-[#191C1E]">Pickup Coordination</h1>
          <p className="text-[11px] text-[#6B7280]">Req #{requestId.slice(0, 8)} · {request.address.split(',')[0]}</p>
        </div>
        <a href="tel:+919876543210" className="w-9 h-9 rounded-full bg-[#EAF5EE] flex items-center justify-center text-[#136B3B] hover:bg-[#D4EBD9] transition flex-shrink-0">
          <Phone className="w-4 h-4" />
        </a>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 pt-4 flex flex-col flex-1 space-y-4">

        {/* Status strip */}
        <div className="flex items-center gap-2 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_LABELS[request.status].badgeColor}`}>
            <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {STATUS_LABELS[request.status].label}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[#526056]">
            <Weight className="w-3.5 h-3.5" />
            <span className="font-semibold">{request.total_estimated_weight_kg} kg</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {[
            { id: 'chat' as const, label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'track' as const, label: 'View Location', icon: <Navigation className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-white text-[#191C1E] shadow-sm' : 'text-[#6B7280] hover:text-[#191C1E]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CHAT TAB ── */}
        {activeTab === 'chat' && (
          <div className="flex flex-col" style={{ minHeight: '420px' }}>
            {/* Household info */}
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl flex-shrink-0 font-bold text-blue-600">H</div>
              <div>
                <p className="text-sm font-bold text-[#191C1E]">Household User</p>
                <p className="text-xs text-[#526056]">{request.address.split(',')[0]}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs font-bold text-[#136B3B]">{request.total_estimated_weight_kg} kg</p>
                <p className="text-[10px] text-[#6B7280]">{request.scheduled_date}</p>
              </div>
            </div>

            {/* Chat bubble stream */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-[#F8FAF9]">
                <div className="w-2 h-2 rounded-full bg-[#136B3B] animate-pulse" />
                <span className="text-xs font-bold text-[#191C1E]">Live Chat with Household</span>
                <span className="ml-auto text-[10px] text-[#6B7280] font-mono">#{requestId.slice(0, 8)}</span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F9FA]" style={{ maxHeight: '300px' }}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#6B7280] text-xs gap-2 py-8">
                    <span className="text-3xl">💬</span>
                    <p className="font-bold text-[#191C1E]">No messages yet</p>
                    <p>Send the household a message!</p>
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

              <form onSubmit={sendMessage} className="p-3.5 bg-white border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message household…"
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

        {/* ── TRACK TAB ── */}
        {activeTab === 'track' && (
          <div className="space-y-4">
            {/* Map with pickup location */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-64 sm:h-80">
              <MapContainer
                center={[request.latitude || 12.9716, request.longitude || 77.5946]}
                zoom={15}
                requests={[request]}
                className="h-full w-full"
              />
            </div>

            {/* Address card */}
            <div className="flex items-start gap-2.5 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#EAF5EE] flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-[#136B3B]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#526056]">Pickup address</p>
                <p className="text-sm font-semibold text-[#191C1E] leading-snug">{request.address}</p>
                <p className="text-xs text-[#6B7280] mt-1">{request.scheduled_date}</p>
              </div>
            </div>

            {/* Scrap items */}
            {request.waste_items && request.waste_items.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
                <h2 className="text-xs font-bold text-[#526056] uppercase tracking-wide">Expected scrap items</h2>
                {request.waste_items.map((item, idx) => {
                  const meta = WASTE_CATEGORY_LABELS[item.category];
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <span className="text-base">{meta.icon}</span>
                      <span className="text-sm font-semibold text-[#191C1E] flex-1">{meta.label.split('&')[0].trim()}</span>
                      <span className="text-xs font-bold text-[#136B3B]">{item.approx_weight_kg} kg</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigate CTA */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${request.latitude},${request.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold rounded-2xl text-sm transition shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              Navigate to Pickup
            </a>
          </div>
        )}

      </main>

      <BottomNav role="collector" />
    </div>
  );
}