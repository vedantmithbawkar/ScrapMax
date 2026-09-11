'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { PickupRequest, PaymentDetails, PaymentMethod, VerifiedWasteItem, STANDARD_SCRAP_RATES, WASTE_CATEGORY_LABELS, WasteCategory } from '@/types';
import { X, CheckCircle2, QrCode, Banknote, Scale, ArrowRight, Sparkles, Download, Printer } from 'lucide-react';

interface HandoverModalProps {
  request: PickupRequest;
  onClose: () => void;
  onCompletePayment: (requestId: string, payment: PaymentDetails) => Promise<void> | void;
}

const UPI_APPS = [
  { name: 'GPay', logo: '/payment-apps/gpay.jpg', scheme: 'tez://upi/pay' },
  { name: 'PhonePe', logo: '/payment-apps/phonepe.jpg', scheme: 'phonepe://pay' },
  { name: 'Paytm', logo: '/payment-apps/paytm.jpg', scheme: 'paytmmp://pay' },
  { name: 'BHIM', logo: '/payment-apps/bhim.jpg', scheme: 'upi://pay' },
];

export default function HandoverModal({ request, onClose, onCompletePayment }: HandoverModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
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
  const [householdUpiId, setHouseholdUpiId] = useState<string>('household@upi');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedPayment, setCompletedPayment] = useState<PaymentDetails | null>(null);

  const totalVerifiedWeight = items.reduce((acc, curr) => acc + curr.verifiedWeightKg, 0);
  const totalPayout = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleWeightChange = (index: number, newWeightStr: string) => {
    const val = parseFloat(newWeightStr) || 0;
    setItems((prev) => {
      const copy = [...prev];
      const rate = copy[index].ratePerKg;
      copy[index] = { ...copy[index], verifiedWeightKg: val, subtotal: Math.round(val * rate) };
      return copy;
    });
  };

  const handleRateChange = (index: number, newRateStr: string) => {
    const rateVal = parseFloat(newRateStr) || 0;
    setItems((prev) => {
      const copy = [...prev];
      const weight = copy[index].verifiedWeightKg;
      copy[index] = { ...copy[index], ratePerKg: rateVal, subtotal: Math.round(weight * rateVal) };
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
      upiVpa: paymentMethod === 'upi' ? householdUpiId : undefined,
      cashGivenBy: paymentMethod === 'cash' ? 'Collector (Doorstep Cash Settlement)' : undefined,
      paidBy: request.collector?.full_name || 'Collector',
      receivedBy: request.household?.full_name || 'Household',
      bankCreditNote: paymentMethod === 'upi'
        ? `₹${totalPayout} will be credited to household's bank account linked to UPI ID: ${householdUpiId}`
        : `₹${totalPayout} paid in cash at doorstep`,
    };

    try {
      await onCompletePayment(request.id, paymentData);
      setCompletedPayment(paymentData);
      // Persist for household notification
      try {
        const notifications = JSON.parse(localStorage.getItem('scrapmax_payment_notifications') || '[]');
        notifications.push({
          id: txId,
          requestId: request.id,
          amount: totalPayout,
          method: paymentMethod,
          timestamp: paymentData.timestamp,
          householdId: request.household_id,
          dismissed: false,
        });
        localStorage.setItem('scrapmax_payment_notifications', JSON.stringify(notifications));
      } catch {}
      setStep('receipt');
    } catch (err) {
      console.error('Payment settlement error:', err);
      alert('Error updating payment in database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const householdName = request.household?.full_name || 'Household User';
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(householdUpiId)}&pn=${encodeURIComponent(householdName)}&am=${totalPayout}&cu=INR&tn=${encodeURIComponent(`ScrapMax Pickup #${request.id.slice(0, 6)}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiIntentUri)}`;

  const buildUpiAppLink = (scheme: string) => {
    return `${scheme}?pa=${encodeURIComponent(householdUpiId)}&pn=${encodeURIComponent(householdName)}&am=${totalPayout}&cu=INR&tn=${encodeURIComponent(`ScrapMax Pickup #${request.id.slice(0, 6)}`)}`;
  };

  const handleDownloadReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>ScrapMax Receipt</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #191C1E; max-width: 480px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 12px; margin-bottom: 12px; }
        .title { font-size: 16px; font-weight: 900; color: #136B3B; text-transform: uppercase; letter-spacing: 1px; }
        .subtitle { font-size: 11px; color: #6B7280; }
        .txid { font-family: monospace; font-size: 11px; font-weight: bold; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
        .row-header { font-weight: bold; color: #6B7280; font-size: 11px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px; margin-bottom: 4px; }
        .total-row { border-top: 2px dashed #E5E7EB; padding-top: 8px; margin-top: 8px; font-size: 15px; }
        .amount { font-weight: 900; color: #136B3B; }
        .info-box { background: #F8FAF9; padding: 10px; border-radius: 8px; font-size: 11px; margin-top: 10px; }
        .credit-note { background: #EDF7F2; padding: 10px; border-radius: 8px; font-size: 11px; margin-top: 10px; color: #1B4332; border: 1px solid #A6D5B8; }
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
                {step === 'weigh' && 'Weigh & Verify Scrap'}
                {step === 'payment' && 'Pay Household for Scrap'}
                {step === 'receipt' && 'Payment Receipt'}
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

        {/* STEP 1 - WEIGH & ADJUST */}
        {step === 'weigh' && (
          <div className="p-5 space-y-4">
            <div className="bg-[#EDF7F2] p-3 rounded-2xl border border-[#A6D5B8] flex items-start gap-2.5 text-xs text-[#136B3B]">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Weigh the scrap on your digital scale. Adjust weights and rates below. You (collector) will pay the household the calculated amount.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Itemized Weighing & Rates
              </label>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const catInfo = WASTE_CATEGORY_LABELS[item.category] || { label: item.category, icon: '📦' };
                  return (
                    <div key={idx} className="p-3 bg-[#F8FAF9] rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl select-none">{catInfo.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-[#191C1E]">{catInfo.label.split('&')[0].trim()}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-0.5">
                            <span>Rate:</span>
                            <input type="number" value={item.ratePerKg} onChange={(e) => handleRateChange(idx, e.target.value)} className="w-14 px-1.5 py-0.5 bg-white border border-gray-300 rounded text-center text-xs font-bold text-[#191C1E] focus:outline-none focus:border-[#136B3B]" />
                            <span>₹/kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                        <div className="flex items-center border border-gray-300 rounded-xl px-2 py-1 bg-white focus-within:border-[#136B3B]">
                          <input type="number" step="0.1" min="0.1" value={item.verifiedWeightKg} onChange={(e) => handleWeightChange(idx, e.target.value)} className="w-16 text-center text-xs font-bold text-[#191C1E] focus:outline-none" />
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

            {/* Total Summary */}
            <div className="p-4 bg-white border-2 border-[#136B3B]/20 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs text-[#6B7280] font-medium">Total Weight</p>
                <p className="text-base font-extrabold text-[#191C1E]">{totalVerifiedWeight.toFixed(1)} kg</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6B7280] font-medium">You Pay Household</p>
                <p className="text-2xl font-extrabold text-[#136B3B]">₹{totalPayout}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep('payment')}
              disabled={totalPayout <= 0}
              className="w-full py-3.5 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold rounded-2xl text-sm shadow-sm transition flex items-center justify-center gap-2 touch-feedback disabled:opacity-50"
            >
              <span>Proceed to Pay Household (₹{totalPayout})</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* STEP 2 - PAYMENT */}
        {step === 'payment' && (
          <div className="p-5 space-y-5">
            {/* Amount Banner */}
            <div className="text-center py-4 bg-gradient-to-b from-[#EDF7F2] to-[#F8FAF9] rounded-2xl border border-[#A6D5B8] space-y-1">
              <span className="text-xs text-[#6B7280] font-medium">You (Collector) Pay →  Household</span>
              <div className="text-3xl sm:text-4xl font-black text-[#136B3B]">₹{totalPayout}</div>
              <span className="text-[11px] text-[#526056] font-medium">
                {totalVerifiedWeight.toFixed(1)} kg verified scrap · Money goes to household&apos;s bank
              </span>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#191C1E]">Payment Method</label>
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
                  <span className="text-xs">UPI / Bank Transfer</span>
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
                  <span className="text-xs">Cash at Doorstep</span>
                </button>
              </div>
            </div>

            {/* UPI Section */}
            {paymentMethod === 'upi' ? (
              <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-4">
                {/* Household UPI ID Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191C1E]">Household&apos;s UPI ID (Receiver)</label>
                  <input
                    type="text"
                    value={householdUpiId}
                    onChange={(e) => setHouseholdUpiId(e.target.value)}
                    placeholder="e.g. name@paytm, name@ybl"
                    className="w-full px-3 py-2.5 bg-[#F8FAF9] border border-gray-300 rounded-xl text-sm font-mono text-center focus:outline-none focus:border-[#136B3B] focus:ring-2 focus:ring-[#136B3B]/20"
                  />
                  <p className="text-[10px] text-[#6B7280] text-center">₹{totalPayout} will be sent to this UPI ID and credited to their bank</p>
                </div>

                {/* QR Code */}
                <div className="text-center">
                  <p className="text-xs font-bold text-[#191C1E] mb-2">Scan QR to Pay</p>
                  <div className="w-36 h-36 mx-auto p-2 bg-white border-2 border-[#136B3B]/30 rounded-2xl flex items-center justify-center shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="UPI QR Code" className="w-full h-full object-contain rounded-lg" />
                  </div>
                </div>

                {/* UPI App Quick Launch Buttons */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-[#191C1E] text-center">Or Pay Using App</p>
                  <div className="grid grid-cols-4 gap-2">
                    {UPI_APPS.map((app) => (
                      <a
                        key={app.name}
                        href={buildUpiAppLink(app.scheme)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-[#136B3B]/30 transition active:scale-95"
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center shadow-xs">
                          <Image src={app.logo} alt={app.name} width={40} height={40} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[10px] font-bold text-[#526056]">{app.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-amber-900 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <Banknote className="w-4 h-4" />
                  <span>Cash Payment to Household</span>
                </div>
                <p className="leading-relaxed">
                  Hand over exactly <strong className="text-black">₹{totalPayout}</strong> in cash to the household. The household is selling scrap — you are buying it.
                </p>
                <p className="text-[10px] text-amber-700">
                  💡 Both parties will receive a digital receipt as proof of payment.
                </p>
              </div>
            )}

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
                <span>{isProcessing ? 'Processing Payment...' : `Confirm Payment ₹${totalPayout}`}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 - RECEIPT */}
        {step === 'receipt' && completedPayment && (
          <div className="p-5 space-y-4">
            <div className="p-4 bg-[#E6F4EA] border border-[#A6D5B8] rounded-2xl flex items-center gap-3 text-[#136B3B]">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-extrabold text-sm">Payment Successful!</p>
                <p className="text-xs text-[#2B6B47]">₹{completedPayment.totalAmount} paid to household. Receipt generated for both parties.</p>
              </div>
            </div>

            {/* Receipt Content */}
            <div ref={receiptRef} className="p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3 text-xs" id="receipt-slip">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-black text-sm text-[#136B3B] uppercase tracking-wider">ScrapMax Receipt</h3>
                  <p className="text-[11px] text-[#6B7280]">Scrap Purchase Payment Proof</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[11px] font-bold text-[#191C1E]">{completedPayment.transactionId}</span>
                  <p className="text-[10px] text-[#6B7280]">
                    {new Date(completedPayment.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#F8FAF9] rounded-xl">
                  <span className="text-[10px] text-[#6B7280] font-medium block">Paid By (Collector)</span>
                  <span className="text-xs font-bold text-[#191C1E]">{completedPayment.paidBy || 'Collector'}</span>
                </div>
                <div className="p-2.5 bg-[#EDF7F2] rounded-xl border border-[#A6D5B8]">
                  <span className="text-[10px] text-[#136B3B] font-medium block">Received By (Household)</span>
                  <span className="text-xs font-bold text-[#136B3B]">{completedPayment.receivedBy || 'Household'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between font-bold text-[11px] text-[#6B7280] pb-1 border-b border-gray-100">
                  <span>Material</span>
                  <span>Weight × Rate</span>
                  <span>Amount</span>
                </div>
                {completedPayment.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-0.5">
                    <span className="font-semibold text-[#191C1E]">{it.category}</span>
                    <span className="text-[#6B7280]">{it.verifiedWeightKg}kg × ₹{it.ratePerKg}</span>
                    <span className="font-bold text-[#136B3B]">₹{it.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-[#191C1E]">Total Paid:</span>
                <span className="font-black text-base text-[#136B3B]">₹{completedPayment.totalAmount}</span>
              </div>

              <div className="p-2.5 bg-[#F8FAF9] rounded-xl flex items-center justify-between text-[11px] text-[#526056]">
                <span>Payment Mode: <strong className="uppercase">{completedPayment.method}</strong></span>
                <span>Status: <strong className="text-[#136B3B]">VERIFIED ✓</strong></span>
              </div>

              {/* Bank Credit Note */}
              {completedPayment.bankCreditNote && (
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-[11px] text-blue-800">
                  <span className="font-bold">🏦 Bank Credit:</span>{' '}
                  {completedPayment.bankCreditNote}
                </div>
              )}

              {/* Environmental Metric */}
              <div className="p-2.5 bg-[#EDF7F2] rounded-xl border border-emerald-100 text-[11px] text-[#1B4332] space-y-1">
                <span className="font-bold flex items-center gap-1">🌱 Environmental Impact:</span>
                <p>Diverted ~{totalVerifiedWeight.toFixed(1)}kg from landfill • Avoided ~{(totalVerifiedWeight * 1.8).toFixed(1)}kg CO₂ eq.</p>
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
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
