'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { MessageSquare, MapPin, Clock, ChevronRight } from 'lucide-react';

const DEMO_CHATS = [
  {
    requestId: 'req-c301-demo-uuid',
    householdName: 'Household — Mulund West',
    address: 'LBS Marg, Opp. Marathon Monte Carlo, Mulund West, Mumbai',
    status: 'accepted',
    lastMessage: 'Items packed in bags in garage.',
    time: '5 min ago',
    unread: 2,
  },
  {
    requestId: 'req-c302-demo-uuid',
    householdName: 'Household — Mulund Station',
    address: 'Nehru Road, Near Mulund Railway Station West, Mulund West, Mumbai',
    status: 'in_progress',
    lastMessage: 'I\'ll be there in 10 minutes!',
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

        {DEMO_CHATS.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] text-sm">
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-[#191C1E]">No active chats</p>
            <p className="mt-1">Accept a pickup request to start chatting with households.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {DEMO_CHATS.map((chat) => (
              <Link
                key={chat.requestId}
                href={`/collector/chat/${chat.requestId}`}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-[#136B3B] hover:shadow-md transition group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#EAF5EE] flex items-center justify-center text-xl font-bold text-[#136B3B] flex-shrink-0">
                  H
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-[#191C1E] truncate">{chat.householdName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[chat.status]}`}>
                      {STATUS_LABELS[chat.status]}
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