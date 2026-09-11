'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { RecyclerRequirement } from '@/types';
import { getRequirements } from '@/lib/recycler-service';
import {
  TrendingUp,
  ArrowLeft,
  Search,
  Filter,
  MapPin,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Factory,
} from 'lucide-react';

export default function CollectorDemandBoardPage() {
  const [requirements, setRequirements] = useState<RecyclerRequirement[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('all');
  const [searchCity, setSearchCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getRequirements();
        setRequirements(data);
      } catch (err) {
        console.warn('Demand board load notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = requirements.filter((r) => {
    const matchesMat = selectedMaterial === 'all' || r.material.toLowerCase() === selectedMaterial.toLowerCase();
    const matchesCity = !searchCity || r.city.toLowerCase().includes(searchCity.toLowerCase());
    const matchesVerified = !verifiedOnly || r.recycler?.verification_status === 'verified';
    return matchesMat && matchesCity && matchesVerified;
  });

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
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E] flex items-center gap-2">
                <span>🔥 Current Recycler Demand</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Live bulk scrap requirements published by verified industrial recycling facilities
              </p>
            </div>
            <Link
              href="/collector/find-buyers"
              className="self-start sm:self-auto px-5 py-2.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-full shadow-sm transition touch-feedback flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Match My Scrap</span>
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Filter Material</label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-medium"
              >
                <option value="all">All Materials</option>
                <option value="PCB">PCB Circuit Boards</option>
                <option value="Copper Cable">Copper Cables</option>
                <option value="Aluminium">Aluminium</option>
                <option value="Batteries">Batteries</option>
                <option value="Mixed E-Waste">Mixed E-Waste</option>
                <option value="Motors">Electric Motors</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#6B7280] mb-1">Location / City</label>
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search city (e.g. Mumbai, Thane)"
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E]"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#191C1E]">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-[#136B3B] focus:ring-[#136B3B] w-4 h-4"
                />
                <span>Verified Facilities Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Demand Cards List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#6B7280]">Loading market demands...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
            <Factory className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#191C1E]">No active demands match your filters</h3>
            <p className="text-xs text-[#6B7280]">Try clearing your search query or material filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((req) => {
              const remaining = Math.max(0, req.quantity_required_kg - req.quantity_fulfilled_kg);
              const percent = Math.min(100, Math.round((req.quantity_fulfilled_kg / req.quantity_required_kg) * 100));

              return (
                <div
                  key={req.id}
                  className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-4 hover:border-gray-200 transition"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#191C1E] flex items-center gap-1.5">
                          <span>♻️</span>
                          <span>{req.material}</span>
                        </span>
                        {req.recycler?.verification_status === 'verified' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                            🟢 Verified
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs text-[#6B7280] mt-0.5 font-medium">
                        {req.recycler?.company_name || 'Authorized Recycler'}
                      </h4>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-[#136B3B]">
                        ₹{req.offered_price_per_kg}{' '}
                        <span className="text-xs font-normal text-[#6B7280]">/ KG</span>
                      </p>
                      <span className="text-[11px] text-[#6B7280]">
                        Min Lot: {req.minimum_lot_kg} KG
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Progress: {req.quantity_fulfilled_kg} KG of {req.quantity_required_kg} KG</span>
                      <span className="text-[#136B3B]">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#136B3B] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#6B7280] pt-0.5">
                      <span>{req.city} · {req.collection_method}</span>
                      <span className="font-bold text-amber-700">{remaining} KG Still Needed</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[#526056] truncate max-w-[220px]">
                      {req.quality_requirements ? `"${req.quality_requirements}"` : 'Direct facility procurement'}
                    </span>
                    <Link
                      href="/collector/find-buyers"
                      className="px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition touch-feedback flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>Match &amp; Offer</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <BottomNav role="collector" />
    </div>
  );
}
