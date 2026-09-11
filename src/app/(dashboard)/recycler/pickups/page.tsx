'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { RecyclerTransaction, RecyclerPickupStatus } from '@/types';
import {
  getRecyclerTransactions,
  confirmActualWeight,
  recordRecyclerPayment,
  confirmHandover,
} from '@/lib/recycler-service';
import {
  Truck,
  ArrowLeft,
  Scale,
  CreditCard,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  AlertCircle,
  X,
  FileCheck2,
} from 'lucide-react';

export default function RecyclerPickupsPage() {
  const [transactions, setTransactions] = useState<RecyclerTransaction[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed'>('active');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  // Weight Verification Modal
  const [measuringTx, setMeasuringTx] = useState<RecyclerTransaction | null>(null);
  const [scaleWeight, setScaleWeight] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');

  const loadTxs = async () => {
    setLoading(true);
    try {
      const data = await getRecyclerTransactions('rec-001');
      setTransactions(data);
    } catch (err) {
      console.warn('Load pickups notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTxs();
  }, []);

  const handleSaveScaleWeight = async () => {
    if (!measuringTx || !scaleWeight || Number(scaleWeight) <= 0) return;
    try {
      const confirmed = await confirmActualWeight(measuringTx.id, Number(scaleWeight));
      await recordRecyclerPayment(measuringTx.id, paymentMethod);
      setToastMsg(`Actual weight ${scaleWeight} KG confirmed! Final settlement value calculated to ₹${confirmed.final_amount}.`);
      setTimeout(() => setToastMsg(''), 5000);
      setMeasuringTx(null);
      loadTxs();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error recording weight');
    }
  };

  const handleConfirmReceipt = async (tx: RecyclerTransaction) => {
    try {
      await confirmHandover(tx.id, 'recycler');
      setToastMsg(`Facility custody receipt confirmed for ${tx.material}!`);
      setTimeout(() => setToastMsg(''), 4000);
      loadTxs();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error confirming receipt');
    }
  };

  const filtered = transactions.filter((t) => {
    if (filterTab === 'all') return true;
    if (filterTab === 'active') return t.status === 'in_progress';
    return t.status === 'completed';
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
                Pickups &amp; Weight Verification
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Electronic scale telemetry, actual weight verification, and custody handover confirmation
              </p>
            </div>
            <Link
              href="/recycler/traceability"
              className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 text-[#136B3B] text-xs font-bold rounded-full shadow-xs hover:bg-emerald-50 transition flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Traceability Records</span>
            </Link>
          </div>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setFilterTab('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === 'active'
                ? 'bg-[#EAE6F8] text-[#191C1E] shadow-xs'
                : 'text-[#6B7280] hover:bg-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active &amp; In-Transit ({transactions.filter((t) => t.status === 'in_progress').length})</span>
          </button>

          <button
            onClick={() => setFilterTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-[#EAE6F8] text-[#191C1E] shadow-xs'
                : 'text-[#6B7280] hover:bg-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed &amp; Ingested ({transactions.filter((t) => t.status === 'completed').length})</span>
          </button>

          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filterTab === 'all'
                ? 'bg-[#EAE6F8] text-[#191C1E] shadow-xs'
                : 'text-[#6B7280] hover:bg-white'
            }`}
          >
            All ({transactions.length})
          </button>
        </div>

        {/* Pickups List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#6B7280]">Loading pickups...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
            <Truck className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#191C1E]">No pickups in this status</h3>
            <p className="text-xs text-[#6B7280]">
              Pickups scheduled from accepted collector offers will appear here for scale measurement.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[#191C1E]">
                        {tx.agreed_quantity_kg} KG {tx.material}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-purple-100 text-purple-900'
                        }`}
                      >
                        {tx.status === 'completed' ? '✓ Ingested & Settled' : tx.pickup_status}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Collector: <strong>{tx.collector?.full_name || 'Verified Kabadiwala'}</strong> · Sourced from {tx.pickup_address || 'Regional Area'}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs font-bold text-[#136B3B]">
                      Agreed Rate: ₹{tx.agreed_price_per_kg} / KG
                    </span>
                    <p className="text-xs text-[#6B7280]">
                      Est. Total: ₹{Math.round(tx.agreed_quantity_kg * tx.agreed_price_per_kg)}
                    </p>
                  </div>
                </div>

                {/* Weight telemetry & confirmed values */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#F8FAF9] rounded-2xl text-xs">
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Agreed Estimate:</span>
                    <span className="font-bold text-[#191C1E]">{tx.agreed_quantity_kg} KG</span>
                  </div>

                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Actual Scale Weight:</span>
                    <span className={`font-bold ${tx.actual_weight_kg ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {tx.actual_weight_kg ? `${tx.actual_weight_kg} KG (Scale Confirmed)` : 'Pending Weighing'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Final Settlement Amount:</span>
                    <span className="font-bold text-[#191C1E]">
                      {tx.final_amount ? `₹${tx.final_amount} (${tx.payment_method || 'UPI'})` : 'Calculated after weight'}
                    </span>
                  </div>
                </div>

                {/* Handover state & confirmation buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-[#6B7280] flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      {tx.collector_handover_confirmed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span>Collector Handover: {tx.collector_handover_confirmed ? 'Confirmed' : 'Pending'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {tx.recycler_receipt_confirmed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span>Recycler Receipt: {tx.recycler_receipt_confirmed ? 'Confirmed' : 'Pending'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!tx.actual_weight_kg && (
                      <button
                        onClick={() => {
                          setMeasuringTx(tx);
                          setScaleWeight(tx.agreed_quantity_kg);
                        }}
                        className="px-4 py-2 bg-white hover:bg-emerald-50 text-[#136B3B] border border-[#A6D5B8] text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Record Scale Weight</span>
                      </button>
                    )}

                    {tx.actual_weight_kg && !tx.recycler_receipt_confirmed && (
                      <button
                        onClick={() => handleConfirmReceipt(tx)}
                        className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition touch-feedback flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Facility Receipt</span>
                      </button>
                    )}

                    <Link
                      href="/recycler/traceability"
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#191C1E] text-xs font-bold rounded-xl transition flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#136B3B]" />
                      <span>Trace</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* SCALE WEIGHT RECORDING MODAL */}
      {measuringTx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#191C1E] flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#136B3B]" />
                <span>Weighing Scale Telemetry</span>
              </h3>
              <button onClick={() => setMeasuringTx(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-xs text-[#6B7280]">
              Record the physical calibrated scale reading for <strong>{measuringTx.material}</strong> from collector <strong>{measuringTx.collector?.full_name || 'Collector'}</strong>:
            </p>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Actual Net Weight (KG)</label>
              <input
                type="number"
                required
                step="0.1"
                min="0.1"
                value={scaleWeight}
                onChange={(e) => setScaleWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="e.g. 30.8"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-bold text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">
                Agreed initial estimate was {measuringTx.agreed_quantity_kg} KG.
              </span>
            </div>

            {scaleWeight && Number(scaleWeight) > 0 && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950">
                <div className="flex justify-between font-semibold">
                  <span>Actual Weight:</span>
                  <span>{scaleWeight} KG</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Agreed Rate:</span>
                  <span>₹{measuringTx.agreed_price_per_kg} / KG</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-emerald-200 text-[#136B3B]">
                  <span>Calculated Final Settlement:</span>
                  <span>₹{Math.round(Number(scaleWeight) * measuringTx.agreed_price_per_kg).toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Settlement Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'UPI' | 'CASH' | 'BANK_TRANSFER')}
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
              >
                <option value="UPI">Instant UPI Transfer (Demo)</option>
                <option value="CASH">Spot Cash Settlement (Demo)</option>
                <option value="BANK_TRANSFER">Bank IMPS / NEFT (Demo)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMeasuringTx(null)}
                className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScaleWeight}
                disabled={!scaleWeight || Number(scaleWeight) <= 0}
                className="px-5 py-2 bg-[#136B3B] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0F5730] disabled:opacity-50"
              >
                Confirm Actual Weight
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="recycler" />
    </div>
  );
}
