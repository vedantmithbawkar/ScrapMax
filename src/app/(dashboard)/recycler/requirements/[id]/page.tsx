'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import {
  RecyclerRequirement,
  CollectorOffer,
  RecyclerTransaction,
} from '@/types';
import {
  getRequirementById,
  getIncomingOffers,
  getRecyclerTransactions,
  respondToOffer,
} from '@/lib/recycler-service';
import {
  ArrowLeft,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Truck,
  Inbox,
  User,
  ShieldCheck,
  Scale,
  Calendar,
  Layers,
} from 'lucide-react';

export default function RequirementDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [requirement, setRequirement] = useState<RecyclerRequirement | null>(null);
  const [offers, setOffers] = useState<CollectorOffer[]>([]);
  const [transactions, setTransactions] = useState<RecyclerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [req, allOffers, allTxs] = await Promise.all([
        getRequirementById(id),
        getIncomingOffers(),
        getRecyclerTransactions(),
      ]);
      setRequirement(req);
      setOffers(allOffers.filter((o) => o.requirement_id === id));
      setTransactions(allTxs.filter((t) => t.requirement_id === id));
    } catch (err) {
      console.warn('Load requirement detail notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await respondToOffer(offerId, 'accept');
      setActionSuccess('Offer accepted! Allocated towards requirement target.');
      setTimeout(() => setActionSuccess(''), 4000);
      loadData();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error accepting offer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
        <Navbar />
        <div className="p-20 text-center text-xs text-[#6B7280]">Loading requirement details...</div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
        <Navbar />
        <div className="p-20 text-center space-y-3">
          <p className="text-sm font-bold text-rose-700">Requirement not found.</p>
          <Link href="/recycler/requirements" className="text-xs font-bold text-[#136B3B] underline">
            Return to Demands
          </Link>
        </div>
      </div>
    );
  }

  // Calculate dynamic multi-supplier aggregation
  const fulfilledFromTxs = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.actual_weight_kg || t.agreed_quantity_kg), 0);

  const inProgressFromTxs = transactions
    .filter((t) => t.status === 'in_progress')
    .reduce((sum, t) => sum + t.agreed_quantity_kg, 0);

  const totalEffectiveFulfilled = Math.max(requirement.quantity_fulfilled_kg, fulfilledFromTxs);
  const remaining = Math.max(0, requirement.quantity_required_kg - totalEffectiveFulfilled);
  const fulfillmentPercentage = Math.min(100, Math.round((totalEffectiveFulfilled / requirement.quantity_required_kg) * 100));

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Breadcrumb Header */}
        <div className="space-y-1">
          <Link
            href="/recycler/requirements"
            className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Demands</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E] flex items-center gap-2">
              <span>♻️</span>
              <span>{requirement.material} Requirement</span>
            </h1>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              🟢 {requirement.status}
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Primary Spec & Multi-Supplier Sourcing Progress Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs font-semibold text-[#6B7280]">Contracted Procurement Rate</p>
              <p className="text-3xl font-black text-[#136B3B] mt-0.5">
                ₹{requirement.offered_price_per_kg}{' '}
                <span className="text-sm font-normal text-[#6B7280]">/ KG</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="px-3 py-1 rounded-xl bg-[#F8FAF9] border border-gray-200 font-medium">
                Min. Lot: {requirement.minimum_lot_kg} KG
              </span>
              <span className="px-3 py-1 rounded-xl bg-[#F8FAF9] border border-gray-200 font-medium">
                Logistics: {requirement.collection_method}
              </span>
            </div>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-bold text-[#191C1E]">Progressive Sourcing Status</span>
              <span className="text-sm font-black text-[#136B3B]">{fulfillmentPercentage}% Fulfilled</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#136B3B] rounded-full transition-all duration-500"
                style={{ width: `${fulfillmentPercentage}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="p-3 bg-[#F8FAF9] rounded-2xl">
                <span className="text-[10px] text-[#6B7280] font-bold block uppercase">Target Required</span>
                <span className="text-base font-extrabold text-[#191C1E]">{requirement.quantity_required_kg} KG</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <span className="text-[10px] text-emerald-800 font-bold block uppercase">Sourced &amp; Confirmed</span>
                <span className="text-base font-extrabold text-[#136B3B]">{totalEffectiveFulfilled} KG</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl">
                <span className="text-[10px] text-amber-800 font-bold block uppercase">Remaining Open</span>
                <span className="text-base font-extrabold text-amber-900">{remaining} KG</span>
              </div>
            </div>
          </div>

          {/* Sourcing Location & Quality guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs text-[#526056]">
            <div>
              <span className="font-bold text-[#191C1E] block mb-1">Target Regional Radius:</span>
              <p className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <MapPin className="w-3.5 h-3.5 text-[#136B3B]" />
                <span>{requirement.area || 'All Districts'}, {requirement.city} ({requirement.pincode || 'MMR'})</span>
              </p>
            </div>
            <div>
              <span className="font-bold text-[#191C1E] block mb-1">Quality Specifications:</span>
              <p className="text-xs text-[#6B7280] italic leading-relaxed">
                &quot;{requirement.quality_requirements || 'Standard clean scrap separation.'}&quot;
              </p>
            </div>
          </div>
        </div>

        {/* SECTION: Multi-Supplier Network Breakdown (CORE AGGREGATION FEATURE) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#191C1E]">
                Supplier Network Breakdown
              </h2>
              <p className="text-xs text-[#6B7280]">
                Multiple collectors fulfilling this single requirement progressively
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[#136B3B] text-xs font-bold rounded-full border border-emerald-200">
              {transactions.length} Contributing Collectors
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-3xl text-xs text-[#6B7280]">
              No accepted collector contributions yet. Offers will aggregate here upon acceptance.
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs divide-y divide-gray-100">
              {transactions.map((tx, idx) => (
                <div key={tx.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#191C1E]">
                        {tx.collector?.full_name || `Collector #${tx.collector_id.substring(0, 6)}`}
                      </h4>
                      <p className="text-[11px] text-[#6B7280]">
                        {tx.pickup_address || requirement.city} · Code: {tx.traceability_code || tx.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto text-right">
                    <div>
                      <span className="text-sm font-black text-[#191C1E]">
                        {tx.actual_weight_kg || tx.agreed_quantity_kg} KG
                      </span>
                      <p className="text-[11px] text-[#6B7280]">
                        ₹{tx.final_amount || Math.round((tx.agreed_quantity_kg) * requirement.offered_price_per_kg)}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        tx.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-purple-100 text-purple-900'
                      }`}
                    >
                      {tx.status === 'completed' ? '✓ Ingested' : tx.pickup_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION: Pending Offers for this Requirement */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-[#191C1E]">
            Pending Offers for this Requirement ({offers.filter((o) => o.status === 'pending').length})
          </h2>

          {offers.filter((o) => o.status === 'pending').length === 0 ? (
            <div className="p-6 text-center bg-white border border-gray-100 rounded-3xl text-xs text-[#6B7280]">
              No unreviewed offers for this requirement right now.
            </div>
          ) : (
            <div className="space-y-3">
              {offers
                .filter((o) => o.status === 'pending')
                .map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#191C1E]">
                        {offer.collector?.full_name || 'Verified Collector'}
                      </h4>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Offered: <strong>{offer.quantity_offered_kg} KG</strong> @ ₹{offer.offered_price_per_kg}/KG
                        (Est. ₹{offer.estimated_value})
                      </p>
                      {offer.message && (
                        <p className="text-[11px] text-[#526056] italic mt-1 bg-[#F8FAF9] px-2.5 py-1 rounded-lg inline-block">
                          &quot;{offer.message}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition touch-feedback"
                      >
                        Accept &amp; Commit
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

      </main>

      <BottomNav role="recycler" />
    </div>
  );
}
