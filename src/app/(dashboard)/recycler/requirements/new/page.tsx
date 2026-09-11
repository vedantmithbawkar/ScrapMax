'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import {
  RecyclerMaterial,
  CollectionMethod,
  RequirementStatus,
  RECYCLER_MATERIALS_LIST,
  RECYCLER_MATERIAL_DETAILS,
} from '@/types';
import { createRequirement } from '@/lib/recycler-service';
import {
  ArrowLeft,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Factory,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function CreateRequirementPage() {
  const router = useRouter();

  const [material, setMaterial] = useState<RecyclerMaterial>('PCB');
  const [quantityRequired, setQuantityRequired] = useState<number | ''>(500);
  const [offeredPrice, setOfferedPrice] = useState<number | ''>(145);
  const [minimumLot, setMinimumLot] = useState<number | ''>(20);
  const [collectionMethod, setCollectionMethod] = useState<CollectionMethod>('Both');
  const [city, setCity] = useState('Mumbai');
  const [area, setArea] = useState('Central & Western MMR');
  const [pincode, setPincode] = useState('400001');
  const [qualityReqs, setQualityReqs] = useState(
    'Circuit boards must be separated from plastic chassis. No water or severe burn damage.'
  );
  const [validDays, setValidDays] = useState(30);
  const [status, setStatus] = useState<RequirementStatus>('Active');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const qty = Number(quantityRequired);
    const price = Number(offeredPrice);
    const minLot = Number(minimumLot);

    if (!qty || qty <= 0) {
      setErrorMsg('Quantity required must be greater than 0.');
      return;
    }
    if (!price || price <= 0) {
      setErrorMsg('Offered price per KG must be greater than 0.');
      return;
    }
    if (!minLot || minLot <= 0) {
      setErrorMsg('Minimum lot size must be greater than 0.');
      return;
    }
    if (minLot > qty) {
      setErrorMsg('Minimum lot size cannot exceed total quantity required.');
      return;
    }

    setLoading(true);

    try {
      const expiresAt = new Date(Date.now() + 86400000 * validDays).toISOString();
      await createRequirement({
        recycler_id: 'rec-001',
        material,
        quantity_required_kg: qty,
        offered_price_per_kg: price,
        minimum_lot_kg: minLot,
        collection_method: collectionMethod,
        city,
        area,
        pincode,
        quality_requirements: qualityReqs,
        status,
        expires_at: expiresAt,
      });

      setSuccessMsg('Requirement published! Now broadcasted to collectors across the region.');
      setTimeout(() => {
        router.push('/recycler/requirements');
      }, 1500);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Failed to create requirement.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMeta = RECYCLER_MATERIAL_DETAILS[material];

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Breadcrumb */}
        <div className="space-y-1">
          <Link
            href="/recycler/requirements"
            className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Requirements</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E]">
            Publish Material Requirement
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Specify bulk scrap demand, purchasing rates, and quality standards for collectors
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Material Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#191C1E]">Select Material Needed</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as RecyclerMaterial)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-medium focus:outline-none focus:border-[#136B3B]"
              >
                {RECYCLER_MATERIALS_LIST.map((mat) => (
                  <option key={mat} value={mat}>
                    {RECYCLER_MATERIAL_DETAILS[mat].icon} {RECYCLER_MATERIAL_DETAILS[mat].label}
                  </option>
                ))}
              </select>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs flex items-center justify-between text-emerald-900">
                <span className="font-semibold">Typical Market Rate:</span>
                <span className="font-bold">{selectedMeta.typicalPriceRange}</span>
              </div>
            </div>
          </div>

          {/* Quantities & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Quantity Required (KG)</label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={quantityRequired}
                onChange={(e) => setQuantityRequired(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="500"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-medium focus:outline-none focus:border-[#136B3B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Offered Price (₹ / KG)</label>
              <input
                type="number"
                required
                min="1"
                step="0.5"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="145"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-medium focus:outline-none focus:border-[#136B3B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Minimum Lot Size (KG)</label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={minimumLot}
                onChange={(e) => setMinimumLot(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="20"
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] font-medium focus:outline-none focus:border-[#136B3B]"
              />
            </div>
          </div>

          {/* Collection Method */}
          <div>
            <label className="block text-xs font-bold text-[#191C1E] mb-1.5">Collection &amp; Logistics Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Recycler Pickup', 'Collector Delivery', 'Both'] as CollectionMethod[]).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setCollectionMethod(method)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                    collectionMethod === method
                      ? 'border-[#136B3B] bg-[#E6F4EA] text-[#136B3B] shadow-xs'
                      : 'border-gray-200 bg-[#F8FAF9] text-[#526056] hover:bg-gray-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Location Preferences */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#191C1E]">Target Sourcing Location</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g. Mumbai, Thane)"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Preferred Area / Locality"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="PIN Code"
                  className="w-full px-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
                />
              </div>
            </div>
          </div>

          {/* Quality Specifications */}
          <div>
            <label className="block text-xs font-bold text-[#191C1E] mb-1">
              Quality Requirements &amp; Sorting Guidelines
            </label>
            <textarea
              rows={3}
              value={qualityReqs}
              onChange={(e) => setQualityReqs(e.target.value)}
              placeholder="e.g. PCB circuit boards must be segregated from heavy plastic casings. Moisture and corrosive contaminants must be absent."
              className="w-full p-3 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
            />
          </div>

          {/* Validity & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Requirement Validity</label>
              <select
                value={validDays}
                onChange={(e) => setValidDays(parseInt(e.target.value))}
                className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
              >
                <option value={7}>7 Days</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RequirementStatus)}
                className="w-full px-3.5 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-[#136B3B]"
              >
                <option value="Active">Active (Publish to Collector Marketplace)</option>
                <option value="Draft">Draft (Save for Later)</option>
                <option value="Paused">Paused</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs sm:text-sm font-bold rounded-full shadow-sm transition touch-feedback flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{loading ? 'Publishing Demand...' : 'Publish Material Requirement'}</span>
          </button>
        </form>

      </main>

      <BottomNav role="recycler" />
    </div>
  );
}
