'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Database,
  MapPin,
  Camera,
  Bell,
  CheckCircle2,
  ArrowLeft,
  Download,
  Smartphone,
  Server,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Printer,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const lastUpdated = 'September 11, 2026';
  const effectiveDate = 'January 1, 2026';

  const sections = [
    { id: 'overview', title: '1. Overview & Commitment', icon: Shield },
    { id: 'data-collected', title: '2. Information We Collect', icon: Database },
    { id: 'pwa-permissions', title: '3. Device & PWA Permissions', icon: Smartphone },
    { id: 'how-we-use', title: '4. How We Use Your Data', icon: RefreshCw },
    { id: 'payments-weighing', title: '5. Digital Weighing & UPI DBT', icon: Lock },
    { id: 'chat-privacy', title: '6. Two-Way Coordination Chat', icon: Eye },
    { id: 'storage-security', title: '7. Data Storage & Security', icon: Server },
    { id: 'user-rights', title: '8. Your Rights (DPDP Act 2023)', icon: CheckCircle2 },
    { id: 'contact', title: '9. Grievance Officer & Contact', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#191C1E] flex flex-col font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#0F5730] to-[#136B3B] text-white py-12 px-4 sm:px-6 lg:px-8 border-b-4 border-[#38EF7D]">
        <div className="max-w-5xl mx-auto space-y-4">
          
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to ScrapMax Home</span>
            </Link>

            <div className="flex items-center gap-2 text-xs text-white/80">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
                v2.6 &bull; DPDP Act 2023 Compliant
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md text-xs font-semibold transition"
                title="Print Policy"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Document</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#A6D5B8]">
              <Shield className="w-4 h-4 text-[#38EF7D]" />
              <span>ScrapMax Official Governance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Privacy Policy &amp; Data Protection Charter
            </h1>
            <p className="text-sm text-white/90 max-w-2xl leading-relaxed">
              Transparent guidelines on how ScrapMax collects, protects, uses, and respects citizen and collector data within our Progressive Web App (PWA) circular economy platform.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs text-white/70">
            <span>Last Updated: <strong className="text-white">{lastUpdated}</strong></span>
            <span>&bull;</span>
            <span>Effective Date: <strong className="text-white">{effectiveDate}</strong></span>
            <span>&bull;</span>
            <span>Jurisdiction: <strong className="text-white">Republic of India</strong></span>
          </div>

        </div>
      </section>

      {/* Main Body with Sticky Sidebar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar (Desktop sticky) */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs lg:sticky lg:top-24 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
              Table of Contents
            </div>
            <nav className="space-y-1">
              {sections.map(sec => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#E6F4EA] text-[#136B3B] font-bold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#136B3B]' : 'text-gray-400'}`} />
                      <span>{sec.title}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-40" />
                  </a>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-gray-100 px-3">
              <div className="text-[11px] text-gray-500 space-y-2">
                <p className="font-semibold text-gray-700">Need to export your data?</p>
                <p>You can download a full copy of your account profile and addresses at any time.</p>
                <Link
                  href="/household/settings"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#136B3B] hover:underline"
                >
                  <Download className="w-3 h-3" />
                  <span>Go to Data Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Policy Content Sections */}
        <main className="lg:col-span-8 space-y-10 text-sm leading-relaxed text-gray-700">
          
          {/* 1. Overview */}
          <section id="overview" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <Shield className="w-5 h-5" />
              <h2>1. Overview &amp; Our Commitment</h2>
            </div>
            <p>
              ScrapMax is a digital circular economy platform and Progressive Web App (PWA) developed for the <strong>Smart India Hackathon (SIH)</strong>. Our mission is to formalize and digitize doorstep recyclable collection by connecting households directly with authorized informal waste pickers (Kabadiwalas) and municipal recyclers.
            </p>
            <p>
              We firmly believe that environmental sustainability must not compromise personal privacy. ScrapMax adheres to the principles of data minimization, transparent processing, purpose limitation, and strict user consent as established under the <strong>Digital Personal Data Protection Act (DPDP Act 2023) of India</strong>.
            </p>
            <div className="p-4 rounded-xl bg-[#E6F4EA] border border-[#A6D5B8] text-xs text-[#0F5730] space-y-1">
              <strong>Core Privacy Pledge:</strong>
              <p>
                We do not sell, rent, or trade your personal information to third-party ad brokers. Your data is used exclusively to facilitate verifiable recyclable pickups, fair payments, and certified municipal recycling metrics.
              </p>
            </div>
          </section>

          {/* 2. Information We Collect */}
          <section id="data-collected" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <Database className="w-5 h-5" />
              <h2>2. Information We Collect</h2>
            </div>
            <p>We collect only the minimum necessary information required to coordinate doorstep pickups and verify recyclable transactions:</p>
            
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">A. Account &amp; Profile Data</h3>
                <p className="text-xs text-gray-600 mt-1">
                  When you register as a Household Citizen or Authorized Collector, we collect your name, email address, mobile phone number, and account role.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">B. Pickup Location &amp; Addresses</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Physical address, apartment/house details, and GPS coordinates selected on our interactive map to allow collectors to navigate to your doorstep.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">C. Recyclable Item Data</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Categories of scrap declared (Paper, Plastic, Metals, E-Waste, Glass), estimated quantities, and optional photos of scrap piles provided by you.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm">D. Civic Swachhata Reports</h3>
                <p className="text-xs text-gray-600 mt-1">
                  If you choose to use the public dump reporting tool, geo-tagged photos and location notes uploaded to alert municipal administrators of illegal waste dumping.
                </p>
              </div>
            </div>
          </section>

          {/* 3. PWA Permissions */}
          <section id="pwa-permissions" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <Smartphone className="w-5 h-5" />
              <h2>3. Device &amp; Progressive Web App (PWA) Permissions</h2>
            </div>
            <p>
              As a Progressive Web App (PWA), ScrapMax can run directly in modern web browsers and be installed on your mobile home screen or desktop. We request the following explicit device permissions:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              
              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-xs">GPS Geolocation</h3>
                <p className="text-xs text-gray-600">
                  Used solely when you tap &quot;Use My Current Location&quot; or track live collector arrival. Never tracked continuously in the background without your active pickup session.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-xs">Camera &amp; Photo Access</h3>
                <p className="text-xs text-gray-600">
                  Used exclusively when taking photos of recyclables or uploading civic dumping grievances. ScrapMax never accesses your personal photo gallery without your explicit selection.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-xs">Push &amp; In-App Notifications</h3>
                <p className="text-xs text-gray-600">
                  Used to deliver real-time pickup status updates (&quot;Collector is 5 mins away&quot;), digital weighing scale receipts, and instant chat messages.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-xs">Offline Cache (Service Worker)</h3>
                <p className="text-xs text-gray-600">
                  Stores essential application shells and draft requests locally in browser IndexedDB/LocalStorage so the app works seamlessly even with weak or zero network connectivity.
                </p>
              </div>

            </div>
          </section>

          {/* 4. How We Use Data */}
          <section id="how-we-use" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <RefreshCw className="w-5 h-5" />
              <h2>4. How We Use Your Information</h2>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#136B3B] shrink-0 mt-0.5" />
                <span><strong>Pickup Dispatch &amp; Route Optimization:</strong> Connecting households to nearby authorized collectors to reduce carbon emissions and response time.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#136B3B] shrink-0 mt-0.5" />
                <span><strong>Transparent Pricing &amp; Receipts:</strong> Calculating fair standardized payout values per kg using CPCB/MPCB market rates.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#136B3B] shrink-0 mt-0.5" />
                <span><strong>Circular Waste Governance:</strong> Aggregating anonymous metrics (total kilograms of PET diverted, CO2 offsets) for municipal sustainability dashboards.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#136B3B] shrink-0 mt-0.5" />
                <span><strong>Security &amp; Fraud Prevention:</strong> Preventing duplicate or fraudulent pickups and verifying digital weighing scale integrity.</span>
              </li>
            </ul>
          </section>

          {/* 5. Payments & Weighing */}
          <section id="payments-weighing" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <Lock className="w-5 h-5" />
              <h2>5. Digital Weighing &amp; UPI DBT Payout Privacy</h2>
            </div>
            <p>
              ScrapMax promotes financial inclusion for informal collectors and citizens through Direct Benefit Transfer (DBT) and digital weighing:
            </p>
            <div className="space-y-3 text-xs sm:text-sm">
              <p>
                &bull; <strong>No Card Details Stored:</strong> ScrapMax does not store credit card numbers, debit card PINs, or bank account passwords on our servers.
              </p>
              <p>
                &bull; <strong>UPI Virtual Payment Address (VPA):</strong> Citizen UPI IDs or QR codes presented during pickup completion are handled through standard NPCI UPI protocol intents.
              </p>
              <p>
                &bull; <strong>Verifiable Digital Receipts:</strong> Itemized weighing breakdown (Net Weight, Tare, Unit Rate, and Timestamp) is cryptographically stored to prevent tampering and provide proof of recycling.
              </p>
            </div>
          </section>

          {/* 6. Chat Privacy */}
          <section id="chat-privacy" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <Eye className="w-5 h-5" />
              <h2>6. Two-Way Coordination Chat Privacy</h2>
            </div>
            <p>
              Our live chat feature allows real-time communication between households and assigned collectors during an active pickup:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] mt-2 shrink-0" />
                <span>Chat channels are strictly isolated and scoped to the unique pickup ID. Unauthorized third parties cannot view or enter conversations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] mt-2 shrink-0" />
                <span>Messages are transmitted using encrypted WebSocket SSL channels and stored in protected Supabase PostgreSQL tables governed by Row Level Security (RLS).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] mt-2 shrink-0" />
                <span>Never share sensitive financial credentials (ATM PINs, OTPs, net banking passwords) in the chat window.</span>
              </li>
            </ul>
          </section>

          {/* 7. Storage & Security */}
          <section id="storage-security" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <Server className="w-5 h-5" />
              <h2>7. Data Storage, Retention &amp; Cloud Security</h2>
            </div>
            <p>
              Your data is stored in enterprise cloud infrastructure adhering to international security standards (ISO 27001, SOC 2) and Indian data localization norms:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-1">Encryption at Rest &amp; Transit</strong>
                <span>All communication uses TLS 1.3 cryptographic protocols. Databases are encrypted with AES-256 bit encryption.</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-1">PostgreSQL Row-Level Security</strong>
                <span>Supabase RLS policies guarantee users can only query and mutate their own authenticated records.</span>
              </div>
            </div>
          </section>

          {/* 8. User Rights */}
          <section id="user-rights" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <CheckCircle2 className="w-5 h-5" />
              <h2>8. Your Rights Under DPDP Act 2023</h2>
            </div>
            <p>You maintain complete control over your personal data on ScrapMax:</p>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <strong className="text-gray-900 min-w-32">&bull; Right to Access:</strong>
                <span>View your complete historical pickup requests, itemized weights, and receipts directly on your Dashboard.</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="text-gray-900 min-w-32">&bull; Right to Portability:</strong>
                <span>Export your addresses, preferences, and account metadata in machine-readable JSON format via <Link href="/household/settings" className="text-[#136B3B] underline font-bold">Settings &gt; Export My Data</Link>.</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="text-gray-900 min-w-32">&bull; Right to Correction:</strong>
                <span>Update or edit your phone number, default address, and preferences anytime in your Profile.</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="text-gray-900 min-w-32">&bull; Right to Erasure:</strong>
                <span>Request permanent account deletion and purging of personal identifying records.</span>
              </div>
            </div>
          </section>

          {/* 9. Grievance Officer */}
          <section id="contact" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-[#136B3B] font-bold text-base border-b border-gray-100 pb-3">
              <FileText className="w-5 h-5" />
              <h2>9. Grievance Redressal &amp; Contact</h2>
            </div>
            <p>
              In accordance with the Information Technology Act 2000 and Digital Personal Data Protection Act 2023, the designated Grievance Officer for ScrapMax is:
            </p>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              <p className="font-bold text-gray-900 text-sm">Grievance &amp; Privacy Officer — ScrapMax</p>
              <p>Email: <a href="mailto:privacy@scrapmax.gov.in" className="text-[#136B3B] font-semibold underline">privacy@scrapmax.gov.in</a></p>
              <p>Support Desk: <a href="mailto:support@scrapmax.in" className="text-[#136B3B] font-semibold underline">support@scrapmax.in</a></p>
              <p>Smart India Hackathon Initiative &bull; Ministry of Environment, Forest &amp; Climate Change (MoEFCC)</p>
              <p>New Delhi, India</p>
            </div>
            <p className="text-xs text-gray-500">
              Grievances are acknowledged within 24 hours and addressed within 15 working days as mandated by Indian statutory guidelines.
            </p>
          </section>

        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 font-semibold text-gray-600">
          <Link href="/" className="hover:text-[#136B3B] transition">Home</Link>
          <span>&bull;</span>
          <Link href="/register?role=household" className="hover:text-[#136B3B] transition">Household Portal</Link>
          <span>&bull;</span>
          <Link href="/register?role=collector" className="hover:text-[#136B3B] transition">Collector Portal</Link>
          <span>&bull;</span>
          <Link href="/stores" className="hover:text-[#136B3B] transition">Store Locator</Link>
          <span>&bull;</span>
          <Link href="/privacy" className="text-[#136B3B] font-bold">Privacy Policy</Link>
          <span>&bull;</span>
          <Link href="/admin/login" className="hover:text-purple-700 transition">Admin Portal</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} ScrapMax — Eco-Waste &amp; Circular Logistics System.</p>
      </footer>
    </div>
  );
}
