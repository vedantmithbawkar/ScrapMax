'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatMessage, UserProfile } from '@/types';
import { Send, User } from 'lucide-react';

interface ChatWindowProps {
  requestId: string;
  currentUser: UserProfile;
}

export default function ChatWindow({ requestId, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [chatId, setChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function initChat() {
      let { data: chat } = await supabase
        .from('chats')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (!chat) {
        const { data: request } = await supabase
          .from('pickup_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (request) {
          const { data: newChat } = await supabase
            .from('chats')
            .insert({
              request_id: requestId,
              household_id: request.household_id,
              collector_id: request.collector_id || currentUser.id,
            })
            .select('*')
            .single();

          chat = newChat;
        }
      }

      if (chat) {
        setChatId(chat.id);

        const { data: initialMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });

        if (initialMessages) {
          setMessages(initialMessages as ChatMessage[]);
        }

        const channel = supabase
          .channel(`chat:${chat.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${chat.id}`,
            },
            (payload) => {
              const newMsg = payload.new as ChatMessage;
              setMessages((prev) => [...prev, newMsg]);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }

    initChat();
  }, [requestId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatId) return;

    const supabase = createClient();
    const textToSend = inputText.trim();
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUser.id,
      text: textToSend,
    });

    if (error) {
      console.error('Failed to send message:', error);
      // Fallback local append for demo
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          chat_id: chatId,
          sender_id: currentUser.id,
          text: textToSend,
          created_at: new Date().toISOString(),
        },
      ]);
    }
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
