'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '@/components/common/Navbar';
import { STANDARD_SCRAP_RATES, WASTE_CATEGORY_LABELS, WasteCategory } from '@/types';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Smartphone,
  IndianRupee,
  Recycle,
  Share2,
  Download,
} from 'lucide-react';

// Demo data — in production, fetch from Supabase using requestId
const DEMO_PAYMENT_DATA = {
  requestId: 'demo-req-001',
  collectorName: 'Raju Kabadiwala',
  collectorUpi: 'rajukabadi@upi',
  wasteItems: [
    { category: 'PAPER' as WasteCategory, verifiedWeightKg: 8.5 },
    { category: 'PLASTIC' as WasteCategory, verifiedWeightKg: 3.2 },
    { category: 'METAL' as WasteCategory, verifiedWeightKg: 1.5 },
  ],
  address: 'Indiranagar 100ft Road, Bangalore',
};

const UPI_APPS = [
  {
    id: 'gpay',
    name: 'Google Pay',
    shortName: 'GPay',
    logo: '/payment-apps/gpay.jpg',
    bgColor: '#ffffff',
    borderColor: '#4285F4',
    textColor: '#3C4043',
    badgeColor: '#4285F4',
    scheme: (upi: string, amount: number, note: string) =>
      `tez://upi/pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
    fallbackScheme: (upi: string, amount: number, note: string) =>
      `gpay://upi/pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    shortName: 'PhonePe',
    logo: '/payment-apps/phonepe.jpg',
    bgColor: '#ffffff',
    borderColor: '#5F259F',
    textColor: '#5F259F',
    badgeColor: '#5F259F',
    scheme: (upi: string, amount: number, note: string) =>
      `phonepe://pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
    fallbackScheme: (upi: string, amount: number, note: string) =>
      `upi://pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    shortName: 'Paytm',
    // Official SVG from pwebassets.paytm.com (Paytm press kit header logo)
    logo: '/payment-apps/paytm.svg',
    bgColor: '#ffffff',
    borderColor: '#002970',
    textColor: '#002970',
    badgeColor: '#00BAF2',
    scheme: (upi: string, amount: number, note: string) =>
      `paytmmp://pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
    fallbackScheme: (upi: string, amount: number, note: string) =>
      `upi://pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
  },
  {
    id: 'bhim',
    name: 'BHIM UPI',
    shortName: 'BHIM',
    // SVG matching NPCI BHIM brand: grey italic letters + tricolor arrows + subtitle
    logo: '/payment-apps/bhim.svg',
    bgColor: '#ffffff',
    borderColor: '#E5E7EB',
    textColor: '#374151',
    badgeColor: '#F97316',
    scheme: (upi: string, amount: number, note: string) =>
      `upi://pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
    fallbackScheme: (upi: string, amount: number, note: string) =>
      `upi://pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`,
  },
];

