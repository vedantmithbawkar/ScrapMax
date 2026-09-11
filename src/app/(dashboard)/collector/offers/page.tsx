'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { CollectorOffer, RecyclerTransaction } from '@/types';
import {
  getCollectorOffers,
  getRecyclerTransactions,
  confirmHandover,
} from '@/lib/recycler-service';
import {
  Inbox,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Sparkles,
  QrCode,
  Scale,
  CreditCard,
  Send,
} from 'lucide-react';

export default function CollectorOffersTrackerPage() {
  const [offers, setOffers] = useState<CollectorOffer[]>([]);
  const [transactions, setTransactions] = useState<RecyclerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [off, txs] = await Promise.all([
        getCollectorOffers('coll-c102'),
        getRecyclerTransactions('coll-c102'),
      ]);
      setOffers(off);
      setTransactions(txs);
    } catch (err) {
      console.warn('Load collector offers notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCollectorConfirmHandover = async (txId: string) => {
    try {
      await confirmHandover(txId, 'collector');
      setToastMsg('Handover confirmed! Your payout and digital receipt have been finalized.');
      setTimeout(() => setToastMsg(''), 4000);
      loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error confirming handover');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Breadcrumb */}
        <div className="space-y-1">
          <Link
            href="/collector"
            className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Collector Portal</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E]">
                My Scrap Marketplace Offers
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Track recycler responses, scheduled pickups, scale weight slips, and custody handover
              </p>
            </div>
            <Link
              href="/collector/find-buyers"
              className="self-start sm:self-auto px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-full shadow-xs transition touch-feedback flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Offer Scrap to Buyers</span>
            </Link>
          </div>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* SECTION 1: Active Transactions & Handover Pending */}
        {transactions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#191C1E]">
              Accepted Transactions &amp; Handover ({transactions.length})
            </h2>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#191C1E]">
                          {tx.agreed_quantity_kg} KG {tx.material}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {tx.status === 'completed' ? '✓ Transaction Completed' : tx.pickup_status}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Buyer: <strong>{tx.recycler?.company_name || 'Verified Recycler Partner'}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-[#136B3B]">
                        Rate: ₹{tx.agreed_price_per_kg} / KG
                      </span>
                      <p className="text-sm font-black text-[#191C1E]">
                        {tx.final_amount
                          ? `Final Payout: ₹${tx.final_amount.toLocaleString('en-IN')}`
                          : `Est. Payout: ₹${(tx.agreed_quantity_kg * tx.agreed_price_per_kg).toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  </div>

                  {/* Weight & Payment Telemetry */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#F8FAF9] rounded-2xl text-xs">
                    <div>
                      <span className="text-[#6B7280] block text-[11px]">Agreed Quantity:</span>
                      <span className="font-bold text-[#191C1E]">{tx.agreed_quantity_kg} KG</span>
                    </div>

                    <div>
                      <span className="text-[#6B7280] block text-[11px]">Confirmed Scale Weight:</span>
                      <span className={`font-bold ${tx.actual_weight_kg ? 'text-emerald-700' : 'text-[#6B7280]'}`}>
                        {tx.actual_weight_kg ? `${tx.actual_weight_kg} KG (Scale Confirmed)` : 'Pending Scale Reading'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#6B7280] block text-[11px]">Payment Status:</span>
                      <span className={`font-bold ${tx.payment_status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {tx.payment_status === 'Paid' ? `Settled via ${tx.payment_method}` : 'Pending Settlement'}
                      </span>
                    </div>
                  </div>

                  {/* Handover Action */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-[#6B7280] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#136B3B]" />
                      <span>{tx.pickup_method} · Code: {tx.traceability_code || tx.id}</span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!tx.collector_handover_confirmed && tx.status !== 'completed' && (
                        <button
                          onClick={() => handleCollectorConfirmHandover(tx.id)}
                          className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition touch-feedback flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Handover</span>
                        </button>
                      )}

                      {tx.collector_handover_confirmed && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Handover Confirmed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: Submitted Offers Feed */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-[#191C1E]">
            All Submitted Offers ({offers.length})
          </h2>

          {loading ? (
            <div className="py-20 text-center text-xs text-[#6B7280]">Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-[#191C1E]">No scrap offers submitted yet</h3>
              <p className="text-xs text-[#6B7280]">
                Use &quot;Find Buyers&quot; to match your scrap against active recycler requirements and submit bids.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#191C1E]">
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
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Offered: <strong>{offer.quantity_offered_kg} KG</strong> @ ₹{offer.offered_price_per_kg}/KG
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-sm font-black text-[#136B3B]">
                        Est. ₹{offer.estimated_value.toLocaleString('en-IN')}
                      </span>
                      <p className="text-[11px] text-[#6B7280]">
                        Submitted {new Date(offer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {offer.status === 'counter_offered' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 space-y-1">
                      <p className="font-bold">Recycler Proposed Counter Offer:</p>
                      <p>
                        Rate: <strong>₹{offer.counter_price_per_kg || offer.offered_price_per_kg}/KG</strong> for <strong>{offer.counter_quantity_kg || offer.quantity_offered_kg} KG</strong>
                      </p>
                      {offer.counter_notes && <p className="italic text-[11px]">&quot;{offer.counter_notes}&quot;</p>}
                    </div>
                  )}

                  {offer.status === 'rejected' && offer.rejection_reason && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl">
                      Rejection Reason: {offer.rejection_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      <BottomNav role="collector" />
    </div>
  );
}
