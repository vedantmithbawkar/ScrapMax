'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, HelpCircle, ChevronDown, CheckCircle2, DollarSign, Calendar, MapPin, Minimize2 } from 'lucide-react';
import { STANDARD_SCRAP_RATES } from '@/types';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  suggestedActions?: { label: string; action: () => void }[];
}

const FAQ_KNOWLEDGE_BASE = [
  {
    keywords: ['rate', 'price', 'cost', 'how much', 'money', 'value'],
    response: `Here are our standard verified scrap recycling rates:\n\n• 📦 Paper & Cardboard: ₹15/kg\n• 🍾 Plastics & Bottles: ₹20/kg\n• ⚙️ Metals & Iron Scrap: ₹65/kg\n• 💻 E-Waste & Electronics: ₹110/kg\n• 🥛 Glass Bottles: ₹8/kg\n• 🌱 Organic/Compost: ₹4/kg\n\nRates are updated transparently to prevent doorstep bargaining!`,
  },
  {
    keywords: ['pickup', 'schedule', 'book', 'request', 'collect'],
    response: `To schedule a scrap pickup:\n1. Go to "Pickup" on the bottom navigation or click "Request Pickup".\n2. Select your scrap materials & approximate weights.\n3. Take or upload scrap photos for verification.\n4. Confirm your GPS location and select Today, Tomorrow, or Weekend! A nearby Kabadiwala will accept your request.`,
  },
  {
    keywords: ['payment', 'pay', 'upi', 'cash', 'money transfer', 'receipt'],
    response: `ScrapMax supports transparent doorstep payments!\nWhen the Kabadiwala weighs your scrap on their scale, they enter the verified kilograms into the app. You can receive payment immediately via Instant UPI (PhonePe, GPay, Paytm QR) or physical cash, complete with a digital proof receipt.`,
  },
  {
    keywords: ['kabadiwala', 'collector', 'who', 'verify', 'safe'],
    response: `All collectors on ScrapMax are verified local scrap hubs and informal waste recyclers. You can see their name, live GPS location, customer rating, and communicate via real-time chat directly inside the app.`,
  },
  {
    keywords: ['segregate', 'dry', 'clean', 'condition', 'prepare'],
    response: `Pro-tip for maximum value:\n• Keep paper dry and bundled.\n• Rinse plastic containers and crush PET bottles.\n• Keep metals separated.\nDry, clean recyclables receive prompt collector pickup and higher verified rates!`,
  },
  {
    keywords: ['contact', 'help', 'support', 'issue'],
    response: `For urgent pickup coordination, please use the in-app Realtime Chat with your assigned collector. For technical assistance or municipal recycling inquiries, you can reach out to support@scrapmax.org.`,
  },
];

export default function SmartAssistant() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "Namaste! 🙏 I'm ScrapMax AI, your circular waste and scrap assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Current Scrap Rates', action: () => handleSend('What are the current scrap rates?') },
        { label: 'How to Schedule Pickup', action: () => handleSend('How do I book a pickup?') },
        { label: 'Payment Options', action: () => handleSend('How does doorstep payment work?') },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const findAnswer = (query: string): string => {
    const clean = query.toLowerCase();
    for (const item of FAQ_KNOWLEDGE_BASE) {
      if (item.keywords.some((kw) => clean.includes(kw))) {
        return item.response;
      }
    }
    return `I can help you with scrap rates, doorstep pickup scheduling, Kabadiwala discovery, and instant UPI/cash payouts. Try asking "What are the scrap prices?" or "How does payment work?"`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Simulate smart bot response
    setTimeout(() => {
      const reply = findAnswer(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 450);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
      {/* Trigger Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open ScrapMax AI Assistant"
          className="flex items-center gap-2.5 px-4 py-3 bg-[#136B3B] hover:bg-[#0F5730] text-white rounded-full shadow-lg shadow-[#136B3B]/25 hover:shadow-xl active:scale-95 transition-all touch-feedback group"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <span className="font-bold text-xs hidden sm:inline tracking-wide">
            ScrapMax AI Help
          </span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="w-[calc(100vw-2rem)] sm:w-96 h-[480px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 transition-all"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#136B3B] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight">ScrapMax Assistant</h3>
                <span className="text-[10px] text-[#A6D5B8] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Online &bull; Instant Scrap Answers
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Assistant"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F8FAF9] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#136B3B] text-white rounded-br-xs font-medium shadow-2xs'
                      : 'bg-white text-[#191C1E] rounded-bl-xs border border-gray-200 shadow-2xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9.5px] text-[#6B7280] mt-1 px-1">{msg.time}</span>

                {/* Quick Action Suggestion Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {msg.suggestedActions.map((sugg, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={sugg.action}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-[#136B3B] border border-[#A6D5B8] rounded-full text-[11px] font-semibold transition active:scale-95 shadow-2xs"
                      >
                        {sugg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Strip */}
          <div className="px-3 py-1.5 bg-[#EDF7F2] border-t border-emerald-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10.5px] font-bold text-[#136B3B] flex-shrink-0">Quick:</span>
            <button
              type="button"
              onClick={() => handleSend('What are the scrap rates?')}
              className="text-[10.5px] text-[#2B6B47] hover:underline flex-shrink-0 font-medium"
            >
              Scrap Rates
            </button>
            <span className="text-gray-300">&bull;</span>
            <button
              type="button"
              onClick={() => handleSend('How does payment work?')}
              className="text-[10.5px] text-[#2B6B47] hover:underline flex-shrink-0 font-medium"
            >
              UPI &amp; Cash
            </button>
            <span className="text-gray-300">&bull;</span>
            <button
              type="button"
              onClick={() => handleSend('How do I book a pickup?')}
              className="text-[10.5px] text-[#2B6B47] hover:underline flex-shrink-0 font-medium"
            >
              Book Pickup
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-gray-100 flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rates, pickups, UPI..."
              className="flex-1 px-3.5 py-2 bg-[#F8FAF9] border border-gray-200 rounded-full text-xs text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] transition"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-[#136B3B] hover:bg-[#0F5730] disabled:opacity-50 text-white rounded-full transition shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
