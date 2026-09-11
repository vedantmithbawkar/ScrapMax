'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { getRecyclerSuppliers } from '@/lib/recycler-service';
import { RecyclerMaterial } from '@/types';
import {
  Users,
  ArrowLeft,
  Truck,
  Star,
  CheckCircle2,
  Phone,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SupplierItem {
  collector: {
    id: string;
    name: string;
    phone?: string;
    rating?: number;
  };
  totalQuantityKg: number;
  completedTransactions: number;
  materials: RecyclerMaterial[];
  lastTransactionDate: string;
}

export default function RecyclerSuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getRecyclerSuppliers('rec-001');
        setSuppliers(data as SupplierItem[]);
      } catch (err) {
        console.warn('Load suppliers notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
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
                Collector Supplier Network
              </h1>
              <p className="text-xs sm:text-sm text-[#6B7280]">
                Verified local collectors supplying recyclable material to your facility
              </p>
            </div>
            <span className="px-3.5 py-1.5 bg-emerald-50 text-[#136B3B] text-xs font-bold rounded-full border border-emerald-200 self-start sm:self-auto">
              {suppliers.length} Registered Suppliers
            </span>
          </div>
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#6B7280]">Loading supplier network...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-gray-200 rounded-3xl space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-bold text-[#191C1E]">No suppliers on record yet</h3>
            <p className="text-xs text-[#6B7280]">
              Collectors who complete material transactions with your facility will automatically appear in your network.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((item) => (
              <div
                key={item.collector.id}
                className="p-5 bg-white border border-gray-100 rounded-3xl shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#191C1E]">{item.collector.name}</h4>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Collector</span>
                        </span>
                      </div>
                    </div>

                    {item.collector.rating && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 text-xs font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{item.collector.rating}</span>
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-[#F8FAF9] rounded-2xl grid grid-cols-2 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-[#6B7280] font-bold block uppercase">Total Supplied</span>
                      <span className="text-sm font-black text-[#191C1E]">{item.totalQuantityKg.toFixed(1)} KG</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] font-bold block uppercase">Transactions</span>
                      <span className="text-sm font-black text-[#136B3B]">{item.completedTransactions}</span>
                    </div>
                  </div>

                  {/* Materials supplied chips */}
                  <div>
                    <span className="text-[10px] font-bold text-[#6B7280] block mb-1">Materials Supplied:</span>
                    <div className="flex flex-wrap gap-1">
                      {item.materials.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md bg-gray-100 text-[#191C1E] text-[10px] font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <span>Last Activity:</span>
                  <span className="font-semibold text-[#191C1E]">
                    {new Date(item.lastTransactionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      <BottomNav role="recycler" />
    </div>
  );
}
