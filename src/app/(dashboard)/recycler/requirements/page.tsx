'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { RecyclerRequirement, RequirementStatus } from '@/types';
import { getRequirements } from '@/lib/recycler-service';
import {
  PlusCircle,
  Search,
  Filter,
  ArrowLeft,
  MapPin,
  TrendingUp,
  Clock,
  ArrowRight,
  Factory,
} from 'lucide-react';

export default function RecyclerRequirementsListPage() {
  const [requirements, setRequirements] = useState<RecyclerRequirement[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const reqs = await getRequirements();
        setRequirements(reqs);
      } catch (err) {
        console.warn('Load requirements notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = requirements.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      r.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.area && r.area.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/recycler"
              className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E]">
              Published Material Demands
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              Active purchase specifications broadcast to the scrap collector marketplace
            </p>
          </div>

          <Link
            href="/recycler/requirements/new"
            className="flex items-center gap-2 px-5 py-3 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold rounded-full text-xs shadow-sm transition touch-feedback"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create Material Requirement</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search material or city (e.g. PCB, Copper, Thane, Mumbai)..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {['all', 'Active', 'Fulfilled', 'Paused', 'Draft'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-[#EAE6F8] text-[#191C1E]'
                    : 'text-[#6B7280] hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All Demands' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Requirements Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#6B7280]">Loading requirements...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-3">
            <Factory className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#191C1E]">No matching requirements</h3>
            <p className="text-xs text-[#6B7280]">Try adjusting your search query or status filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((req) => {
              const remaining = Math.max(0, req.quantity_required_kg - req.quantity_fulfilled_kg);
              const percent = Math.min(100, Math.round((req.quantity_fulfilled_kg / req.quantity_required_kg) * 100));

              return (
                <div
                  key={req.id}
                  className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between hover:border-gray-200 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#191C1E] flex items-center gap-1.5">
                        <span>♻️</span>
                        <span>{req.material}</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ₹{req.offered_price_per_kg} / KG
                      </span>
                    </div>

                    <div className="text-xs text-[#526056] space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>Required: {req.quantity_required_kg} KG</span>
                        <span className="text-[#136B3B]">{percent}%</span>
                      </div>
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

                    {req.quality_requirements && (
                      <p className="text-[11px] text-[#6B7280] line-clamp-2 bg-[#F8FAF9] p-2 rounded-xl">
                        &quot;{req.quality_requirements}&quot;
                      </p>
                    )}

                    <div className="pt-2 text-[11px] text-[#6B7280] flex items-center justify-between border-t border-gray-100">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{req.city}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                        Min: {req.minimum_lot_kg} KG
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/recycler/requirements/${req.id}`}
                    className="w-full py-2 bg-[#F8FAF9] hover:bg-emerald-50 text-[#136B3B] font-bold text-xs rounded-xl transition text-center border border-gray-200/80 mt-3 block"
                  >
                    View Multi-Supplier Breakdown
                  </Link>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <BottomNav role="recycler" />
    </div>
  );
}
