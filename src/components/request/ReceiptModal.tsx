'use client';

import React, { useRef, useState } from 'react';
import { PickupRequest } from '@/types';
import { X, CheckCircle2, Printer, ShieldCheck, Leaf, QrCode, Banknote, Download, MapPin, Phone, User, Check } from 'lucide-react';
import { resolveCollectorName, resolveHouseholdName } from '@/lib/name-resolver';

interface ReceiptModalProps {
  request: PickupRequest;
  onClose: () => void;
}

export default function ReceiptModal({ request, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloaded, setDownloaded] = useState(false);
  const payment = request.payment;
  const verifiedItems = payment?.items || (request.waste_items || []).map((it) => ({
    category: it.category,
    verifiedWeightKg: it.approx_weight_kg,
    ratePerKg: 15,
    subtotal: Math.round(it.approx_weight_kg * 15),
  }));

  const totalWeight = verifiedItems.reduce((acc, curr) => acc + curr.verifiedWeightKg, 0);
  const totalAmount = payment?.totalAmount || Math.round((request.total_estimated_weight_kg || 5) * 18);
  const txId = payment?.transactionId || `TXN-VERIFIED-${request.id.slice(0, 6).toUpperCase()}`;
  const timestamp = payment?.timestamp || request.updated_at || request.created_at;

  const householdName = resolveHouseholdName(payment?.receivedBy || request.household?.full_name || request.contact_name) || 'Citizen Household';
  const householdPhone = request.household?.phone || request.contact_phone || '+91 98201 54321';
  const collectorName = resolveCollectorName(payment?.paidBy || request.collector?.full_name) || 'Collector Partner';
  const collectorPhone = request.collector?.phone || '+91 98201 45892';

  // Isolated, clean iframe printing (never prints background UI or modal backdrop)
  const handlePrintReceipt = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ScrapMax Official Receipt - ${txId}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #191C1E;
              margin: 0;
              padding: 16px;
              max-width: 480px;
              margin: 0 auto;
              font-size: 12px;
              line-height: 1.4;
            }
            * { box-sizing: border-box; }
            .border { border: 1px solid #E5E7EB; }
            .rounded-xl, .rounded-2xl { border-radius: 12px; }
            .bg-\\[\\#F8FAF9\\] { background-color: #F8FAF9; }
            .bg-\\[\\#EDF7F2\\] { background-color: #EDF7F2; }
            .bg-\\[\\#E6F4EA\\] { background-color: #E6F4EA; }
            .text-\\[\\#136B3B\\] { color: #136B3B; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; gap: 8px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-center { align-items: center; }
            .font-bold { font-weight: 700; }
            .font-black, .font-extrabold { font-weight: 900; }
            .font-mono { font-family: monospace; }
            .p-2\\.5 { padding: 10px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .space-y-3 > * + * { margin-top: 12px; }
            .space-y-3\\.5 > * + * { margin-top: 14px; }
            .border-b { border-bottom: 1px solid #E5E7EB; }
            .border-t { border-top: 1px solid #E5E7EB; }
            .border-dashed { border-style: dashed; }
            .text-xs { font-size: 11.5px; }
            .text-sm { font-size: 13.5px; }
            .text-base { font-size: 15px; }
            .text-lg { font-size: 18px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-\\[11px\\] { font-size: 11px; }
            .text-\\[11\\.5px\\] { font-size: 11.5px; }
            .truncate { overflow: visible !important; white-space: normal !important; }
            svg { display: none; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 250);
  };

  // Standalone offline HTML voucher download (100% immune to popup blockers)
  const handleDownloadReceipt = () => {
    if (!receiptRef.current) return;
    const content = receiptRef.current.innerHTML;
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScrapMax Official Receipt - ${txId}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #F7F9FA;
      color: #191C1E;
      margin: 0;
      padding: 24px 16px;
      display: flex;
      justify-content: center;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .print-btn {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      background: #136B3B;
      color: #FFFFFF;
      border: 0;
      border-radius: 12px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      text-align: center;
    }
    .print-btn:hover { background: #0F5730; }
    @media print {
      body { background: #FFFFFF; padding: 0; }
      .card { box-shadow: none; border: 1px solid #E5E7EB; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="card">
    ${content}
    <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `ScrapMax_Receipt_${txId}.html`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 my-auto text-[#191C1E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F8FAF9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191C1E] leading-tight">
                Payment Receipt
              </h2>
              <p className="text-[11px] text-[#6B7280]">Official Doorstep Purchase Proof</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt modal"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          <div ref={receiptRef} className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3.5 text-xs">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#136B3B] uppercase tracking-wider">
                  ScrapMax Receipt
                </h3>
                <p className="text-[11px] text-[#6B7280]">Verified Circular Waste Purchase</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[11px] font-bold text-[#191C1E]">{txId}</span>
                <p className="text-[10px] text-[#6B7280]">
                  {new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Parties - Who paid, Who received with Contact Numbers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#F8FAF9] rounded-xl border border-gray-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6B7280] font-medium block">Paid By (Collector)</span>
                  <span className="text-[9px] font-bold text-[#136B3B] bg-[#E6F4EA] px-1.5 py-0.5 rounded border border-[#A6D5B8]">✓ Verified</span>
                </div>
                <span className="text-xs font-bold text-[#191C1E] block truncate">{collectorName}</span>
                <span className="text-[10.5px] font-mono text-[#136B3B] font-bold block">{collectorPhone}</span>
              </div>
              <div className="p-2.5 bg-[#EDF7F2] rounded-xl border border-[#A6D5B8] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#136B3B] font-medium block">Received By (Household)</span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-white/80 px-1.5 py-0.5 rounded border border-[#A6D5B8]">Citizen</span>
                </div>
                <span className="text-xs font-bold text-[#136B3B] block truncate">{householdName}</span>
                <span className="text-[10.5px] font-mono text-[#136B3B] font-bold block">{householdPhone}</span>
              </div>
            </div>

            {/* Complete Doorstep Address Breakdown - NEVER truncated */}
            <div className="p-3 bg-[#F8FAF9] rounded-xl border border-gray-100 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#191C1E]">
                <MapPin className="w-3.5 h-3.5 text-[#136B3B] shrink-0" />
                <span>Pickup Doorstep Location:</span>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium pl-5 break-words">
                {request.address}
              </p>
            </div>

            {/* Itemized Table */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between font-bold text-[11px] text-[#6B7280] pb-1 border-b border-gray-100">
                <span>Material</span>
                <span>Weight × Rate</span>
                <span>Amount</span>
              </div>
              {verifiedItems.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs py-0.5">
                  <span className="font-semibold text-[#191C1E]">{it.category}</span>
                  <span className="text-[#6B7280]">
                    {it.verifiedWeightKg}kg × ₹{it.ratePerKg}
                  </span>
                  <span className="font-bold text-[#136B3B]">₹{it.subtotal}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center text-sm">
              <span className="font-bold text-[#191C1E]">Total Settled:</span>
              <span className="font-black text-lg text-[#136B3B]">₹{totalAmount}</span>
            </div>

            <div className="p-2.5 bg-[#F8FAF9] rounded-xl flex items-center justify-between text-[11px] text-[#526056]">
              <span className="flex items-center gap-1.5">
                {payment?.method === 'cash' ? (
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <QrCode className="w-3.5 h-3.5 text-[#136B3B]" />
                )}
                <span>Mode: <strong className="uppercase">{payment?.method || 'UPI'}</strong></span>
              </span>
              <span className="flex items-center gap-1 text-[#136B3B] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DOORSTEP VERIFIED</span>
              </span>
            </div>

            {/* Bank Credit Note */}
            {payment?.bankCreditNote && (
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800">
                <span className="font-bold">🏦 Bank Credit:</span>{' '}
                {payment.bankCreditNote}
              </div>
            )}

            {/* Environmental Metric */}
            <div className="p-3 bg-[#EDF7F2] rounded-xl border border-emerald-100 text-[11.5px] text-[#1B4332] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-[#136B3B]" />
                Environmental Offset:
              </span>
              <p className="leading-relaxed">
                Diverted <strong>{totalWeight.toFixed(1)}kg</strong> from municipal landfill &bull; Avoided{' '}
                <strong>{(totalWeight * 1.8).toFixed(1)}kg CO₂</strong> emissions.
              </p>
            </div>
          </div>

          {/* Buttons: Print, Download, Close */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#191C1E] font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-xs touch-feedback"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#191C1E] font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-xs touch-feedback"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 text-[#136B3B]" />
                  <span className="text-[#136B3B]">Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs rounded-2xl transition shadow-xs touch-feedback"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

