'use client';

import React from 'react';
import { Bell, PhoneCall, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function GovTicker() {
  return (
    <div className="bg-[#FFF8F0] border-b border-amber-200/90 text-[#191C1E] text-xs py-1.5 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-hidden">
        
        {/* Urgent Announcement Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF671F] text-white text-[10px] font-black uppercase tracking-wider shrink-0 shadow-2xs">
          <Bell className="w-3 h-3 animate-bounce" />
          <span>राष्ट्रीय सूचना | SIH 2024–26</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 overflow-hidden relative">
          <p className="whitespace-nowrap animate-marquee flex items-center gap-8 font-medium text-[11px] text-[#4A3210]">
            <span>
              🇮🇳 <strong>Smart India Hackathon Initiative:</strong> MoEFCC & SBM-U 2.0 Doorstep Recyclable Scrap Mobilization & EPR Transparency Platform.
            </span>
            <span>·</span>
            <span>
              ⚖️ <strong>Direct Benefit Transfer (DBT):</strong> Transparent digital scale weighing with instant UPI payouts to household citizens.
            </span>
            <span>·</span>
            <span>
              🛡️ <strong>Authorized Kabadiwalas:</strong> 100% ID-verified municipal collectors with verified safety gear and digital receipts.
            </span>
            <span>·</span>
            <span>
              🌱 <strong>Mission LiFE Compliance:</strong> Real-time circular economy tracking saving landfill acreage and carbon credits.
            </span>
          </p>
        </div>

        {/* National Helpline Badge */}
        <div className="hidden md:flex items-center gap-2 shrink-0 border-l border-amber-300 pl-3 text-[11px]">
          <PhoneCall className="w-3.5 h-3.5 text-[#046A38]" />
          <span className="text-[#526056] font-semibold">Toll-Free Helpline:</span>
          <a href="tel:1969" className="font-mono font-bold text-[#046A38] hover:underline">
            1969 (Swachhata)
          </a>
        </div>
      </div>
    </div>
  );
}
