'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Minimize2, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  categoryBadge?: string;
  suggestedActions?: { label: string; query?: string }[];
}

interface IntentPattern {
  id: string;
  category: string;
  keywords: string[];
  patterns?: RegExp[];
  response: (input: string) => string;
  suggestions: string[];
}

// Levenshtein distance for fuzzy matching typos like "workd", "ratee", "scraap"
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

function hasFuzzyWord(input: string, targets: string[]): boolean {
  const words = input.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const word of words) {
    for (const target of targets) {
      if (word === target) return true;
      if (target.length >= 4 && Math.abs(word.length - target.length) <= 2) {
        const dist = levenshteinDistance(word, target);
        if (dist <= 1 || (target.length >= 6 && dist <= 2)) {
          return true;
        }
      }
    }
  }
  return false;
}

const COMPREHENSIVE_INTENTS: IntentPattern[] = [
  // 1. HOW IT WORKS / GENERAL FLOW (Answers "how does it workd", "what is scrapmax", "explain process")
  {
    id: 'how_it_works',
    category: 'System Workflow',
    keywords: ['how', 'work', 'works', 'workd', 'working', 'process', 'explain', 'steps', 'flow', 'what is aicle', 'what is scrapmax', 'system'],
    patterns: [/how.*work/i, /what.*do/i, /process/i, /explain/i],
    response: () =>
      `♻️ **Here is how AiCLE works in 4 simple steps:**\n\n` +
      `1️⃣ **Request Pickup:** Click "Request Pickup" to select your scrap items (Paper, Plastic, Metal, E-waste, Glass) and upload photos.\n` +
      `2️⃣ **GPS Pinpoint:** Choose your address or use "Live GPS" to pinpoint your doorstep for nearby collectors.\n` +
      `3️⃣ **Kabadiwala Arrives:** A verified local scrap collector accepts your request, navigates to your location, and weighs your materials on a digital scale.\n` +
      `4️⃣ **Instant Payout & Receipt:** Receive instant payment via **UPI QR Code** (GPay/PhonePe/Paytm) or **Cash** + an official digital green recycling receipt with CO₂ saved credits!`,
    suggestions: ['Current Scrap Rates', 'How Payment Works', 'Book a Pickup Now'],
  },

  // 2. SCRAP RATES & PRICING
  {
    id: 'rates_and_prices',
    category: 'Market Rates',
    keywords: ['rate', 'rates', 'price', 'prices', 'cost', 'money', 'value', 'per kg', 'bhaav', 'kilo', 'rupees', 'worth'],
    patterns: [/rate/i, /price/i, /how much/i, /worth/i, /cost/i],
    response: () =>
      `💰 **Official Verified Scrap Rates (Per Kilogram):**\n\n` +
      `• 📦 **Paper & Cardboard:** ₹15 / kg\n` +
      `• 🍾 **Plastics & PET Bottles:** ₹20 / kg\n` +
      `• ⚙️ **Metals & Iron/Steel Scrap:** ₹65 / kg\n` +
      `• 💻 **E-Waste & Electronics:** ₹110 / kg (Motherboards, batteries up to ₹200/kg)\n` +
      `• 🥛 **Glass Bottles:** ₹8 / kg\n` +
      `• 🌱 **Organic / Compost:** ₹4 / kg\n\n` +
      `*All rates are standardized and auto-calculated during doorstep weighing to eliminate unfair bargaining.*`,
    suggestions: ['How Doorstep Weighing Works', 'Book a Pickup Now', 'Accepted Materials'],
  },

  // 3. DOORSTEP PAYMENT & UPI
  {
    id: 'payment_flow',
    category: 'Payment & UPI',
    keywords: ['payment', 'pay', 'paid', 'upi', 'cash', 'qr', 'gpay', 'phonepe', 'paytm', 'receive', 'transfer', 'settlement'],
    patterns: [/pay/i, /upi/i, /cash/i, /money/i, /settle/i],
    response: () =>
      `💳 **Doorstep Payment Options:**\n\n` +
      `• 📱 **Instant UPI QR Code:** The collector taps "Weigh & Pay" on their portal, calculates the exact weight, and shows a dynamic QR code. Scan it with PhonePe, Google Pay, or Paytm to receive instant bank credit!\n` +
      `• 💵 **Direct Cash Handover:** If you prefer physical cash, the collector pays you the exact verified amount on the spot.\n` +
      `• 🧾 **Digital Handover Proof:** Both parties get an immutable receipt with a unique TXN ID, weights, and environmental offset logs.`,
    suggestions: ['View Scrap Rates', 'How to Book Pickup', 'Are Collectors Verified?'],
  },

  // 4. PICKUP BOOKING & SCHEDULING
  {
    id: 'booking_pickup',
    category: 'Scheduling',
    keywords: ['book', 'schedule', 'pickup', 'request', 'timing', 'slot', 'time', 'collect', 'doorstep'],
    patterns: [/schedule/i, /book/i, /pickup/i, /when/i],
    response: () =>
      `📅 **Scheduling a Doorstep Pickup:**\n\n` +
      `• You can select **Today**, **Tomorrow**, or **Weekend** slots.\n` +
      `• Simply tap the **"Pickup"** tab at the bottom or the top "Request Pickup" button.\n` +
      `• Add estimated weights and photos (helps collectors bring the right sized vehicle, e.g. e-rickshaw or mini-truck).\n` +
      `• You can chat directly with your assigned collector via the in-app Realtime Chat!`,
    suggestions: ['Open Pickup Form', 'What materials are accepted?', 'Track My Pickup'],
  },

  // 5. KABADIWALA / COLLECTOR SAFETY & VERIFICATION
  {
    id: 'kabadiwala_safety',
    category: 'Collector Network',
    keywords: ['kabadiwala', 'collector', 'scrapper', 'dealer', 'trust', 'safe', 'safety', 'who', 'verified', 'background'],
    patterns: [/who/i, /trust/i, /safe/i, /verified/i],
    response: () =>
      `🛡️ **Verified Collector Network:**\n\n` +
      `• All scrap collectors & Kabadiwalas on AiCLE are vetted with verified mobile numbers and local recycling licenses.\n` +
      `• Our **OpenStreetMap Overpass engine** maps active local scrap hubs within 5km radius.\n` +
      `• You can track the collector's approach on the live map and chat with them in real-time.\n` +
      `• Clear customer star ratings and digital receipts ensure complete transparency.`,
    suggestions: ['Current Scrap Rates', 'How does it work?', 'Contact Support'],
  },

  // 6. ACCEPTED MATERIALS & SEGREGATION
  {
    id: 'materials_segregation',
    category: 'Materials Guide',
    keywords: ['material', 'materials', 'items', 'accept', 'accepted', 'segregate', 'clean', 'dry', 'plastic', 'metal', 'copper', 'paper', 'battery'],
    patterns: [/what.*recycle/i, /accept/i, /material/i, /segregat/i],
    response: () =>
      `📦 **Accepted Recyclable Materials:**\n\n` +
      `• **Paper:** Newspapers, cardboard cartons, office paper, books, shredded paper.\n` +
      `• **Plastics:** PET water bottles, milk pouches, hard plastic tubs, HDPE cans.\n` +
      `• **Metals:** Iron, steel utensils, copper wires, brass, aluminum cans.\n` +
      `• **E-Waste:** Old laptops, smartphones, PCBs, motherboards, lead-acid batteries, chargers.\n` +
      `• **Glass:** Beverage and beer bottles, jars.\n\n` +
      `*Tip: Keep recyclables dry and clean to fetch the highest market rate!*`,
    suggestions: ['Check Rates for Materials', 'Book a Pickup', 'How Payment Works'],
  },

  // 7. ENVIRONMENTAL CARBON CREDITS & IMPACT
  {
    id: 'carbon_impact',
    category: 'Sustainability',
    keywords: ['impact', 'carbon', 'trees', 'green', 'environment', 'co2', 'offset', 'credit', 'sih', 'benefits'],
    patterns: [/impact/i, /carbon/i, /tree/i, /environ/i, /co2/i],
    response: () =>
      `🌱 **Your Environmental Recycling Impact:**\n\n` +
      `For every 10 kg of scrap recycled through AiCLE:\n` +
      `• 🌳 **~0.2 Trees Saved** from deforestation\n` +
      `• ☁️ **~18 kg CO₂ Equivalent** emissions prevented\n` +
      `• 💧 **~250 Litres of Water Conserved** compared to virgin manufacturing\n` +
      `• 🚫 **100% Landfill Diversion** ensuring circular zero-waste economy!`,
    suggestions: ['View My Recycling History', 'Current Scrap Rates', 'Book a Pickup'],
  },

  // 8. SIH HACKATHON / PROJECT PURPOSE
  {
    id: 'sih_project',
    category: 'SIH Project Info',
    keywords: ['sih', 'smart india hackathon', 'project', 'about', 'hackathon', 'team', 'mission'],
    patterns: [/sih/i, /hackathon/i, /project/i],
    response: () =>
      `🏆 **Smart India Hackathon (SIH) Innovation:**\n\n` +
      `AiCLE is a **Circular Waste Logistics & Informal Sector Integration Platform** designed to solve Urban Solid Waste Management:\n` +
      `• Formalizes unorganized Kabadiwalas with digital weighing & UPI payouts.\n` +
      `• Provides citizens transparent rates, zero-bargaining, and GPS doorstep convenience.\n` +
      `• Provides Urban Local Bodies (ULBs) real-time landfill diversion tracking and carbon analytics.`,
    suggestions: ['How does it work?', 'View Current Scrap Rates', 'Test Doorstep Handover'],
  },

  // 9. GREETINGS & CASUAL
  {
    id: 'greetings',
    category: 'Greeting',
    keywords: ['hi', 'hello', 'hey', 'namaste', 'morning', 'afternoon', 'evening', 'good morning', 'hola'],
    patterns: [/^(hi|hello|hey|namaste)/i],
    response: () =>
      `Namaste! 🙏 Welcome to AiCLE. I'm your AI recycling guide.\n` +
      `How can I help you today? You can ask me about scrap rates, booking pickups, doorstep UPI payouts, or how the platform works!`,
    suggestions: ['How does it work?', 'Current Scrap Rates', 'How Payment Works'],
  },

  // 10. THANKS & APPRECIATION
  {
    id: 'appreciation',
    category: 'Appreciation',
    keywords: ['thanks', 'thank you', 'great', 'awesome', 'good', 'nice', 'ok', 'super'],
    patterns: [/thank/i, /great/i, /awesome/i],
    response: () =>
      `You're very welcome! 🌿 Happy recycling with AiCLE. Every piece of scrap diverted from the landfill makes our cities cleaner and greener! Let me know if you need anything else.`,
    suggestions: ['Current Scrap Rates', 'Book a Pickup', 'How Payment Works'],
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: "Namaste! 🙏 I'm AiCLE AI, your circular waste & recycling assistant.\n\nAsk me anything: scrap prices, doorstep pickups, UPI payments, or how our system works!",
    time: 'Online',
    categoryBadge: 'AI Assistant',
    suggestedActions: [
      { label: 'How Does It Work?', query: 'How does AiCLE work?' },
      { label: 'Current Scrap Rates', query: 'What are the current scrap rates?' },
      { label: 'Doorstep UPI Payment', query: 'How does doorstep payment work?' },
    ],
  },
];

