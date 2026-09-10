'use client';

import React, { use } from 'react';
import Navbar from '@/components/common/Navbar';
import ChatWindow from '@/components/chat/ChatWindow';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  // Mock user session for demo messaging
  const currentUser = {
    id: 'user-demo-id',
    full_name: 'AiCLE User',
    role: 'household' as const,
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-12">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-4">
        
        <div className="flex items-center gap-3">
          <Link
            href="/household"
            className="p-2 bg-white hover:bg-gray-50 text-[#191C1E] rounded-xl transition border border-gray-200 shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#191C1E] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#136B3B]" />
              <span>Realtime Pickup Coordination Chat</span>
            </h1>
            <p className="text-xs text-[#6B7280]">Request #{resolvedParams.id.slice(0, 8)}</p>
          </div>
        </div>

        <ChatWindow requestId={resolvedParams.id} currentUser={currentUser} />

      </main>
    </div>
  );
}
