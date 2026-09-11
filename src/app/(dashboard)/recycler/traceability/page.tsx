'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { RecyclerTransaction, TraceabilityRecord } from '@/types';
import { getRecyclerTransactions, getTraceabilityRecord } from '@/lib/recycler-service';
import {
  QrCode,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Scale,
  CreditCard,
  Factory,
  Leaf,
  ShieldCheck,
  Download,
  Share2,
} from 'lucide-react';

export default function CircularTraceabilityPage() {
  const [transactions, setTransactions] = useState<RecyclerTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<RecyclerTransaction | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const txs = await getRecyclerTransactions('rec-001');
        setTransactions(txs);
        if (txs.length > 0) {
          setSelectedTx(txs[0]);
        }
      } catch (err) {
        console.warn('Traceability load notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeRecord: TraceabilityRecord | null = selectedTx ? getTraceabilityRecord(selectedTx) : null;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E] flex items-center gap-2">
                <span>Circular Traceability Protocol</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Verifiable chain-of-custody tracking from local scrap collector to industrial circular batch output
              </p>
            </div>
            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Zero-Landfill Verified Audit</span>
            </span>
          </div>
        </div>

        {/* Search & Transaction Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Transaction List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Audited Batches ({transactions.length})
            </h2>

            {transactions.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-gray-100 text-xs text-[#6B7280] text-center">
                No circular records generated yet.
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isSelected = selectedTx?.id === tx.id;
                  return (
                    <button
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className={`w-full p-4 rounded-2xl border text-left transition ${
                        isSelected
                          ? 'border-[#136B3B] bg-[#E6F4EA] shadow-xs'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#191C1E]">
                          {tx.traceability_code || `TRC-${tx.id.toUpperCase()}`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            tx.status === 'completed'
                              ? 'bg-emerald-200/80 text-emerald-950'
                              : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {tx.status === 'completed' ? 'Ingested' : 'In Transit'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#526056] mt-1">
                        {tx.actual_weight_kg || tx.agreed_quantity_kg} KG · {tx.material}
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        Collector: {tx.collector?.full_name || 'Verified Collector'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Visual Chain of Custody Step-by-Step */}
          <div className="lg:col-span-2 space-y-4">
            {activeRecord ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                
                {/* Record Header & Certificate ID */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#136B3B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Digital Audit Record
                    </span>
                    <h3 className="text-xl font-black text-[#191C1E]">
                      {activeRecord.traceability_code}
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Material: <strong>{activeRecord.material}</strong> · Verified Net Weight:{' '}
                      <strong>{activeRecord.confirmed_weight_kg} KG</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="p-3 bg-[#F8FAF9] border border-gray-200 rounded-2xl flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-[#191C1E]" />
                    </div>
                  </div>
                </div>

                {/* Circular Impact Metrics Pill */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Carbon Offset</span>
                    <span className="font-extrabold text-sm text-[#136B3B]">
                      ~{activeRecord.emissions_prevented_co2_kg} KG CO₂ Eq.
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Destination Facility</span>
                    <span className="font-extrabold text-xs text-[#191C1E] truncate block">
                      {activeRecord.destination_facility.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Batch Serialization</span>
                    <span className="font-mono text-[11px] font-bold text-emerald-900 block">
                      {activeRecord.circular_recycling_batch}
                    </span>
                  </div>
                </div>

                {/* Visual Step-by-Step Chain of Custody */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    Chain of Custody Audit Trail
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                    {activeRecord.steps.map((step) => {
                      const isCompleted = step.status === 'completed';
                      return (
                        <div key={step.step} className="relative space-y-1">
                          {/* Step Marker Dot */}
                          <div
                            className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isCompleted
                                ? 'bg-[#136B3B] text-white ring-4 ring-emerald-50'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {isCompleted ? '✓' : step.step}
                          </div>

                          <div className="flex items-baseline justify-between text-xs gap-2">
                            <span className="font-bold text-[#191C1E]">
                              Step {step.step}: {step.title}
                            </span>
                            <span className="text-[10px] text-[#6B7280]">
                              {new Date(step.timestamp).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-xs text-[#526056] leading-relaxed">
                            {step.description}
                          </p>

                          <span className="inline-block text-[10px] text-[#136B3B] font-semibold bg-[#E6F4EA] px-2 py-0.5 rounded-md mt-0.5">
                            Signed by: {step.actor}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 text-xs text-[#6B7280]">
                Select a transaction from the left panel to inspect its circular traceability record.
              </div>
            )}
          </div>

        </div>

      </main>

      <BottomNav role="recycler" />
    </div>
  );
}
