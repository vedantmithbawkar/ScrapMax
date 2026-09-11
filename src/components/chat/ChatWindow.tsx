'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ChatMessage, UserProfile } from '@/types';
import { Send } from 'lucide-react';
import { getChatMessages, subscribeToChat, sendChatMessage } from '@/lib/chat-service';

interface ChatWindowProps {
  requestId: string;
  currentUser: UserProfile;
}

export default function ChatWindow({ requestId, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages(requestId));
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(getChatMessages(requestId));
    const unsubscribe = subscribeToChat(requestId, (updatedMsgs) => {
      setMessages(updatedMsgs);
    });
    return () => unsubscribe();
  }, [requestId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    const role = currentUser.role === 'collector' ? 'collector' : 'household';
    await sendChatMessage(requestId, currentUser.id, textToSend, role);
  };

  return (
    <div className="flex flex-col h-[520px] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#F8FAF9] border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#136B3B] animate-pulse"></div>
          <span className="text-sm font-bold text-[#191C1E]">Live Coordination Chat</span>
        </div>
        <span className="text-xs text-[#6B7280] font-mono">Req #{requestId.slice(0, 8)}</span>
      </div>

      {/* Messages Scroll Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F7F9FA]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#6B7280] text-xs gap-1">
            <span className="text-xl">💬</span>
            <p className="font-semibold text-[#191C1E]">No messages yet</p>
            <p>Send a message below to coordinate pickup timing and location!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-[#136B3B] text-white font-medium rounded-br-xs shadow-xs'
                      : 'bg-white text-[#191C1E] rounded-bl-xs border border-gray-200 shadow-xs'
                  }`}
                >
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

      {/* Input Footer */}
      <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 bg-[#F7F9FA] border border-gray-200 rounded-full text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-5 py-2.5 bg-[#136B3B] hover:bg-[#0F5730] disabled:opacity-50 text-white font-bold rounded-full flex items-center justify-center transition shadow-xs touch-feedback"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
