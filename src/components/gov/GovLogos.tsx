import React from 'react';

/**
 * State Emblem of India (Ashoka Lion Capital with Satyameva Jayate)
 */
export function EmblemOfIndia({ className = 'h-12 w-auto' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 120 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto text-[#6D4C1D] shrink-0"
        aria-label="State Emblem of India"
      >
        {/* Ashoka Lion Capital Stylized Silhouette & Base */}
        <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Top Lions Heads Silhouette */}
          <path d="M42 22C42 14 50 8 60 8C70 8 78 14 78 22C84 20 94 25 94 36C94 48 85 58 78 62C80 68 76 78 70 82C66 84 64 90 64 96L56 96C56 90 54 84 50 82C44 78 40 68 42 62C35 58 26 48 26 36C26 25 36 20 42 22Z" fill="#F5EFE6" />
          {/* Left Lion details */}
          <path d="M34 32C37 30 42 33 44 38C45 42 42 46 38 46" />
          <circle cx="38" cy="38" r="1.5" fill="currentColor" />
          {/* Center Lion details */}
          <path d="M52 28C55 24 65 24 68 28" />
          <ellipse cx="60" cy="36" rx="4" ry="3" />
          <circle cx="54" cy="32" r="1.5" fill="currentColor" />
          <circle cx="66" cy="32" r="1.5" fill="currentColor" />
          <path d="M56 46C58 48 62 48 64 46" />
          {/* Right Lion details */}
          <path d="M86 32C83 30 78 33 76 38C75 42 78 46 82 46" />
          <circle cx="82" cy="38" r="1.5" fill="currentColor" />

          {/* Manes & Shoulders */}
          <path d="M42 56C46 62 50 66 60 66C70 66 74 62 78 56" />
          <path d="M48 68C52 74 60 76 60 76C60 76 68 74 72 68" />
          <path d="M50 80L70 80" />
          <path d="M46 90L74 90" />

          {/* Capital Abacus (Belt with Ashoka Chakra) */}
          <rect x="24" y="98" width="72" height="22" rx="3" fill="#FFF8F0" stroke="currentColor" strokeWidth="2.5" />
          {/* Ashoka Chakra in Abacus */}
          <circle cx="60" cy="109" r="8" stroke="#000080" strokeWidth="1.8" fill="#FFFFFF" />
          <circle cx="60" cy="109" r="2" fill="#000080" />
          <path d="M60 101L60 117M52 109L68 109M54.5 103.5L65.5 114.5M54.5 114.5L65.5 103.5" stroke="#000080" strokeWidth="1" />

          {/* Galloping Horse (Left) & Bull (Right) stylized */}
          <path d="M32 104C34 104 38 108 40 114" strokeWidth="1.6" />
          <path d="M88 104C86 104 82 108 80 114" strokeWidth="1.6" />

          {/* Inverted Lotus Bell Base */}
          <path d="M26 120C30 134 44 140 60 140C76 140 90 134 94 120" strokeWidth="2.2" fill="#FFF8F0" />
          <path d="M38 120C42 130 50 136 60 136C70 136 78 130 82 120" strokeWidth="1.4" />
          <path d="M48 120L52 134" strokeWidth="1.2" />
          <path d="M72 120L68 134" strokeWidth="1.2" />

          {/* Base Platform */}
          <rect x="20" y="140" width="80" height="6" rx="2" fill="currentColor" />
        </g>
        {/* Satyameva Jayate (Hindi Devanagari text) */}
        <text
          x="60"
          y="157"
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="bold"
          fontFamily="serif"
          fill="currentColor"
          letterSpacing="0.5"
        >
          सत्यमेव जयते
        </text>
      </svg>
    </div>
  );
}

/**
 * Indian National Flag (Tiranga) with 24-spoke Ashoka Chakra
 */
