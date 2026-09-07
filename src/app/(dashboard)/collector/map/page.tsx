'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import MapContainer from '@/components/map/MapContainer';
import RequestCard from '@/components/request/RequestCard';
import { PickupRequest } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Navigation, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const MOCK_MAP_REQUESTS: PickupRequest[] = [
  {
    id: 'req-map-001',
    household_id: 'user-h101',
    status: 'pending',
    address: 'Indiranagar 100ft Road, Bangalore',
    latitude: 12.9784,
    longitude: 77.6408,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Paper & plastic recyclables ready',
    total_estimated_weight_kg: 18.5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'PAPER', approx_weight_kg: 18.5 }],
  },
  {
    id: 'req-map-002',
    household_id: 'user-h102',
    status: 'pending',
    address: 'MG Road, Bangalore',
    latitude: 12.9756,
    longitude: 77.6068,
    scheduled_date: 'Today · 6:00 PM',
    notes: 'Electronic waste and computer scrap',
    total_estimated_weight_kg: 35.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'E_WASTE', approx_weight_kg: 35.0 }],
  },
  {
    id: 'req-map-003',
    household_id: 'user-h103',
    status: 'pending',
    address: 'Koramangala 5th Block, Bangalore',
    latitude: 12.9345,
    longitude: 77.6242,
    scheduled_date: 'Today · 6:30 PM',
    notes: 'Glass bottles and aluminum cans',
    total_estimated_weight_kg: 22.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [{ category: 'GLASS', approx_weight_kg: 22.0 }],
  },
];

export default function CollectorMapPage() {
  const [requests, setRequests] = useState<PickupRequest[]>(MOCK_MAP_REQUESTS);
  const [selectedReq, setSelectedReq] = useState<PickupRequest | null>(MOCK_MAP_REQUESTS[0]);

  useEffect(() => {
    async function loadLiveRequests() {
      const supabase = createClient();
      const { data } = await supabase
        .from('pickup_requests')
        .select('*, waste_items(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setRequests(data as PickupRequest[]);
        setSelectedReq(data[0] as PickupRequest);
      }
    }
    loadLiveRequests();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/collector"
              className="p-2 bg-white hover:bg-gray-50 text-[#191C1E] rounded-xl transition border border-gray-200 shadow-xs"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#191C1E] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#136B3B]" />
                <span>Pickup Route Map View</span>
              </h1>
              <p className="text-xs text-[#6B7280]">Interactive OpenStreetMap route navigation for collectors</p>
            </div>
          </div>
        </div>

        {/* Grid Split: Map on left, detail drawer on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
          
          <div className="lg:col-span-2 relative bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={13}
              requests={requests}
              onSelectRequest={(req) => setSelectedReq(req)}
              className="h-full min-h-[480px] w-full rounded-xl overflow-hidden"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
              Selected Pickup Details
            </h3>

            {selectedReq ? (
              <RequestCard
                request={selectedReq}
                userRole="collector"
                onStatusUpdate={(id, status) => {
                  alert(`Updated request #${id.slice(0, 8)} to ${status.toUpperCase()}`);
                }}
              />
            ) : (
              <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-2xl text-[#6B7280] text-sm">
                Click any pin marker on the map to inspect pickup details.
              </div>
            )}
          </div>

        </div>

      </main>

      <BottomNav role="collector" />
    </div>
  );
}
