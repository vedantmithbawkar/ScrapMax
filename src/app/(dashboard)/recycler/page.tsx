'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import {
  RecyclerProfile,
  RecyclerRequirement,
  CollectorOffer,
  RecyclerTransaction,
} from '@/types';
import {
  getRecyclerProfile,
  getRequirements,
  getIncomingOffers,
  getRecyclerTransactions,
  getRecyclerAnalytics,
  respondToOffer,
} from '@/lib/recycler-service';
import {
  Factory,
  PlusCircle,
  TrendingUp,
  Inbox,
  Truck,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  QrCode,
  MapPin,
  XCircle,
  BarChart3,
  Bell,
  Scale,
} from 'lucide-react';

export default function RecyclerDashboardPage() {
  const [profile, setProfile] = useState<RecyclerProfile | null>(null);
  const [requirements, setRequirements] = useState<RecyclerRequirement[]>([]);
  const [offers, setOffers] = useState<CollectorOffer[]>([]);
  const [transactions, setTransactions] = useState<RecyclerTransaction[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalMaterialPurchasedKg: number;
    totalSpend: number;
    avgPricePerKg: number;
    activeRequirementsCount: number;
    fulfilledRequirementsCount: number;
    pendingOffersCount: number;
    completedTransactionsCount: number;
    totalSuppliersCount: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const p = await getRecyclerProfile('rec-001');
      setProfile(p);

      const [reqs, off, txs, stats] = await Promise.all([
        getRequirements({ recyclerId: p?.id }),
        getIncomingOffers(p?.id),
        getRecyclerTransactions(p?.id),
        getRecyclerAnalytics(p?.id),
      ]);

      setRequirements(reqs);
      setOffers(off);
      setTransactions(txs);
      setAnalytics(stats);
    } catch (err) {
      console.warn('Recycler dashboard load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleQuickAccept = async (offerId: string) => {
    try {
      await respondToOffer(offerId, 'accept');
      setActionSuccessMsg('Offer accepted! Transaction created and pickup scheduled.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadDashboard();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error accepting offer');
    }
  };

  const handleQuickReject = async (offerId: string) => {
    try {
      await respondToOffer(offerId, 'reject', { rejection_reason: 'Material quality or quantity mismatch' });
      setActionSuccessMsg('Offer rejected.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadDashboard();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error rejecting offer');
    }
  };

  const pendingOffers = offers.filter((o) => o.status === 'pending');
  const activePickups = transactions.filter((t) => t.status === 'in_progress');

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Top Recycler Hero Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A6D5B8] bg-white/10 px-2.5 py-0.5 rounded-full">
                B2B Procurement Portal
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400 text-emerald-950">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-950"></span>
                <span>🟢 Verified Recycler</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{profile?.company_name || 'Green India E-Waste Solutions'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#A6D5B8]">
              {profile?.city}, {profile?.state} · SPCB Auth: {profile?.registration_number || 'MPCB/RO-THANE/2024'}
            </p>
          </div>

          <div className="z-10 flex flex-wrap items-center gap-2.5">
            <Link
              href="/recycler/requirements/new"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#136B3B] font-bold rounded-full text-xs shadow-xs hover:bg-emerald-50 transition touch-feedback"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Create Material Requirement</span>
            </Link>
            <Link
              href="/recycler/traceability"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/15 text-white font-bold rounded-full text-xs hover:bg-white/20 transition touch-feedback"
            >
              <QrCode className="w-4 h-4" />
              <span>Traceability Records</span>
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Action feedback toast */}
        {actionSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Supply Alert Banner (Marketplace Intelligence) */}
        <div className="p-4 sm:p-5 bg-amber-50/80 border border-amber-200/90 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-amber-950">
                🔔 New Supply Available in Preferred Area
              </h2>
              <p className="text-xs text-amber-800/90 mt-0.5">
                83 KG PCB and 45 KG Copper Cable reported by 3 local collectors in Thane &amp; Central Mumbai.
              </p>
            </div>
          </div>
          <Link
            href="/recycler/offers"
            className="self-start sm:self-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-full transition shadow-xs whitespace-nowrap"
          >
            Review Sourced Lots
          </Link>
        </div>

        {/* KPI Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          
          <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#6B7280]">Active Demands</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-[#136B3B]">
                <Factory className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E] mt-2">
              {analytics?.activeRequirementsCount ?? requirements.length}
            </p>
            <span className="text-[10px] text-[#6B7280]">Targeting bulk supply</span>
          </div>

          <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#6B7280]">Incoming Offers</span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                <Inbox className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E] mt-2">
              {pendingOffers.length}
            </p>
            <span className="text-[10px] text-blue-700 font-medium">Awaiting your response</span>
          </div>

          <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#6B7280]">Material Sourced</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                <Scale className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E] mt-2">
              {((analytics?.totalMaterialPurchasedKg || 18450) / 1000).toFixed(1)} T
            </p>
            <span className="text-[10px] text-emerald-700 font-bold">100% Circulated</span>
          </div>

          <div className="p-4 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#6B7280]">Active Pickups</span>
              <div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E] mt-2">
              {activePickups.length}
            </p>
            <span className="text-[10px] text-[#6B7280]">Scheduled / in transit</span>
          </div>

          <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 bg-white border border-gray-100 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#6B7280]">Total Spend</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-[#136B3B]">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#191C1E] mt-2">
              ₹{((analytics?.totalSpend || 284000) / 100000).toFixed(2)} L
            </p>
            <span className="text-[10px] text-[#6B7280]">Avg ₹{analytics?.avgPricePerKg || 145}/KG</span>
          </div>

        </div>

        {/* SECTION: My Active Material Requirements (Core Demand Engine) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#191C1E]">My Material Requirements</h2>
              <p className="text-xs text-[#6B7280]">Multi-supplier demand tracking and progressive fulfillment</p>
            </div>
            <Link
              href="/recycler/requirements"
              className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1"
            >
              <span>View All ({requirements.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {requirements.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-3">
              <Factory className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs text-[#6B7280]">You haven&apos;t published any material requirements yet.</p>
              <Link
                href="/recycler/requirements/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#136B3B] text-white text-xs font-bold rounded-full shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish Requirement</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {requirements.slice(0, 3).map((req) => {
                const remaining = Math.max(0, req.quantity_required_kg - req.quantity_fulfilled_kg);
                const percent = Math.min(100, Math.round((req.quantity_fulfilled_kg / req.quantity_required_kg) * 100));

                return (
                  <div
                    key={req.id}
                    className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between hover:border-gray-200 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#191C1E] flex items-center gap-1.5">
                          <span>♻️</span>
                          <span>{req.material}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ₹{req.offered_price_per_kg} / KG
                        </span>
                      </div>

                      <div className="text-xs text-[#526056] space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>Required: {req.quantity_required_kg} KG</span>
                          <span className="text-[#136B3B]">{percent}%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#136B3B] rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-[#6B7280] pt-0.5">
                          <span>{req.quantity_fulfilled_kg} KG Fulfilled</span>
                          <span className="font-bold text-amber-700">{remaining} KG Remaining</span>
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-[#6B7280] flex items-center justify-between border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{req.city}</span>
                        </span>
                        <span>Min Lot: {req.minimum_lot_kg} KG</span>
                      </div>
                    </div>

                    <Link
                      href={`/recycler/requirements/${req.id}`}
                      className="w-full py-2 bg-[#F8FAF9] hover:bg-emerald-50 text-[#136B3B] font-bold text-xs rounded-xl transition text-center border border-gray-200/80 mt-2 block"
                    >
                      View Multi-Supplier Breakdown
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION: Incoming Scrap Offers (Collector Submissions) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#191C1E]">Incoming Collector Scrap Offers</h2>
              <p className="text-xs text-[#6B7280]">Collector submissions matched against your active requirements</p>
            </div>
            <Link
              href="/recycler/offers"
              className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1"
            >
              <span>Manage Offers ({offers.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingOffers.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-3xl text-xs text-[#6B7280]">
              No pending collector offers right now. Active demands are published on the Collector Demand Board.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOffers.slice(0, 4).map((offer) => (
                <div
                  key={offer.id}
                  className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        New Collector Offer
                      </span>
                      <h3 className="text-sm font-bold text-[#191C1E] mt-1">
                        {offer.requirement?.material || 'Recyclable Material'}
                      </h3>
                      <p className="text-xs text-[#6B7280]">
                        From: {offer.collector?.full_name || 'Verified Collector'}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-black text-[#136B3B]">
                        {offer.quantity_offered_kg} KG
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        @ ₹{offer.offered_price_per_kg}/KG
                      </p>
                    </div>
                  </div>

                  {offer.message && (
                    <p className="text-xs text-[#526056] bg-[#F8FAF9] p-2.5 rounded-xl italic">
                      &quot;{offer.message}&quot;
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="font-bold text-[#191C1E]">
                      Est. Value: ₹{offer.estimated_value.toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickReject(offer.id)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 text-xs font-bold rounded-xl transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleQuickAccept(offer.id)}
                        className="px-3.5 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        Accept &amp; Schedule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION: Active Scheduled Pickups & Telemetry */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#191C1E]">Active Scheduled Pickups</h2>
              <p className="text-xs text-[#6B7280]">Collector pickups in transit or pending weight confirmation</p>
            </div>
            <Link
              href="/recycler/pickups"
              className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1"
            >
              <span>Track All Pickups ({transactions.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activePickups.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-3xl text-xs text-[#6B7280]">
              No pickups in progress right now. Accepted collector offers will appear here for logistics dispatch.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePickups.slice(0, 2).map((tx) => (
                <div
                  key={tx.id}
                  className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {tx.pickup_status}
                      </span>
                      <h3 className="text-sm font-bold text-[#191C1E] mt-1">
                        {tx.agreed_quantity_kg} KG {tx.material}
                      </h3>
                      <p className="text-xs text-[#6B7280]">{tx.pickup_address || 'Mumbai MMR Area'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#136B3B]">
                        ₹{tx.agreed_price_per_kg} / KG
                      </span>
                      <p className="text-[11px] text-[#6B7280]">
                        {tx.pickup_date || 'Today'} · {tx.pickup_time || 'Pending slot'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAF9] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[#526056]">
                      Collector: <strong>{tx.collector?.full_name || 'Verified Collector'}</strong>
                    </span>
                    <Link
                      href="/recycler/pickups"
                      className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1"
                    >
                      <span>Scale Verification</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
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
