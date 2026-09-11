'use client';

import React, { useRef } from 'react';
import { PickupRequest } from '@/types';
import { X, CheckCircle2, Printer, ShieldCheck, Leaf, QrCode, Banknote, Download } from 'lucide-react';

interface ReceiptModalProps {
  request: PickupRequest;
  onClose: () => void;
}

export default function ReceiptModal({ request, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
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

  const handleDownloadReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>ScrapMax Receipt - ${txId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #191C1E; max-width: 480px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 12px; margin-bottom: 12px; }
        .title { font-size: 16px; font-weight: 900; color: #136B3B; text-transform: uppercase; letter-spacing: 1px; }
        .subtitle { font-size: 11px; color: #6B7280; }
        .txid { font-family: monospace; font-size: 11px; font-weight: bold; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
        .party-box { background: #F8FAF9; padding: 10px; border-radius: 8px; }
        .party-box.receiver { background: #EDF7F2; border: 1px solid #A6D5B8; }
        .party-label { font-size: 10px; color: #6B7280; }
        .party-name { font-size: 12px; font-weight: bold; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .row-header { font-weight: bold; color: #6B7280; font-size: 11px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; margin-bottom: 4px; }
        .total-row { border-top: 2px dashed #E5E7EB; padding-top: 8px; margin-top: 8px; font-size: 15px; }
        .amount { font-weight: 900; color: #136B3B; }
        .info-box { background: #F8FAF9; padding: 10px; border-radius: 8px; font-size: 11px; margin-top: 10px; }
        .credit-note { background: #EFF6FF; padding: 10px; border-radius: 8px; font-size: 11px; margin-top: 10px; color: #1E40AF; border: 1px solid #BFDBFE; }
        .env { background: #EDF7F2; padding: 10px; border-radius: 8px; font-size: 11px; margin-top: 10px; color: #1B4332; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${receiptRef.current.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191C1E] leading-tight">
                Payment Receipt
              </h2>
              <p className="text-[11px] text-[#6B7280]">Scrap Purchase Proof</p>
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
        <div className="p-5 space-y-4">
          <div ref={receiptRef} className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3.5 text-xs">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-[#136B3B] uppercase tracking-wider">
                  ScrapMax Receipt
                </h3>
                <p className="text-[11px] text-[#6B7280]">Verified Scrap Purchase</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[11px] font-bold text-[#191C1E]">{txId}</span>
                <p className="text-[10px] text-[#6B7280]">
                  {new Date(timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Parties - Who paid, Who received */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-[#F8FAF9] rounded-xl">
                <span className="text-[10px] text-[#6B7280] font-medium block">Paid By (Collector)</span>
                <span className="text-xs font-bold text-[#191C1E]">
                  {payment?.paidBy || request.collector?.full_name || 'Collector'}
                </span>
              </div>
              <div className="p-2.5 bg-[#EDF7F2] rounded-xl border border-[#A6D5B8]">
                <span className="text-[10px] text-[#136B3B] font-medium block">Received By (Household)</span>
                <span className="text-xs font-bold text-[#136B3B]">
                  {payment?.receivedBy || request.household?.full_name || 'Household'}
                </span>
              </div>
            </div>

            {/* Address */}
            <div className="p-2.5 bg-[#F8FAF9] rounded-xl text-[11.5px] text-[#526056] space-y-0.5">
              <span className="font-bold text-[#191C1E]">Pickup Location:</span>
              <p className="truncate">{request.address}</p>
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
              <span className="font-bold text-[#191C1E]">Total Paid:</span>
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
                <span>VERIFIED</span>
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
                Environmental Impact:
              </span>
              <p className="leading-relaxed">
                Diverted <strong>{totalWeight.toFixed(1)}kg</strong> from landfill &bull; Avoided{' '}
                <strong>{(totalWeight * 1.8).toFixed(1)}kg CO₂</strong> emissions.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#191C1E] font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#191C1E] font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs rounded-2xl transition shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
