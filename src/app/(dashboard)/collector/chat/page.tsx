'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { MessageSquare, MapPin, Clock, ChevronRight } from 'lucide-react';
import { getChatMessages, subscribeToChat } from '@/lib/chat-service';
import { createClient } from '@/lib/supabase/client';

interface ChatSummary {
  requestId: string;
  householdName: string;
  address: string;
  status: string;
  lastMessage: string;
  time: string;
  unread: number;
}

const DEFAULT_CHATS: ChatSummary[] = [
  {
    requestId: 'req-map-001',
    householdName: 'Household — Doorstep Scrap Pickup',
    address: 'Main Market Road, Near City Center',
    status: 'accepted',
    lastMessage: 'Perfect. I am about 15 minutes away. See you soon! 🚛',
    time: 'Just now',
    unread: 0,
  },
  {
    requestId: 'req-h102',
    householdName: 'Household — Koramangala',
    address: '80ft Road, Koramangala 4th Block',
    status: 'accepted',
    lastMessage: 'Recyclables ready near the gate.',
    time: '20 min ago',
    unread: 0,
  },
  {
    requestId: 'req-c302',
    householdName: 'Household — Commercial Hub',
    address: 'Station Road West, Commercial Hub',
    status: 'in_progress',
    lastMessage: "I'll be there in 10 minutes!",
    time: '1 hr ago',
    unread: 0,
  },
];

const STATUS_COLORS: Record<string, string> = {
  accepted: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-[#EAE6F8] text-[#4A3E8F]',
  pending: 'bg-amber-50 text-amber-700',
  completed: 'bg-[#E6F4EA] text-[#136B3B]',
};
const STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepted',
  in_progress: 'In Progress',
  pending: 'Pending',
  completed: 'Completed',
};

export default function CollectorChatListPage() {
  const [chats, setChats] = useState<ChatSummary[]>(DEFAULT_CHATS);

  const refreshLastMessages = () => {
    setChats((prev) =>
      prev.map((c) => {
        const msgs = getChatMessages(c.requestId);
        if (msgs && msgs.length > 0) {
          const last = msgs[msgs.length - 1];
          return {
            ...c,
            lastMessage: last.text,
            time: new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return c;
      })
    );
  };

  useEffect(() => {
    // 1. Initial message refresh
    refreshLastMessages();

    // 2. Load requests from local storage if available
    try {
      const local = JSON.parse(localStorage.getItem('local_pickup_requests') || '[]');
      if (Array.isArray(local) && local.length > 0) {
        const localChats: ChatSummary[] = local.map((r: any) => {
          const msgs = getChatMessages(r.id);
          const last = msgs[msgs.length - 1];
          return {
            requestId: r.id,
            householdName: r.household?.full_name || r.userName || 'Household Pickup',
            address: r.address || 'Pickup Location',
            status: r.status || 'accepted',
            lastMessage: last ? last.text : 'Pickup coordination chat',
            time: last ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            unread: 0,
          };
        });

        setChats((existing) => {
          const map = new Map<string, ChatSummary>();
          localChats.forEach((c) => map.set(c.requestId, c));
          existing.forEach((c) => {
            if (!map.has(c.requestId)) map.set(c.requestId, c);
          });
          return Array.from(map.values());
        });
      }
    } catch {}

    // Listen for live updates
    const unsub = subscribeToChat('req-map-001', () => {
      refreshLastMessages();
    });

    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#191C1E] tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#136B3B]" />
            Active Chats
          </h1>
          <p className="text-sm text-[#526056] mt-1">Chat with households for your active pickups</p>
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] text-sm">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-[#191C1E]">No active chats</p>
            <p className="mt-1">Accept a pickup request to start chatting with households.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <Link
                key={chat.requestId}
                href={`/collector/chat/${chat.requestId}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-[#136B3B] hover:shadow-md transition group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center text-xl font-bold text-[#136B3B] flex-shrink-0">
                  {(chat.householdName || 'H').replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase() || 'H'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-[#191C1E] truncate">{chat.householdName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[chat.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[chat.status] || 'Active'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#6B7280] mb-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{chat.address}</span>
                  </div>
                  <p className="text-xs text-[#526056] truncate">{chat.lastMessage}</p>
                </div>

                {/* Trailing */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-[#6B7280]">
                    <Clock className="w-3 h-3" />
                    {chat.time}
                  </div>
                  {chat.unread > 0 ? (
                    <span className="w-5 h-5 rounded-full bg-[#136B3B] text-white text-[10px] font-bold flex items-center justify-center">
                      {chat.unread}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#136B3B] transition" />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav role="collector" />
    </div>
  );
}