export function IndianFlag({ className = 'h-5 w-7.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 600"
      className={`rounded-[2px] shadow-2xs shrink-0 overflow-hidden ${className}`}
      aria-label="National Flag of India"
    >
      {/* Saffron Band */}
      <rect width="900" height="200" fill="#FF9933" />
      {/* White Band */}
      <rect y="200" width="900" height="200" fill="#FFFFFF" />
      {/* Green Band */}
      <rect y="400" width="900" height="200" fill="#138808" />
      {/* Ashoka Chakra */}
      <g transform="translate(450, 300)">
        <circle r="72" fill="none" stroke="#000080" strokeWidth="6" />
        <circle r="14" fill="#000080" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2="0"
            y2="-72"
            stroke="#000080"
            strokeWidth="3.2"
            transform={`rotate(${i * 15})`}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Swachh Bharat Mission Logo (Mahatma Gandhi Iconic Round Glasses)
 */
export function SwachhBharatLogo({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg viewBox="0 0 200 95" className="h-full w-auto" aria-label="Swachh Bharat Mission Logo">
        {/* Left Lens */}
        <circle cx="58" cy="46" r="32" fill="#FFFFFF" stroke="#000080" strokeWidth="4.5" />
        {/* Right Lens */}
        <circle cx="142" cy="46" r="32" fill="#FFFFFF" stroke="#000080" strokeWidth="4.5" />
        {/* Bridge */}
        <path d="M90 46 C95 38, 105 38, 110 46" fill="none" stroke="#000080" strokeWidth="4.5" strokeLinecap="round" />
        {/* Left Frame Arm */}
        <path d="M26 44 L8 38" fill="none" stroke="#000080" strokeWidth="4" strokeLinecap="round" />
        {/* Right Frame Arm */}
        <path d="M174 44 L192 38" fill="none" stroke="#000080" strokeWidth="4" strokeLinecap="round" />
        {/* Text inside Left Lens: स्वच्छ */}
        <text x="58" y="53" textAnchor="middle" fontSize="17" fontWeight="bold" fill="#000080" fontFamily="sans-serif">
          स्वच्छ
        </text>
        {/* Text inside Right Lens: भारत */}
        <text x="142" y="53" textAnchor="middle" fontSize="17" fontWeight="bold" fill="#000080" fontFamily="sans-serif">
          भारत
        </text>
        {/* Tricolor underline accent */}
        <rect x="26" y="85" width="48" height="4" rx="2" fill="#FF9933" />
        <rect x="76" y="85" width="48" height="4" rx="2" fill="#000080" />
        <rect x="126" y="85" width="48" height="4" rx="2" fill="#138808" />
        <text x="100" y="93" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#138808" fontFamily="sans-serif">
          एक कदम स्वच्छता की ओर
        </text>
      </svg>
    </div>
  );
}

/**
 * Digital India Logo
 */
export function DigitalIndiaLogo({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg viewBox="0 0 160 55" className="h-full w-auto" aria-label="Digital India Logo">
        {/* Tri-colored spiral/sunburst icon */}
        <circle cx="28" cy="27" r="22" fill="#F4FAF6" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M28 8 A19 19 0 0 1 47 27 L28 27 Z" fill="#FF9933" />
        <path d="M47 27 A19 19 0 0 1 28 46 L28 27 Z" fill="#000080" />
        <path d="M28 46 A19 19 0 0 1 9 27 L28 27 Z" fill="#138808" />
        <circle cx="28" cy="27" r="7" fill="#FFFFFF" stroke="#000080" strokeWidth="2" />
        {/* Text */}
        <text x="56" y="25" fontSize="15" fontWeight="900" fill="#000080" fontFamily="sans-serif" letterSpacing="-0.5">
          Digital India
        </text>
        <text x="56" y="38" fontSize="8" fontWeight="bold" fill="#FF671F" fontFamily="sans-serif" letterSpacing="0.2">
          Power To Empower
        </text>
      </svg>
    </div>
  );
}

/**
 * Smart India Hackathon (SIH) Official Initiative Badge
 */
export function SihBadge({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-50 via-white to-green-50 border border-amber-200/80 shadow-2xs ${className}`}>
      <div className="w-7 h-7 rounded-lg bg-[#FF671F] flex items-center justify-center text-white font-black text-[10px] shadow-xs">
        SIH
      </div>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[11px] font-extrabold text-[#191C1E] flex items-center gap-1">
          <span>Smart India Hackathon</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </span>
        <span className="text-[9px] font-semibold text-[#6B7280]">
          MoE · AICTE · Circular Economy
        </span>
      </div>
    </div>
  );
}

/**
 * Mission LiFE (Lifestyle for Environment) Badge
 */
export function MissionLifeBadge({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 ${className}`}>
      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
        🌱
      </div>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[10px] font-extrabold text-emerald-900">Mission LiFE</span>
        <span className="text-[8px] font-semibold text-emerald-700">Lifestyle for Environment</span>
      </div>
    </div>
  );
}

/**
 * CPCB EPR Certified Seal
 */
export function CpcbEprBadge({ className = 'h-9 w-auto' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 ${className}`}>
      <div className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[9px] font-black">
        ✓
      </div>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[10px] font-black text-blue-950">CPCB · EPR Aligned</span>
        <span className="text-[8px] font-bold text-blue-700">Recycling Chain of Custody</span>
      </div>
    </div>
  );
}
