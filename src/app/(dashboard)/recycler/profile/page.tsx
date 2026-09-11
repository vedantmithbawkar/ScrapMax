'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import {
  RecyclerProfile,
  RecyclerMaterial,
  RECYCLER_MATERIALS_LIST,
  RECYCLER_MATERIAL_DETAILS,
} from '@/types';
import { getRecyclerProfile, upsertRecyclerProfile } from '@/lib/recycler-service';
import {
  Factory,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Save,
  Check,
  X,
} from 'lucide-react';

export default function RecyclerProfilePage() {
  const [profile, setProfile] = useState<RecyclerProfile | null>(null);
  const [capabilities, setCapabilities] = useState<Record<RecyclerMaterial, boolean>>({
    PCB: true,
    'Copper Cable': true,
    Aluminium: true,
    'Ferrous Metal': false,
    'Non-ferrous Metal': true,
    Batteries: true,
    LCD: true,
    CRT: false,
    Motors: true,
    Magnets: true,
    'Mixed Plastics': false,
    'Mixed E-Waste': true,
    Other: false,
  });

  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const p = await getRecyclerProfile('rec-001');
        if (p) {
          setProfile(p);
          if (p.materials && p.materials.length > 0) {
            const mapped = { ...capabilities };
            p.materials.forEach((m) => {
              mapped[m.material] = m.accepted;
            });
            setCapabilities(mapped);
          }
        }
      } catch (err) {
        console.warn('Profile load notice:', err);
      }
    }
    loadData();
  }, []);

  const toggleCapability = (mat: RecyclerMaterial) => {
    setCapabilities((prev) => ({
      ...prev,
      [mat]: !prev[mat],
    }));
  };

  const handleSaveCapabilities = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updatedMaterials = Object.entries(capabilities).map(([mat, accepted]) => ({
        recycler_id: profile.id,
        material: mat as RecyclerMaterial,
        accepted,
      }));

      await upsertRecyclerProfile({
        ...profile,
        materials: updatedMaterials,
      });

      setToastMsg('Material processing capabilities updated successfully!');
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error saving capabilities');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Breadcrumb */}
        <div className="space-y-1">
          <Link
            href="/recycler"
            className="text-xs font-bold text-[#136B3B] hover:underline flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191C1E]">
                Recycler Facility Profile
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Public credentials, SPCB regulatory authorizations, and material processing matrix
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
              Demo Data
            </span>
          </div>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Facility Info Card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] text-2xl font-bold">
                ♻️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#191C1E]">
                    {profile?.company_name || 'Green India E-Waste Solutions'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Verified Recycler</span>
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Business Type: <strong>{profile?.business_type || 'Recycler & Processor'}</strong> · {profile?.city}, {profile?.state}
                </p>
              </div>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-[#F8FAF9] rounded-2xl">
              <span className="text-[10px] text-[#6B7280] font-bold block uppercase">Active Requirements</span>
              <span className="text-base font-extrabold text-[#191C1E]">{profile?.active_requirements_count || 8}</span>
            </div>
            <div className="p-3 bg-[#F8FAF9] rounded-2xl">
              <span className="text-[10px] text-[#6B7280] font-bold block uppercase">Completed Purchases</span>
              <span className="text-base font-extrabold text-[#136B3B]">{profile?.completed_transactions_count || 142}</span>
            </div>
            <div className="p-3 bg-[#F8FAF9] rounded-2xl">
              <span className="text-[10px] text-[#6B7280] font-bold block uppercase">Scrap Sourced</span>
              <span className="text-base font-extrabold text-[#191C1E]">{((profile?.total_material_purchased_kg || 18450) / 1000).toFixed(1)} Tons</span>
            </div>
          </div>

          {/* Regulatory Credentials */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Regulatory &amp; Compliance Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#526056] p-4 bg-[#F8FAF9] rounded-2xl">
              <div>
                <span className="text-[11px] text-[#6B7280] block">State Pollution Control Board:</span>
                <span className="font-bold text-[#191C1E]">{profile?.spcb || 'Maharashtra Pollution Control Board'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Authorization Number:</span>
                <span className="font-bold text-[#191C1E]">{profile?.registration_number || 'MPCB/RO-THANE/E-WASTE/2024/09'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">CPCB EPR Registration ID:</span>
                <span className="font-bold text-[#191C1E]">{profile?.cpcb_epr_id || 'CPCB/EPR-EWASTE/2023/MH-0192'}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#6B7280] block">Facility Address:</span>
                <span className="font-bold text-[#191C1E]">{profile?.facility_address || 'Wagle Industrial Estate, Sector 2, Thane (W)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Materials I Process (Capability Configuration) */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#191C1E]">
                Materials I Process (Capability Matrix)
              </h2>
              <p className="text-xs text-[#6B7280]">
                Configure which scrap materials your facility is authorized and equipped to process
              </p>
            </div>
            <button
              onClick={handleSaveCapabilities}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-full shadow-xs transition touch-feedback disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Capabilities'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {RECYCLER_MATERIALS_LIST.map((mat) => {
              const isAccepted = capabilities[mat];
              const meta = RECYCLER_MATERIAL_DETAILS[mat];
              return (
                <button
                  type="button"
                  key={mat}
                  onClick={() => toggleCapability(mat)}
                  className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition touch-feedback ${
                    isAccepted
                      ? 'border-[#136B3B] bg-[#E6F4EA]/80 text-[#136B3B] shadow-xs'
                      : 'border-gray-200 bg-[#F8FAF9] text-[#6B7280] hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="text-xs font-bold text-[#191C1E]">{mat}</span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isAccepted ? 'bg-[#136B3B] text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isAccepted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </main>

      <BottomNav role="recycler" />
    </div>
  );
}
