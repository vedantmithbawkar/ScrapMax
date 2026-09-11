'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { CollectorOffer, OfferStatus } from '@/types';
import { getIncomingOffers, respondToOffer } from '@/lib/recycler-service';
import {
  Inbox,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  MapPin,
  Scale,
  Sparkles,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

export default function RecyclerIncomingOffersPage() {
  const [offers, setOffers] = useState<CollectorOffer[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Modals state
  const [rejectingOffer, setRejectingOffer] = useState<CollectorOffer | null>(null);
  const [rejectReason, setRejectReason] = useState('Requirement already fulfilled');
  const [customRejectNote, setCustomRejectNote] = useState('');

  const [counteringOffer, setCounteringOffer] = useState<CollectorOffer | null>(null);
  const [counterPrice, setCounterPrice] = useState<number | ''>('');
  const [counterQuantity, setCounterQuantity] = useState<number | ''>('');
  const [counterNotes, setCounterNotes] = useState('');

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await getIncomingOffers('rec-001');
      setOffers(data);
    } catch (err) {
      console.warn('Load incoming offers notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleAccept = async (offer: CollectorOffer) => {
    try {
      await respondToOffer(offer.id, 'accept');
      setActionNotice(`Offer from ${offer.collector?.full_name || 'Collector'} accepted! Pickup is now scheduled.`);
      setTimeout(() => setActionNotice(''), 4000);
      loadOffers();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error accepting offer');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOffer) return;
    try {
      const reason = rejectReason === 'Other' && customRejectNote ? customRejectNote : rejectReason;
      await respondToOffer(rejectingOffer.id, 'reject', { rejection_reason: reason });
      setActionNotice('Offer rejected.');
      setTimeout(() => setActionNotice(''), 4000);
      setRejectingOffer(null);
      loadOffers();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error rejecting offer');
    }
  };

  const handleConfirmCounter = async () => {
    if (!counteringOffer) return;
    try {
      await respondToOffer(counteringOffer.id, 'counter', {
        counter_price: counterPrice ? Number(counterPrice) : undefined,
        counter_quantity: counterQuantity ? Number(counterQuantity) : undefined,
        counter_notes: counterNotes,
      });
      setActionNotice('Counter offer submitted to collector!');
      setTimeout(() => setActionNotice(''), 4000);
      setCounteringOffer(null);
      loadOffers();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error sending counter offer');
    }
  };

  const filteredOffers = offers.filter((o) => {
    if (activeTab === 'all') return true;
    return o.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Breadcrumb */}
        <div className="space-y-1">
          <Link
            href="/recycler"
            className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E]">
                Incoming Scrap Offers
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Review collector scrap submissions, negotiate counter rates, or accept into bulk lots
              </p>
            </div>
            <Link
              href="/recycler/pickups"
              className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 text-[#191C1E] text-xs font-bold rounded-full shadow-xs hover:bg-gray-50 transition"
            >
              View Active Pickups
            </Link>
          </div>
        </div>

        {actionNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Offers', count: offers.length },
            { id: 'pending', label: 'Pending Review', count: offers.filter((o) => o.status === 'pending').length },
            { id: 'accepted', label: 'Accepted', count: offers.filter((o) => o.status === 'accepted').length },
            { id: 'counter_offered', label: 'Counter-Offered', count: offers.filter((o) => o.status === 'counter_offered').length },
            { id: 'rejected', label: 'Rejected', count: offers.filter((o) => o.status === 'rejected').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#EAE6F8] text-[#191C1E] shadow-xs'
                  : 'text-[#6B7280] hover:bg-white hover:text-[#191C1E]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-[#191C1E] border border-gray-200">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Offers Feed */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#6B7280]">Loading incoming offers...</div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#191C1E]">No offers in this view</h3>
            <p className="text-xs text-[#6B7280]">
              Once collectors submit scrap against your active requirements, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-4 hover:border-gray-200 transition"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#191C1E]">
                        {offer.requirement?.material || 'Scrap Material'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          offer.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-900'
                            : offer.status === 'pending'
                            ? 'bg-amber-100 text-amber-900'
                            : offer.status === 'counter_offered'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {offer.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      Collector: <strong>{offer.collector?.full_name || 'Verified Kabadiwala'}</strong> · Submitted {new Date(offer.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xl font-black text-[#136B3B]">
                      {offer.quantity_offered_kg} KG
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      @ ₹{offer.offered_price_per_kg} / KG (Value: ₹{offer.estimated_value.toLocaleString('en-IN')})
                    </p>
                  </div>
                </div>

                {/* Message or notes */}
                {offer.message && (
                  <p className="text-xs text-[#526056] bg-[#F8FAF9] p-3 rounded-xl italic">
                    &quot;{offer.message}&quot;
                  </p>
                )}

                {/* Rejection / Counter Info */}
                {offer.status === 'rejected' && offer.rejection_reason && (
                  <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-800">
                    <strong>Rejection Reason:</strong> {offer.rejection_reason}
                  </div>
                )}

                {offer.status === 'counter_offered' && (
                  <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900">
                    <strong>Proposed Counter:</strong> ₹{offer.counter_price_per_kg || offer.offered_price_per_kg}/KG for {offer.counter_quantity_kg || offer.quantity_offered_kg} KG.
                    {offer.counter_notes && <span className="block mt-0.5 text-blue-800 italic">&quot;{offer.counter_notes}&quot;</span>}
                  </div>
                )}

                {/* Action Bar */}
                {offer.status === 'pending' && (
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setRejectingOffer(offer)}
                      className="px-4 py-2 bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 text-xs font-bold rounded-xl transition"
                    >
                      Reject with Reason
                    </button>
                    <button
                      onClick={() => {
                        setCounteringOffer(offer);
                        setCounterPrice(offer.offered_price_per_kg);
                        setCounterQuantity(offer.quantity_offered_kg);
                      }}
                      className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition shadow-xs"
                    >
                      Propose Counter Offer
                    </button>
                    <button
                      onClick={() => handleAccept(offer)}
                      className="px-5 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition touch-feedback"
                    >
                      Accept Offer &amp; Schedule
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>

      {/* REJECT OFFER MODAL */}
      {rejectingOffer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#191C1E]">Reject Collector Offer</h3>
              <button onClick={() => setRejectingOffer(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-[#6B7280]">
              Select a reason for declining the offer from {rejectingOffer.collector?.full_name || 'Collector'}:
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
            >
              <option value="Material quality not meeting specs">Material quality not meeting specs</option>
              <option value="Quantity below minimum viable batch">Quantity below minimum viable batch</option>
              <option value="Location outside collection logistics zone">Location outside collection logistics zone</option>
              <option value="Requirement already fulfilled">Requirement already fulfilled</option>
              <option value="Other">Other reason</option>
            </select>

            {rejectReason === 'Other' && (
              <textarea
                rows={2}
                value={customRejectNote}
                onChange={(e) => setCustomRejectNote(e.target.value)}
                placeholder="Specify rejection details..."
                className="w-full p-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingOffer(null)}
                className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTER OFFER MODAL */}
      {counteringOffer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#191C1E]">Propose Counter Offer</h3>
              <button onClick={() => setCounteringOffer(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-[#6B7280]">
              Collector offered {counteringOffer.quantity_offered_kg} KG @ ₹{counteringOffer.offered_price_per_kg}/KG. Adjust pricing or quantity:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#191C1E] mb-1">Counter Price (₹/KG)</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 140"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191C1E] mb-1">Accepted Quantity (KG)</label>
                <input
                  type="number"
                  value={counterQuantity}
                  onChange={(e) => setCounterQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Message to Collector (Optional)</label>
              <textarea
                rows={2}
                value={counterNotes}
                onChange={(e) => setCounterNotes(e.target.value)}
                placeholder="e.g. Can accept at ₹140/KG if unstripped wiring is sorted."
                className="w-full p-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCounteringOffer(null)}
                className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCounter}
                className="px-4 py-2 bg-[#136B3B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0F5730] flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Counter Offer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="recycler" />
    </div>
  );
}