function buildUpiQrUrl(upi: string, amount: number, note: string) {
  return `upi://pay?pa=${encodeURIComponent(upi)}&pn=ScrapMax&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = (params?.requestId as string) ?? 'demo';

  const [activeTab, setActiveTab] = useState<'apps' | 'qr'>('apps');
  const [copied, setCopied] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const data = { ...DEMO_PAYMENT_DATA, requestId };

  const breakdown = data.wasteItems.map((item) => {
    const rate = STANDARD_SCRAP_RATES[item.category];
    const subtotal = item.verifiedWeightKg * rate;
    return { ...item, rate, subtotal };
  });

  const totalAmount = breakdown.reduce((sum, b) => sum + b.subtotal, 0);
  const totalWeight = data.wasteItems.reduce((s, i) => s + i.verifiedWeightKg, 0);
  const paymentNote = `ScrapMax pickup - ${data.address.split(',')[0]}`;
  const upiQrUrl = buildUpiQrUrl(data.collectorUpi, totalAmount, paymentNote);

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(data.collectorUpi);
    } catch {
      const el = document.createElement('input');
      el.value = data.collectorUpi;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openApp = (app: (typeof UPI_APPS)[0]) => {
<<<<<<< HEAD
    window.location.assign(app.scheme(data.collectorUpi, totalAmount, paymentNote));
=======
    setSelectedApp(app.id);
    const deepLink = app.scheme(data.collectorUpi, totalAmount, paymentNote);

    // Try to open the app via its custom scheme
    // If it fails (app not installed), browser will stay on page
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Use location.href for the deep link — works on mobile browsers
    window.location.href = deepLink;

    // Cleanup iframe after short delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      setSelectedApp(null);
    }, 1500);
>>>>>>> 3901a7b (feat: add track/chat pages, role-aware chat links, real UPI app logos, spinner on payment)
  };

  const confirmPayment = () => {
    setPaymentDone(true);
    setTimeout(() => router.push('/household/history'), 2200);
  };

  if (paymentDone) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex flex-col items-center justify-center font-sans px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#E6F4EA] flex items-center justify-center mx-auto shadow-lg mb-5">
          <CheckCircle2 className="w-11 h-11 text-[#136B3B]" strokeWidth={2.2} />
        </div>
        <h1 className="text-2xl font-extrabold text-[#191C1E] tracking-tight">Payment Complete!</h1>
        <p className="text-sm text-[#526056] mt-2 font-medium">
          &#8377;{totalAmount.toFixed(0)} sent to {data.collectorName}
        </p>
        <div className="mt-4 px-5 py-3 bg-[#EAF5EE] rounded-2xl text-[#136B3B] text-xs font-semibold border border-[#A6D5B8]">
          🌱 You recycled {totalWeight.toFixed(1)} kg of scrap today!
        </div>
        <p className="text-xs text-[#6B7280] mt-5">Redirecting to your activity…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <header className="sticky top-16 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 sm:px-6 py-3.5 max-w-2xl mx-auto w-full flex items-center gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="p-1 -ml-1 text-[#191C1E] hover:opacity-75 transition"
          type="button"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-[#191C1E]">Pay collector</h1>
        <button
          onClick={copyUpi}
          className="ml-auto flex items-center gap-1.5 text-xs font-bold text-[#136B3B] hover:opacity-80 transition"
          type="button"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </header>

      <main className="px-4 sm:px-6 pt-5 space-y-5 max-w-2xl mx-auto w-full">

        {/* Hero amount */}
        <section className="bg-[#136B3B] rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10">
            <p className="text-sm font-medium text-[#A6D5B8] mb-1">Total amount to pay</p>
            <div className="flex items-baseline gap-1">
              <IndianRupee className="w-7 h-7 stroke-[2.5] text-white" />
              <span className="text-5xl font-extrabold tracking-tight leading-none">
                {totalAmount.toFixed(0)}
              </span>
            </div>
            <p className="text-xs text-[#A6D5B8] mt-2 font-medium">
              To: {data.collectorName} &middot; {data.collectorUpi}
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <Recycle className="w-3.5 h-3.5 text-[#A6D5B8]" />
              <span className="text-xs text-[#A6D5B8]">
                {totalWeight.toFixed(1)} kg recyclables collected
              </span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-8 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </section>

        {/* Breakdown */}
        <section className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-[#191C1E]">Payment breakdown</h2>
          <div className="space-y-2.5">
            {breakdown.map((item, idx) => {
              const meta = WASTE_CATEGORY_LABELS[item.category];
              return (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{meta.icon}</span>
                    <div>
                      <p className="font-semibold text-[#191C1E] text-xs leading-tight">{meta.label}</p>
                      <p className="text-[11px] text-[#6B7280]">
                        {item.verifiedWeightKg} kg &times; &#8377;{item.rate}/kg
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-[#136B3B] text-sm">&#8377;{item.subtotal.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-dashed border-gray-200 pt-2 flex items-center justify-between">
            <span className="text-xs font-bold text-[#526056]">Total</span>
            <span className="text-base font-extrabold text-[#191C1E]">&#8377;{totalAmount.toFixed(0)}</span>
          </div>
        </section>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {[
            { id: 'apps' as const, label: 'Pay with App', icon: <Smartphone className="w-4 h-4" /> },
            { id: 'qr' as const, label: 'Scan QR Code', icon: <QrCode className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#191C1E] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#191C1E]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Apps tab */}
        {activeTab === 'apps' && (
          <section className="space-y-4">
            <p className="text-xs font-medium text-[#526056] px-1">
              Tap an app to open and pay. Amount and UPI ID are pre-filled.
            </p>

            {/* Payment app grid — 2 cols on mobile, 4 cols on md+ */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {UPI_APPS.map((app) => {
                const isSelected = selectedApp === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => openApp(app)}
                    type="button"
                    disabled={isSelected}
                    style={{
                      backgroundColor: app.bgColor,
                      borderColor: app.borderColor,
                      color: app.textColor,
                    }}
                    className={`
                      relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2
                      transition-all duration-200 shadow-sm
                      hover:scale-[1.03] hover:shadow-md
                      active:scale-[0.97]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#136B3B]
                      ${isSelected ? 'opacity-70 scale-[0.97]' : ''}
                    `}
                  >
                    {/* App logo — full-width wordmark container */}
                    <div className="w-full h-14 sm:h-16 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm flex-shrink-0 px-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={app.logo}
                        alt={`${app.name} logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Open & pay CTA */}
                    <div
                      className="flex items-center justify-center gap-1 opacity-80"
                      style={{ color: app.textColor }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="text-[11px] font-semibold">Open &amp; pay</span>
                    </div>

                    {/* Selected spinner overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/10">
                        <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* UPI ID copy */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-[#526056]">Or copy UPI ID manually</p>
              <div className="flex items-center gap-2 bg-[#F7F9FA] rounded-xl px-3 py-2.5 border border-gray-200">
                <span className="text-sm font-mono font-semibold text-[#191C1E] flex-1 truncate">
                  {data.collectorUpi}
                </span>
                <button
                  onClick={copyUpi}
                  type="button"
                  className="flex items-center gap-1 text-xs font-bold text-[#136B3B] hover:opacity-75 transition flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* UPI badge strip */}
            <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
              {UPI_APPS.map((app) => (
                <div key={app.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100">
                  <div className="w-4 h-4 rounded-sm overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={app.logo}
                      alt={app.shortName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#526056]">{app.shortName}</span>
                </div>
              ))}
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-[#526056]">& more</span>
            </div>
          </section>
        )}

        {/* QR tab */}
        {activeTab === 'qr' && (
          <section className="space-y-4">
            <p className="text-xs font-medium text-[#526056] px-1">
              Ask the collector to scan this QR code with any UPI app.
            </p>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col items-center gap-4 shadow-sm">
              <div className="p-4 bg-white rounded-2xl border-2 border-[#E6F4EA] shadow-inner flex justify-center">
                <QRCodeSVG
                  value={upiQrUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  fgColor="#136B3B"
                  bgColor="#FFFFFF"
                  id="payment-qr"
                />
              </div>

              <div className="text-center">
                <p className="text-2xl font-extrabold text-[#191C1E]">&#8377;{totalAmount.toFixed(0)}</p>
                <p className="text-xs text-[#526056] font-medium mt-1">
                  {data.collectorName} &middot; {data.collectorUpi}
                </p>
              </div>

              {/* Mini app logos in QR tab */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {UPI_APPS.map((app) => (
                  <div key={app.id} className="w-8 h-8 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={app.logo}
                      alt={app.shortName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-[#6B7280] text-center leading-relaxed max-w-xs">
                This QR contains the pre-filled payment amount. Scan with any UPI app to pay instantly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const svg = document.getElementById('payment-qr');
                if (!svg) return;
                const svgData = new XMLSerializer().serializeToString(svg);
                const blob = new Blob([svgData], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `scrapmax-payment-qr-${requestId}.svg`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#A6D5B8] text-[#136B3B] font-bold text-sm hover:bg-[#EAF5EE] transition"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </button>
          </section>
        )}

        {/* Confirm CTA */}
        <div className="pt-2 space-y-3">
          <button
            onClick={confirmPayment}
            type="button"
            className="w-full py-4 bg-[#136B3B] hover:bg-[#0F5730] active:bg-[#0C4425] text-white font-bold rounded-2xl text-sm tracking-wide shadow-md transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            I&apos;ve completed the payment
          </button>
          <p className="text-[11px] text-center text-[#6B7280] leading-relaxed px-4">
            Tap after completing payment in your UPI app. This marks your pickup as fully paid.
          </p>
        </div>

      </main>
    </div>
  );
}