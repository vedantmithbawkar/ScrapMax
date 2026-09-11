'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { RecyclerProfile, RecyclerMaterial } from '@/types';
import { getAllRecyclers } from '@/lib/recycler-service';
import {
  Factory,
  Search,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Filter,
  ExternalLink,
  Phone,
  Mail,
  Info,
} from 'lucide-react';

export default function PublicRecyclerDirectoryPage() {
  const [recyclers, setRecyclers] = useState<RecyclerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAllRecyclers();
        setRecyclers(data);
      } catch (err) {
        console.warn('Directory load notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = recyclers.filter((r) => {
    const matchesSearch =
      r.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || r.business_type.toLowerCase() === filterType.toLowerCase();
    const matchesCity = selectedCity === 'all' || r.city.toLowerCase() === selectedCity.toLowerCase();
    return matchesSearch && matchesType && matchesCity;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Hero Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A6D5B8] bg-white/10 px-2.5 py-0.5 rounded-full">
              Pan-India Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>National Recycler &amp; Facility Directory</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#A6D5B8]">
              Discover state-authorized recyclers, dismantling yards, and circular e-waste hubs across India
            </p>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Regulatory Clarity Notice (Rule #5 & #46) */}
        <div className="p-4 bg-blue-50/80 border border-blue-200/90 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
          <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Transparency in Listings:</p>
            <p className="text-[11.5px] leading-relaxed text-blue-900">
              ScrapMax distinguishes between <strong>🟢 ScrapMax Verified Partners</strong> (facilities transacting on this digital marketplace) and <strong>🏛️ Official Public Directory Listings</strong> (regulatory records sourced from Pollution Control Board registries).
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search facility name or location..."
                className="w-full pl-9 pr-4 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
              />
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-medium"
              >
                <option value="all">All Facility Types</option>
                <option value="Recycler">Recycler</option>
                <option value="Dismantler">Dismantler</option>
                <option value="Refurbisher">Refurbisher</option>
                <option value="Processor">Processor</option>
              </select>
            </div>

            <div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-medium"
              >
                <option value="all">All Regions &amp; Cities</option>
                <option value="Thane">Thane</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Navi Mumbai">Navi Mumbai</option>
                <option value="Delhi">Delhi NCR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Facilities Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#6B7280]">Loading facility directory...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
            <Factory className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#191C1E]">No facilities found</h3>
            <p className="text-xs text-[#6B7280]">Try broadening your search query or region filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((r) => {
              const isPartner = r.verification_source === 'scrapmax_partner';
              return (
                <div
                  key={r.id}
                  className="p-5 sm:p-6 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-4 hover:border-gray-200 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-[#191C1E]">{r.company_name}</h3>
                        <p className="text-xs text-[#6B7280]">
                          {r.business_type} · {r.city}, {r.state}
                        </p>
                      </div>

                      {/* Partner vs Directory Listing Badge */}
                      {isPartner ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 whitespace-nowrap">
                          🟢 ScrapMax Partner
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 whitespace-nowrap">
                          🏛️ Public Directory Listing
                        </span>
                      )}
                    </div>

                    {!isPartner && (
                      <p className="text-[11px] text-[#6B7280] italic bg-[#F8FAF9] p-2 rounded-xl">
                        Official regulatory listing · Not a ScrapMax commercial partner
                      </p>
                    )}

                    <div className="text-xs text-[#526056] space-y-1">
                      <p className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                        <MapPin className="w-3.5 h-3.5 text-[#136B3B] flex-shrink-0" />
                        <span>{r.facility_address} (PIN {r.pincode})</span>
                      </p>
                      {r.registration_number && (
                        <p className="text-[11px] font-mono text-[#6B7280] pl-5">
                          Auth ID: {r.registration_number}
                        </p>
                      )}
                    </div>

                    {/* Accepted Materials */}
                    {r.materials && r.materials.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-[#6B7280] block uppercase">
                          Materials Handled:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {r.materials
                            .filter((m) => m.accepted)
                            .map((m) => (
                              <span
                                key={m.material}
                                className="px-2 py-0.5 rounded-md bg-[#E6F4EA] text-[#136B3B] text-[10px] font-semibold"
                              >
                                {m.material}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-[#6B7280]">
                      {r.completed_transactions_count
                        ? `${r.completed_transactions_count} completed batches`
                        : 'Regulatory record'}
                    </span>
                    <Link
                      href={isPartner ? `/recycler/profile` : `#`}
                      className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1"
                    >
                      <span>View Credentials</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      <BottomNav role="household" />
    </div>
  );
}
