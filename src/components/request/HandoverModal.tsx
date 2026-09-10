'use client';

import React, { useState } from 'react';
import { PickupRequest, PaymentDetails, PaymentMethod, VerifiedWasteItem, STANDARD_SCRAP_RATES, WASTE_CATEGORY_LABELS, WasteCategory } from '@/types';
import { X, CheckCircle2, QrCode, Banknote, Scale, ArrowRight, Sparkles, ExternalLink, Printer } from 'lucide-react';

interface HandoverModalProps {
  request: PickupRequest;
  onClose: () => void;
  onCompletePayment: (requestId: string, payment: PaymentDetails) => Promise<void> | void;
}

export default function HandoverModal({ request, onClose, onCompletePayment }: HandoverModalProps) {
  // Initialize verified item rows based on request waste items
  const initialItems: VerifiedWasteItem[] = (request.waste_items && request.waste_items.length > 0
    ? request.waste_items
    : [{ category: 'PAPER' as WasteCategory, approx_weight_kg: request.total_estimated_weight_kg || 5 }]
  ).map((it) => {
    const rate = STANDARD_SCRAP_RATES[it.category] || 15;
    const weight = it.approx_weight_kg || 5;
    return {
      category: it.category,
      verifiedWeightKg: weight,
      ratePerKg: rate,
      subtotal: Math.round(weight * rate),
    };
  });

  const [step, setStep] = useState<'weigh' | 'payment' | 'receipt'>('weigh');
  const [items, setItems] = useState<VerifiedWasteItem[]>(initialItems);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiVpa, setUpiVpa] = useState<string>('kabadiwala@upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedPayment, setCompletedPayment] = useState<PaymentDetails | null>(null);

  // Recalculate weights & total amount
  const totalVerifiedWeight = items.reduce((acc, curr) => acc + curr.verifiedWeightKg, 0);
  const totalPayout = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleWeightChange = (index: number, newWeightStr: string) => {
    const val = parseFloat(newWeightStr) || 0;
    setItems((prev) => {
      const copy = [...prev];
      const rate = copy[index].ratePerKg;
      copy[index] = {
        ...copy[index],
        verifiedWeightKg: val,
        subtotal: Math.round(val * rate),
      };
      return copy;
    });
  };

  const handleRateChange = (index: number, newRateStr: string) => {
    const rateVal = parseFloat(newRateStr) || 0;
    setItems((prev) => {
      const copy = [...prev];
      const weight = copy[index].verifiedWeightKg;
      copy[index] = {
        ...copy[index],
        ratePerKg: rateVal,
        subtotal: Math.round(weight * rateVal),
      };
      return copy;
    });
  };

  const handleConfirmSettlement = async () => {
    setIsProcessing(true);
    const txId = 'TXN-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString().slice(-4);

    const paymentData: PaymentDetails = {
      transactionId: txId,
      method: paymentMethod,
      totalAmount: totalPayout,
      timestamp: new Date().toISOString(),
      items,
      upiVpa: paymentMethod === 'upi' ? upiVpa : undefined,
      cashGivenBy: paymentMethod === 'cash' ? 'Collector (Doorstep Cash Settlement)' : undefined,
    };

    try {
      await onCompletePayment(request.id, paymentData);
      setCompletedPayment(paymentData);
      setStep('receipt');
    } catch (err) {
      console.error('Payment settlement error:', err);
      alert('Error updating payment in database.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Standard UPI URI standard format: upi://pay?pa=...&pn=...&am=...
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(request.household?.full_name || 'Citizen User')}&am=${totalPayout}&cu=INR&tn=${encodeURIComponent(`ScrapMax Pickup #${request.id.slice(0, 6)}`)}`;
  // Free online SVG QR Code generator for quick camera scanning
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiIntentUri)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 my-auto text-[#191C1E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#F8FAF9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#191C1E] leading-tight">
                {step === 'weigh' && 'Doorstep Weight Verification'}
                {step === 'payment' && 'Instant Payment Settlement'}
                {step === 'receipt' && 'Verified Recycling Receipt'}
              </h2>
              <p className="text-[11px] text-[#6B7280]">Request #{request.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close handover modal"
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: STEP 1 - WEIGH & ADJUST */}
        {step === 'weigh' && (
          <div className="p-5 space-y-4">
            <div className="bg-[#EDF7F2] p-3 rounded-2xl border border-[#A6D5B8] flex items-start gap-2.5 text-xs text-[#136B3B]">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Weigh the scrap materials on your portable digital scale and verify or adjust the weights below. The payout updates in real-time.
              </p>
            </div>

            {/* Waste Items Weight Adjustment Table */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Itemized Weighing & Rates
              </label>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const catInfo = WASTE_CATEGORY_LABELS[item.category] || {
                    label: item.category,
                    icon: '📦',
                  };
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-[#F8FAF9] rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl select-none">{catInfo.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-[#191C1E]">{catInfo.label.split('&')[0].trim()}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-0.5">
                            <span>Rate:</span>
                            <input
                              type="number"
                              value={item.ratePerKg}
                              onChange={(e) => handleRateChange(idx, e.target.value)}
                              className="w-14 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-center text-xs font-bold text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                            />
                            <span>₹/kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Weight input and subtotal */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                        <div className="flex items-center border border-gray-300 rounded-xl px-2 py-1 bg-white focus-within:border-[#136B3B]">
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={item.verifiedWeightKg}
                            onChange={(e) => handleWeightChange(idx, e.target.value)}
                            className="w-16 text-center text-xs font-bold text-[#191C1E] focus:outline-none"
                          />
                          <span className="text-[11px] font-semibold text-[#6B7280] ml-1">kg</span>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <span className="text-xs text-[#6B7280] block text-[10px]">Subtotal</span>
                          <span className="text-sm font-extrabold text-[#136B3B]">₹{item.subtotal}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Summary Strip */}
            <div className="p-4 bg-white border-2 border-[#136B3B]/20 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs text-[#6B7280] font-medium">Total Verified Weight</p>
                <p className="text-base font-extrabold text-[#191C1E]">{totalVerifiedWeight.toFixed(1)} kg</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6B7280] font-medium">Total Cash/UPI Payable</p>
                <p className="text-2xl font-extrabold text-[#136B3B]">₹{totalPayout}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('payment')}
              disabled={totalPayout <= 0}
              className="w-full py-3.5 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold rounded-2xl text-sm shadow-sm transition flex items-center justify-center gap-2 touch-feedback disabled:opacity-50"
            >
              <span>Proceed to Payment (₹{totalPayout})</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Modal Body: STEP 2 - PAYMENT SETTLEMENT */}
        {step === 'payment' && (
          <div className="p-5 space-y-5">
            {/* Amount Banner */}
            <div className="text-center py-4 bg-[#F8FAF9] rounded-2xl border border-gray-200 space-y-1">
              <span className="text-xs text-[#6B7280] font-medium">Payout Amount to Citizen</span>
              <div className="text-3xl sm:text-4xl font-black text-[#136B3B]">₹{totalPayout}</div>
              <span className="text-[11px] text-[#526056] font-medium">
                Verified: {totalVerifiedWeight.toFixed(1)} kg recyclables
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#191C1E]">Select Settlement Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition touch-feedback ${
                    paymentMethod === 'upi'
                      ? 'border-[#136B3B] bg-[#E6F4EA] text-[#136B3B] font-bold shadow-xs'
                      : 'border-gray-200 bg-white text-[#526056] hover:bg-gray-50'
                  }`}
                >
                  <QrCode className="w-6 h-6 stroke-[2]" />
                  <span className="text-xs">Instant UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition touch-feedback ${
                    paymentMethod === 'cash'
                      ? 'border-[#136B3B] bg-[#E6F4EA] text-[#136B3B] font-bold shadow-xs'
                      : 'border-gray-200 bg-white text-[#526056] hover:bg-gray-50'
                  }`}
                >
                  <Banknote className="w-6 h-6 stroke-[2]" />
                  <span className="text-xs">Cash on Doorstep</span>
                </button>
              </div>
            </div>

            {/* UPI Details or Cash Confirmation Box */}
            {paymentMethod === 'upi' ? (
              <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-3 text-center">
                <p className="text-xs font-bold text-[#191C1E]">
                  Ask Citizen to Scan QR Code or Open UPI App:
                </p>
                <div className="w-40 h-40 mx-auto p-2 bg-white border-2 border-[#136B3B]/30 rounded-2xl flex items-center justify-center shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Dynamic UPI QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#526056]">
                  <span className="font-semibold">VPA:</span>
                  <input
                    type="text"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                    className="px-2 py-0.5 bg-[#F8FAF9] border border-gray-300 rounded text-center text-xs font-mono"
                  />
                </div>
                <div className="pt-1">
                  <a
                    href={upiIntentUri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#136B3B] hover:underline"
                  >
                    <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-amber-900 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <Banknote className="w-4 h-4" />
                  <span>Physical Cash Handover</span>
                </div>
                <p className="leading-relaxed">
                  Please hand over exactly <strong className="text-black">₹{totalPayout}</strong> in cash to the household owner upon loading the recyclables.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep('weigh')}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#191C1E] font-bold text-xs rounded-2xl transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSettlement}
                disabled={isProcessing}
                className="flex-1 py-3.5 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 touch-feedback disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isProcessing ? 'Settling Payment...' : `Confirm & Issue Receipt (₹${totalPayout})`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body: STEP 3 - DIGITAL HANDOVER RECEIPT */}
        {step === 'receipt' && completedPayment && (
          <div className="p-5 space-y-4">
            <div className="p-4 bg-[#E6F4EA] border border-[#A6D5B8] rounded-2xl flex items-center gap-3 text-[#136B3B]">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-extrabold text-sm">Pickup Completed &amp; Paid!</p>
                <p className="text-xs text-[#2B6B47]">Transaction logged with immutable receipt ID.</p>
              </div>
            </div>

            {/* Receipt Printable Slip View */}
            <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3 text-xs" id="receipt-slip">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-sm text-[#136B3B] uppercase tracking-wider">ScrapMax Circular Receipt</h3>
                  <p className="text-[11px] text-[#6B7280]">Govt. &amp; ULB Compliant Handover Proof</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[11px] font-bold text-[#191C1E]">{completedPayment.transactionId}</span>
                  <p className="text-[10px] text-[#6B7280]">
                    {new Date(completedPayment.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between font-bold text-[11px] text-[#6B7280] pb-1 border-b border-gray-100">
                  <span>Material Category</span>
                  <span>Weight &times; Rate</span>
                  <span>Amount</span>
                </div>
                {completedPayment.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span className="font-semibold text-[#191C1E]">{it.category}</span>
                    <span className="text-[#6B7280]">
                      {it.verifiedWeightKg}kg &times; ₹{it.ratePerKg}
                    </span>
                    <span className="font-bold text-[#136B3B]">₹{it.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-[#191C1E]">Total Settled:</span>
                <span className="font-black text-base text-[#136B3B]">₹{completedPayment.totalAmount}</span>
              </div>

              <div className="p-2.5 bg-[#F8FAF9] rounded-xl flex items-center justify-between text-[11px] text-[#526056]">
                <span>Payment Mode: <strong className="uppercase">{completedPayment.method}</strong></span>
                <span>Status: <strong className="text-[#136B3B]">VERIFIED</strong></span>
              </div>

              {/* Carbon / Environmental Offset Metric */}
              <div className="p-2.5 bg-[#EDF7F2] rounded-xl border border-emerald-100 text-[11px] text-[#1B4332] space-y-1">
                <span className="font-bold flex items-center gap-1">
                  🌱 Environmental Offset Credit:
                </span>
                <p>
                  Diverted ~{totalVerifiedWeight.toFixed(1)}kg from landfill &bull; Avoided ~{(totalVerifiedWeight * 1.8).toFixed(1)}kg CO₂ eq.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-[#191C1E] font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold text-xs rounded-2xl transition shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
