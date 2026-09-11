'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import {
  RecyclerRequirement,
  RecyclerMaterial,
  MatchingScoreResult,
  RECYCLER_MATERIALS_LIST,
  RECYCLER_MATERIAL_DETAILS,
} from '@/types';
import { getRequirements, submitCollectorOffer } from '@/lib/recycler-service';
import { matchScrapRequirements } from '@/lib/matching-engine';
import {
  Sparkles,
  ArrowLeft,
  Truck,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  Search,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';

// Default mock inventory lots ready in collector's depot
const COLLECTOR_INVENTORY: Array<{ material: RecyclerMaterial; quantityKg: number; icon: string }> = [
  { material: 'PCB', quantityKg: 32, icon: '💻' },
  { material: 'Copper Cable', quantityKg: 18, icon: '🔌' },
  { material: 'LCD', quantityKg: 11, icon: '🖥️' },
  { material: 'Batteries', quantityKg: 8, icon: '🔋' },
  { material: 'Aluminium', quantityKg: 45, icon: '⚙️' },
];

export default function FindBuyersPage() {
  const [requirements, setRequirements] = useState<RecyclerRequirement[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<RecyclerMaterial>('PCB');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(32);
  const [city, setCity] = useState('Mumbai');
  const [matchResults, setMatchResults] = useState<MatchingScoreResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit Offer Modal
  const [submittingReq, setSubmittingReq] = useState<RecyclerRequirement | null>(null);
  const [offerQty, setOfferQty] = useState<number>(32);
  const [offerMessage, setOfferMessage] = useState('Cleanly segregated scrap ready for pickup.');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    async function loadReqs() {
      setLoading(true);
      try {
        const data = await getRequirements();
        setRequirements(data);
      } catch (err) {
        console.warn('Load requirements notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReqs();
  }, []);

  // Re-run matching engine whenever material or quantity changes
  useEffect(() => {
    if (requirements.length > 0) {
      const matched = matchScrapRequirements(
        {
          material: selectedMaterial,
          quantityKg: selectedQuantity,
          city,
          collectorRequiresPickup: true,
        },
        requirements
      );
      setMatchResults(matched);
    }
  }, [selectedMaterial, selectedQuantity, city, requirements]);

  const handleSelectInventoryItem = (mat: RecyclerMaterial, qty: number) => {
    setSelectedMaterial(mat);
    setSelectedQuantity(qty);
    setOfferQty(qty);
  };

  const handleOpenOfferModal = (req: RecyclerRequirement) => {
    setSubmittingReq(req);
    setOfferQty(selectedQuantity);
    setModalError('');
  };

  const handleSubmitOffer = async () => {
    if (!submittingReq) return;
    setModalError('');

    const qty = Number(offerQty);
    if (!qty || qty <= 0) {
      setModalError('Quantity must be greater than 0.');
      return;
    }
    if (qty > selectedQuantity) {
      setModalError(`Offered quantity cannot exceed your available scrap (${selectedQuantity} KG).`);
      return;
    }
    if (qty < (submittingReq.minimum_lot_kg || 1)) {
      setModalError(`Recycler requires a minimum lot size of ${submittingReq.minimum_lot_kg} KG.`);
      return;
    }

    setSubmitting(true);
    try {
      await submitCollectorOffer({
        requirement_id: submittingReq.id,
        collector_id: 'coll-c102',
        quantity_offered_kg: qty,
        offered_price_per_kg: submittingReq.offered_price_per_kg,
        estimated_value: Math.round(qty * submittingReq.offered_price_per_kg),
        message: offerMessage,
      });

      setSubmitSuccess(`Offer for ${qty} KG ${submittingReq.material} submitted successfully to ${submittingReq.recycler?.company_name || 'Recycler'}!`);
      setSubmittingReq(null);
      setTimeout(() => setSubmitSuccess(''), 5000);
    } catch (err: unknown) {
      const error = err as Error;
      setModalError(error.message || 'Error submitting offer');
    } finally {
      setSubmitting(false);
    }
  };

  const bestMatch = matchResults.find((r) => r.isBestMatch);
  const otherMatches = matchResults.filter((r) => !r.isBestMatch);

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
            <span>Back to Collector Dashboard</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E] flex items-center gap-2">
                <span>Find Buyers for My Scrap</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Match your collected inventory against verified industrial recycler demands and locked purchasing rates
              </p>
            </div>
            <Link
              href="/collector/demand-board"
              className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 text-[#191C1E] text-xs font-bold rounded-full shadow-xs hover:bg-gray-50 transition"
            >
              Browse Demand Board
            </Link>
          </div>
        </div>

        {submitSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* STEP 1: Select or Enter Scrap Inventory */}
        <section className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#191C1E]">
              1. Select from Your Collected Inventory
            </h2>
            <span className="text-xs text-[#6B7280]">Ready in your depot</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {COLLECTOR_INVENTORY.map((item) => {
              const isSelected = selectedMaterial === item.material && selectedQuantity === item.quantityKg;
              return (
                <button
                  key={item.material}
                  type="button"
                  onClick={() => handleSelectInventoryItem(item.material, item.quantityKg)}
                  className={`p-3 rounded-2xl border text-left transition touch-feedback ${
                    isSelected
                      ? 'border-[#136B3B] bg-[#E6F4EA] text-[#136B3B] shadow-xs'
                      : 'border-gray-200 bg-[#F8FAF9] text-[#191C1E] hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl block mb-1">{item.icon}</span>
                  <span className="text-xs font-bold block truncate">{item.material}</span>
                  <span className="text-xs text-[#6B7280] font-semibold">{item.quantityKg} KG</span>
                </button>
              );
            })}
          </div>

          {/* Custom entry adjustment */}
          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
            <span className="text-[#6B7280] font-semibold">Or custom check:</span>
            <div className="flex items-center gap-2 flex-1">
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value as RecyclerMaterial)}
                className="px-3 py-1.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
              >
                {RECYCLER_MATERIALS_LIST.map((mat) => (
                  <option key={mat} value={mat}>
                    {mat}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(e.target.value === '' ? 1 : parseFloat(e.target.value))}
                  className="w-20 px-3 py-1.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-bold"
                />
                <span className="text-xs text-[#6B7280] font-bold">KG</span>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 2: Matching Engine Results */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#191C1E] flex items-center gap-2">
                <span>Matching Recycler Offers</span>
                <span className="text-xs font-bold text-[#136B3B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {matchResults.length} Compatible Facilities
                </span>
              </h2>
              <p className="text-xs text-[#6B7280]">
                Ranked by material compatibility, purchasing price, logistics coverage, and verification status
              </p>
            </div>
          </div>

          {matchResults.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
              <Layers className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-[#191C1E]">No active recycler demand found</h3>
              <p className="text-xs text-[#6B7280]">
                No facilities currently have open purchasing quotas for {selectedMaterial}. Check the Demand Board for other opportunities.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* BEST MATCH HERO CARD */}
              {bestMatch && (
                <div className="bg-gradient-to-br from-[#136B3B] to-[#0D4B29] text-white rounded-3xl p-6 sm:p-7 shadow-md relative overflow-hidden space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-amber-950 shadow-xs">
                        <Award className="w-4 h-4" />
                        <span>🏆 BEST MATCH — {bestMatch.score}% MATCH SCORE</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mt-1">
                        {bestMatch.requirement.recycler?.company_name || 'Verified Recycler Partner'}
                      </h3>
                      <p className="text-xs text-[#A6D5B8]">
                        Location: {bestMatch.requirement.city} · Pickup: {bestMatch.requirement.collection_method}
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xs border border-white/10">
                      <p className="text-2xl sm:text-3xl font-black text-white">
                        ₹{bestMatch.requirement.offered_price_per_kg}{' '}
                        <span className="text-xs font-normal text-[#A6D5B8]">/ KG</span>
                      </p>
                      <p className="text-xs text-amber-300 font-bold">
                        Estimated Value: ₹{bestMatch.estimatedValue.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Why this matched explanation checklist */}
                  <div className="pt-2 border-t border-white/10 relative z-10 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6D5B8]">
                      Why this is your best match:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {bestMatch.reasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 text-[11px] font-semibold text-white backdrop-blur-xs"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          <span>{reason}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 relative z-10">
                    <span className="text-xs text-[#A6D5B8]">
                      Requirement: {bestMatch.requirement.quantity_required_kg} KG target (Min lot: {bestMatch.requirement.minimum_lot_kg} KG)
                    </span>
                    <button
                      onClick={() => handleOpenOfferModal(bestMatch.requirement)}
                      className="px-6 py-2.5 bg-white hover:bg-emerald-50 text-[#136B3B] text-xs sm:text-sm font-extrabold rounded-full shadow-md transition touch-feedback flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Offer</span>
                    </button>
                  </div>
                  <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                </div>
              )}

              {/* OTHER MATCHING OFFERS */}
              {otherMatches.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    Other Available Facilities ({otherMatches.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherMatches.map((res) => (
                      <div
                        key={res.requirement.id}
                        className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3 hover:border-gray-200 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#191C1E]">
                                {res.requirement.recycler?.company_name || 'Recycling Center'}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                                {res.score}% Match
                              </span>
                            </div>
                            <p className="text-xs text-[#6B7280] mt-0.5">
                              {res.requirement.city} · {res.requirement.collection_method}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-[#136B3B]">
                              ₹{res.requirement.offered_price_per_kg} / KG
                            </span>
                            <p className="text-[11px] text-[#6B7280]">
                              Est. ₹{res.estimatedValue.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 text-[10px] text-[#526056]">
                          {res.reasons.slice(0, 2).map((r, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-[#F8FAF9] border border-gray-200">
                              ✓ {r}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-[11px] text-[#6B7280]">
                            Target: {res.requirement.quantity_required_kg} KG
                          </span>
                          <button
                            onClick={() => handleOpenOfferModal(res.requirement)}
                            className="px-4 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition touch-feedback"
                          >
                            Submit Offer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

      </main>

      {/* SUBMIT OFFER MODAL */}
      {submittingReq && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#191C1E] flex items-center gap-2">
                <span>Submit Scrap Offer</span>
              </h3>
              <button onClick={() => setSubmittingReq(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {modalError}
              </div>
            )}

            <div className="p-3.5 bg-[#F8FAF9] rounded-2xl text-xs space-y-1 text-[#526056]">
              <p>
                <strong>Buyer:</strong> {submittingReq.recycler?.company_name || 'Green India E-Waste'}
              </p>
              <p>
                <strong>Material:</strong> {submittingReq.material}
              </p>
              <p>
                <strong>Recycler Price:</strong> ₹{submittingReq.offered_price_per_kg} / KG
              </p>
              <p>
                <strong>Your Available Scrap:</strong> {selectedQuantity} KG
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">
                Enter Quantity to Offer (KG)
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedQuantity}
                value={offerQty}
                onChange={(e) => setOfferQty(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm font-bold text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">
                Minimum lot size: {submittingReq.minimum_lot_kg} KG.
              </span>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-bold">
              <span>Estimated Payout:</span>
              <span className="text-sm text-[#136B3B]">
                ₹{Math.round(offerQty * submittingReq.offered_price_per_kg).toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Note / Message to Buyer</label>
              <input
                type="text"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="e.g. PCB circuit boards packed neat in boxes."
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSubmittingReq(null)}
                className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOffer}
                disabled={submitting || !offerQty || offerQty <= 0}
                className="px-5 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition touch-feedback disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Submit Offer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="collector" />
    </div>
  );
}
