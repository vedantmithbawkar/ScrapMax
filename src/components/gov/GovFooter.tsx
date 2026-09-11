'use client';

import React from 'react';
import Link from 'next/link';
import {
  EmblemOfIndia,
  SwachhBharatLogo,
  DigitalIndiaLogo,
  SihBadge,
  MissionLifeBadge,
  IndianFlag,
  CpcbEprBadge,
} from './GovLogos';
import { ShieldCheck, PhoneCall, Mail, ExternalLink, HelpCircle, FileText } from 'lucide-react';

export default function GovFooter() {
  return (
    <footer className="bg-[#0B151F] text-gray-300 text-xs border-t-4 border-[#FF671F] relative z-20">
      
      {/* Top Logos Strip: National Initiatives */}
      <div className="bg-[#101D2A] border-b border-gray-800/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <EmblemOfIndia className="h-10 text-amber-100" />
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm tracking-wide">भारत सरकार</span>
              <span className="text-[10px] text-gray-400">Government of India</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <SwachhBharatLogo className="h-8" />
            <DigitalIndiaLogo className="h-7" />
            <SihBadge className="h-8" />
            <MissionLifeBadge className="h-7" />
            <CpcbEprBadge className="h-7" />
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1: About Portal & SIH */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#136B3B] text-white font-black text-sm flex items-center justify-center">
                SM
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm tracking-tight">ScrapMax · स्क्रैपमैक्स</h3>
                <p className="text-[10px] text-emerald-400 font-semibold">National Circular Economy Platform</p>
              </div>
            </div>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Official Smart India Hackathon (SIH) prototype deployed for municipal doorstep recyclable waste mobilization, authorized kabadiwala formalization, and transparent CPCB Extended Producer Responsibility (EPR) compliance.
            </p>
            <div className="pt-2 text-[11px] space-y-1.5 text-gray-300">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-[#FF9933]" />
                <span>Swachhata Helpline: <strong className="text-white font-mono">1969</strong> / <strong className="text-white font-mono">1800-11-2262</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Email: <strong className="text-white">support.sih@scrapmax.gov.in</strong></span>
              </div>
            </div>
          </div>

          {/* Col 2: National Government Portals */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 pb-1 border-b border-gray-800 flex items-center gap-1.5">
              <span>राष्ट्रीय पोर्टल | National Portals</span>
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <a href="https://www.india.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center justify-between group">
                  <span>National Portal of India (india.gov.in)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a href="https://www.mygov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center justify-between group">
                  <span>MyGov Citizen Engagement (mygov.in)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a href="https://moef.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center justify-between group">
                  <span>Ministry of Environment (MoEF&CC)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a href="https://cpcb.nic.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center justify-between group">
                  <span>Central Pollution Control Board (CPCB)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a href="https://swachhbharatmission.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center justify-between group">
                  <span>Swachh Bharat Mission (Urban 2.0)</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a href="https://maharashtra.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition flex items-center justify-between group">
                  <span>Government of Maharashtra / MCGM SWM</span>
                  <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-emerald-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Citizen & Recycler Services */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 pb-1 border-b border-gray-800">
              नागरिक एवं व्यवसाय सेवाएं | Services
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <Link href="/register?role=household" className="hover:text-emerald-400 transition">
                  Book Doorstep Recyclable Scrap Pickup
                </Link>
              </li>
              <li>
                <Link href="/register?role=collector" className="hover:text-emerald-400 transition">
                  Authorized Kabadiwala Registration & ID Card
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition">
                  Municipal Ward Admin Console & Reports
                </Link>
              </li>
              <li>
                <Link href="/household/report" className="hover:text-emerald-400 transition">
                  Swachhata Public Grievance / Illegal Dump Report
                </Link>
              </li>
              <li>
                <Link href="/household/track" className="hover:text-emerald-400 transition">
                  Track Live Dispatches & Digital Receipts
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: GIGW Mandatory Policies */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3 pb-1 border-b border-gray-800">
              वेबसाइट नीतियां | GIGW Policies
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li className="hover:text-emerald-400 cursor-pointer">हाइपरलिंकिंग नीति | Hyperlinking Policy</li>
              <li className="hover:text-emerald-400 cursor-pointer">गोपनीयता नीति | Privacy Policy</li>
              <li className="hover:text-emerald-400 cursor-pointer">कॉपीराइट नीति | Copyright Policy</li>
              <li className="hover:text-emerald-400 cursor-pointer">अभिगम्यता विवरण | Accessibility Statement</li>
              <li className="hover:text-emerald-400 cursor-pointer">नियम एवं शर्तें | Terms &amp; Conditions</li>
              <li className="hover:text-emerald-400 cursor-pointer">मदद एवं अक्सर पूछे जाने वाले प्रश्न | FAQ &amp; Help</li>
            </ul>
          </div>

        </div>
      </div>

      {/* Attribution & Legal Notice */}
      <div className="bg-[#070D14] border-t border-gray-800 py-4 px-4 sm:px-6 lg:px-8 text-[11px] text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div>
            <p>
              Website Content Managed by <strong>Ministry of Environment, Forest &amp; Climate Change (MoEF&amp;CC)</strong> and <strong>Ministry of Housing &amp; Urban Affairs (MoHUA)</strong>, Government of India.
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Developed for <strong>Smart India Hackathon (SIH)</strong>. Hosted on secure National Cloud Infrastructure.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-400">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400 font-mono">
              GIGW 3.0 Compliant
            </span>
            <span>
              Last Updated: <strong className="text-white">11-Sep-2026</strong>
            </span>
            <span>
              Visitors: <strong className="text-amber-400 font-mono">1,482,920</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tricolor Bottom Accent Strip */}
      <div className="w-full flex h-[4px]">
        <div className="flex-1 bg-[#FF671F]" />
        <div className="flex-1 bg-[#FFFFFF]" />
        <div className="flex-1 bg-[#046A38]" />
      </div>
    </footer>
  );
}