export default function SmartAssistant() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // AI Matching Engine with Regex Patterns, Multi-keyword scoring, and Fuzzy matching
  const findSmartResponse = (query: string): { text: string; category?: string; suggestions: string[] } => {
    const cleanQuery = query.toLowerCase().trim();

    let bestMatch: IntentPattern | null = null;
    let highestScore = 0;

    for (const intent of COMPREHENSIVE_INTENTS) {
      let score = 0;

      // 1. Regex pattern matching (High confidence: +5)
      if (intent.patterns) {
        for (const pattern of intent.patterns) {
          if (pattern.test(cleanQuery)) {
            score += 5;
          }
        }
      }

      // 2. Direct keyword inclusion (+3 per keyword match)
      for (const kw of intent.keywords) {
        if (cleanQuery.includes(kw)) {
          score += 3;
        }
      }

      // 3. Fuzzy matching for typos (+2)
      if (hasFuzzyWord(cleanQuery, intent.keywords)) {
        score += 2;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = intent;
      }
    }

    if (bestMatch && highestScore >= 2) {
      return {
        text: bestMatch.response(query),
        category: bestMatch.category,
        suggestions: bestMatch.suggestions,
      };
    }

    // Default intelligent fallback with guided prompts
    return {
      text:
        `I understand you're asking about "${query}".\n\n` +
        `Here is what I can instantly assist you with:\n` +
        `• 📦 **Scrap Rates:** Today's verified per-kg rates for paper, plastic, metals, e-waste.\n` +
        `• 🚛 **How It Works:** Step-by-step door-step pickup, digital scale weighing, and UPI settlement.\n` +
        `• 💳 **Payment:** Instant PhonePe/GPay UPI QR codes or cash on doorstep.\n` +
        `• 📍 **GPS Tracking:** How nearby Kabadiwalas are assigned.\n\n` +
        `Click any suggestion below or ask in your own words!`,
      category: 'Help Guide',
      suggestions: ['How does it work?', 'Current Scrap Rates', 'How Payment Works', 'Book a Pickup'],
    };
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `usr-${crypto.randomUUID()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Simulate smart AI typing response
    setTimeout(() => {
      const match = findSmartResponse(text);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: match.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        categoryBadge: match.category,
        suggestedActions: match.suggestions.map((s) => ({
          label: s,
          query: s,
        })),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 300);
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
      {/* Trigger Floating Action Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AiCLE AI Assistant"
          className="flex items-center gap-2.5 px-4 py-3 bg-[#136B3B] hover:bg-[#0F5730] text-white rounded-full shadow-lg shadow-[#136B3B]/25 hover:shadow-xl active:scale-95 transition-all touch-feedback group"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <span className="font-bold text-xs hidden sm:inline tracking-wide">
            AiCLE AI Help
          </span>
        </button>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="w-[calc(100vw-2rem)] sm:w-[410px] h-[520px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 transition-all"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#136B3B] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight">AiCLE AI Assistant</h3>
                <span className="text-[10px] text-[#A6D5B8] flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Smart Recycling &amp; Logistics Engine
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                title="Clear conversation"
                aria-label="Clear chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize Assistant"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-[#F8FAF9] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Category Badge for bot */}
                {msg.sender === 'bot' && msg.categoryBadge && (
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#136B3B] bg-[#E6F4EA] px-2 py-0.5 rounded-full mb-1 border border-[#A6D5B8]">
                    {msg.categoryBadge}
                  </span>
                )}

                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line leading-relaxed ${
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
                        onClick={() => handleSend(sugg.query || sugg.label)}
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

          {/* Quick FAQ Bottom Strip */}
          <div className="px-3 py-1.5 bg-[#EDF7F2] border-t border-emerald-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10.5px] font-bold text-[#136B3B] flex-shrink-0">Quick Topics:</span>
            <button
              type="button"
              onClick={() => handleSend('How does AiCLE work?')}
              className="text-[10.5px] text-[#2B6B47] hover:underline flex-shrink-0 font-medium"
            >
              How It Works
            </button>
            <span className="text-gray-300">&bull;</span>
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
              onClick={() => handleSend('What materials are accepted?')}
              className="text-[10.5px] text-[#2B6B47] hover:underline flex-shrink-0 font-medium"
            >
              Accepted Items
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
              placeholder="Ask anything (e.g. how it works, rates, UPI)..."
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
