'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { RecyclerProfile, RecyclerVerificationStatus } from '@/types';
import { getAllRecyclers, updateRecyclerVerification } from '@/lib/recycler-service';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  MapPin,
  FileCheck2,
  Filter,
  Eye,
  X,
  AlertCircle,
  Search,
} from 'lucide-react';

export default function AdminRecyclerManagementPage() {
  const [recyclers, setRecyclers] = useState<RecyclerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecycler, setSelectedRecycler] = useState<RecyclerProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadRecyclers = async () => {
    setLoading(true);
    try {
      const data = await getAllRecyclers();
      setRecyclers(data);
    } catch (err) {
      console.warn('Load recyclers for admin notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecyclers();
  }, []);

  const handleUpdateStatus = async (
    recyclerId: string,
    newStatus: RecyclerVerificationStatus,
    notes?: string
  ) => {
    try {
      await updateRecyclerVerification(recyclerId, newStatus, notes);
      setToastMsg(`Recycler status updated to ${newStatus.toUpperCase()}!`);
      setTimeout(() => setToastMsg(''), 4000);
      setSelectedRecycler(null);
      loadRecyclers();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Error updating status');
    }
  };

  const filtered = recyclers.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.verification_status === filterStatus;
    const matchesSearch =
      r.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.registration_number && r.registration_number.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Admin Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 sm:p-7 bg-purple-900 text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2.5 py-0.5 rounded-full">
              Compliance &amp; Moderation
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-purple-300" />
              <span>Recycler Verification &amp; Facility Moderation</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-200">
              Inspect SPCB pollution board credentials, verify EPR registration IDs, and moderate marketplace eligibility
            </p>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, city, or registration ID..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs text-[#191C1E] focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {['all', 'pending', 'verified', 'rejected', 'suspended'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : 'text-[#6B7280] hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'All Accounts' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Recyclers Table */}
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAF9] text-[#6B7280] uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3.5">Facility / Company</th>
                  <th className="px-4 py-3.5">Business Type</th>
                  <th className="px-4 py-3.5">Location</th>
                  <th className="px-4 py-3.5">SPCB / EPR ID</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-[#191C1E]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#6B7280]">
                      Loading recycler facilities...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#6B7280]">
                      No recyclers matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FAF9] transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-[#191C1E]">{r.company_name}</div>
                        <span className="text-[11px] text-[#6B7280]">
                          Auth: {r.authorized_person_name} ({r.business_email})
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px] font-semibold">
                          {r.business_type}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div>{r.city}, {r.state}</div>
                        <span className="text-[11px] text-[#6B7280]">{r.pincode}</span>
                      </td>

                      <td className="px-4 py-4 font-mono text-[11px] text-[#526056]">
                        {r.registration_number || r.cpcb_epr_id || 'Pending submission'}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.verification_status === 'verified'
                              ? 'bg-emerald-100 text-emerald-900'
                              : r.verification_status === 'pending'
                              ? 'bg-amber-100 text-amber-900'
                              : r.verification_status === 'suspended'
                              ? 'bg-gray-200 text-gray-800'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {r.verification_status === 'verified' ? '🟢 Verified' : r.verification_status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedRecycler(r)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-purple-50 text-gray-800 hover:text-purple-900 text-xs font-bold rounded-xl transition flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          {r.verification_status !== 'verified' && (
                            <button
                              onClick={() => handleUpdateStatus(r.id, 'verified', 'Approved by ScrapMax Compliance')}
                              className="px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* INSPECT & VERIFY MODAL */}
      {selectedRecycler && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  Compliance Inspection
                </span>
                <h3 className="text-lg font-bold text-[#191C1E] mt-1">
                  {selectedRecycler.company_name}
                </h3>
              </div>
              <button onClick={() => setSelectedRecycler(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="space-y-3 text-xs text-[#526056]">
              <div className="p-3 bg-[#F8FAF9] rounded-xl space-y-1">
                <span className="font-bold text-[#191C1E] block">Company &amp; Authorized Representative:</span>
                <p>Person: {selectedRecycler.authorized_person_name} ({selectedRecycler.designation || 'Representative'})</p>
                <p>Contact: {selectedRecycler.business_email} · {selectedRecycler.business_phone}</p>
                <p>Type: {selectedRecycler.business_type}</p>
              </div>

              <div className="p-3 bg-[#F8FAF9] rounded-xl space-y-1">
                <span className="font-bold text-[#191C1E] block">Registered &amp; Facility Address:</span>
                <p>Registered: {selectedRecycler.registered_address}</p>
                <p>Facility: {selectedRecycler.facility_address}</p>
                <p>Location: {selectedRecycler.city}, {selectedRecycler.state} — PIN {selectedRecycler.pincode}</p>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1 text-purple-950">
                <span className="font-bold text-purple-950 block">Regulatory Compliance Credentials:</span>
                <p>SPCB: {selectedRecycler.spcb || 'Not specified'}</p>
                <p>Authorization ID: {selectedRecycler.registration_number || 'Pending'}</p>
                <p>CPCB EPR Reg ID: {selectedRecycler.cpcb_epr_id || 'Pending'}</p>
                <p>GSTIN: {selectedRecycler.gstin || 'Not submitted'} · PAN: {selectedRecycler.pan || 'Not submitted'}</p>
              </div>
            </div>

            {/* Verification Actions */}
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleUpdateStatus(selectedRecycler.id, 'suspended', 'Temporarily suspended by Admin')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
              >
                Suspend Account
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedRecycler.id, 'rejected', 'Regulatory criteria insufficient')}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRecycler.id, 'verified', 'Approved by ScrapMax Compliance')}
                  className="px-5 py-2 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Approve Recycler (Grant 🟢 Verified)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="admin" />
    </div>
  );
}
