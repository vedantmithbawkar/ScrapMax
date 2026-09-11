'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import RequestCard from '@/components/request/RequestCard';
import { createClient } from '@/lib/supabase/client';
import { PickupRequest } from '@/types';
import { MapPin, History, Filter } from 'lucide-react';
import PersonalDashboard from '@/components/dashboard/PersonalDashboard';
import {
  triggerCollectorAcceptedNotification,
  triggerCollectorNearNotification,
  triggerPickupCompletedNotification,
  triggerPaymentReceivedNotification,
} from '@/lib/notification-service';

const DEMO_COLLECTOR_REQUESTS: PickupRequest[] = [
  {
    id: 'req-c301-demo-uuid',
    household_id: 'user-h101',
    household: {
      id: 'user-h101',
      full_name: 'Aarav Sharma (Flat 402, Green Heights)',
      phone: '+91 98201 54321',
      role: 'household',
    },
    status: 'pending',
    address: 'Flat 402, Green Heights, Main Market Road, Near City Center',
    latitude: 19.0760,
    longitude: 72.8777,
    scheduled_date: 'Today · 5:30 PM',
    notes: 'Items packed in bags in garage. Ring bell twice upon arrival.',
    total_estimated_weight_kg: 28.5,
    photos: [
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      {
        category: 'PAPER',
        approx_weight_kg: 15.0,
        photos: ['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80'],
      },
      {
        category: 'PLASTIC',
        approx_weight_kg: 13.5,
        photos: ['https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'req-c302-demo-uuid',
    household_id: 'user-h102',
    household: {
      id: 'user-h102',
      full_name: 'Priya Verma (Building 3B, Tech Park)',
      phone: '+91 98334 12789',
      role: 'household',
    },
    status: 'pending',
    address: 'Tower B, Station Road West, Commercial Tech Park',
    latitude: 19.0820,
    longitude: 72.8820,
    scheduled_date: 'Today · 6:00 PM',
    notes: 'Copper scrap and e-waste motherboards. Security pass needed at gate.',
    total_estimated_weight_kg: 42.0,
    photos: [
      'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    waste_items: [
      {
        category: 'E_WASTE',
        approx_weight_kg: 22.0,
        photos: ['https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80'],
      },
      {
        category: 'METAL',
        approx_weight_kg: 20.0,
        photos: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
];

export default function CollectorDashboard() {
  const [requests, setRequests] = useState<PickupRequest[]>(DEMO_COLLECTOR_REQUESTS);
  const [filterTab, setFilterTab] = useState<'available' | 'my_pickups'>('available');

  useEffect(() => {
    async function loadCollectorData() {
      // 1. Check local pickup requests created by households
      try {
        const raw = localStorage.getItem('local_pickup_requests');
        if (raw) {
          const local = JSON.parse(raw);
          if (Array.isArray(local) && local.length > 0) {
            setRequests((prev) => {
              const combined = [...local, ...prev];
              const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
              return unique as PickupRequest[];
            });
          }
        }
      } catch (err) {
        console.warn('Local request load notice:', err);
      }

      // 2. Query Supabase
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('pickup_requests')
          .select('*, waste_items(*)')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setRequests((prev) => {
            const combined = [...(data as PickupRequest[]), ...prev];
            const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
            return unique as PickupRequest[];
          });
        }
      } catch (err) {
        console.warn('Supabase collector load notice:', err);
      }
    }
    loadCollectorData();
  }, []);

  const handleStatusUpdate = async (requestId: string, newStatus: PickupRequest['status']) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const collectorObj = {
      id: user?.id || 'collector-c201',
      full_name: 'Ramesh Kumar (Verified Kabadiwala)',
      phone: '+91 98201 45892',
      role: 'collector' as const,
      rating: 4.9,
      completed_pickups: 126,
    };

    // Trigger live smart notifications
    if (newStatus === 'accepted') {
      triggerCollectorAcceptedNotification('Ramesh Kumar (Verified Kabadiwala)');
    } else if (newStatus === 'in_progress') {
      triggerCollectorNearNotification(500);
    } else if (newStatus === 'completed') {
      triggerPickupCompletedNotification();
    }

    // Local state update
    setRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: newStatus,
              collector_id: collectorObj.id,
              collector: collectorObj,
              updated_at: new Date().toISOString(),
            }
          : req
      );
      try {
        localStorage.setItem('local_pickup_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Update in Supabase
    try {
      await supabase
        .from('pickup_requests')
        .update({
          status: newStatus,
          collector_id: collectorObj.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase status update notice:', err);
    }
  };

  const handleCompletePayment = async (requestId: string, payment: PickupRequest['payment']) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Trigger payment received notification
    if (payment) {
      triggerPaymentReceivedNotification(payment.totalAmount, payment.method?.toUpperCase() || 'UPI');
    }
    triggerPickupCompletedNotification();

    try {
      await supabase
        .from('pickup_requests')
        .update({
          status: 'completed',
          collector_id: user?.id || 'demo-collector-id',
          total_estimated_weight_kg: payment?.items.reduce((a, c) => a + c.verifiedWeightKg, 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
    } catch (err) {
      console.warn('Supabase payment complete notice:', err);
    }

    setRequests((prev) => {
      const updated = prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status: 'completed' as const,
              collector_id: user?.id || 'demo-collector-id',
              payment,
              total_estimated_weight_kg: payment?.items.reduce((a, c) => a + c.verifiedWeightKg, 0),
            }
          : req
      );
      try {
        localStorage.setItem('local_pickup_requests', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const filteredRequests = requests.filter((r) => {
    if (filterTab === 'available') return r.status === 'pending';
    return r.status !== 'pending';
  });

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* Header Hero Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Scrap Collector Portal</span>
            </h1>
            <p className="text-sm text-[#A6D5B8]">
              Browse household waste pickup requests, accept jobs, and navigate route maps.
            </p>
          </div>

          <Link
            href="/collector/map"
            className="z-10 flex items-center gap-2 px-5 py-3 bg-white text-[#136B3B] font-bold rounded-full text-xs shadow-xs hover:bg-gray-50 transition"
          >
            <MapPin className="w-4 h-4" />
            <span>Open Map Route</span>
          </Link>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Personal Recycling Dashboard for Collector */}
        <PersonalDashboard role="collector" />

        {/* Tab Filters */}
        <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
          <button
            onClick={() => setFilterTab('available')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              filterTab === 'available'
                ? 'bg-[#EAE6F8] text-[#191C1E] shadow-xs'
                : 'text-[#6B7280] hover:text-[#191C1E] hover:bg-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Available Nearby Pickups ({requests.filter((r) => r.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setFilterTab('my_pickups')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              filterTab === 'my_pickups'
                ? 'bg-[#EAE6F8] text-[#191C1E] shadow-xs'
                : 'text-[#6B7280] hover:text-[#191C1E] hover:bg-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>My Active & Past Pickups ({requests.filter((r) => r.status !== 'pending').length})</span>
          </button>
        </div>

        {/* Feed List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-3xl text-[#6B7280] text-sm">
            No pickup requests in this view. Check back soon for new household submissions!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                userRole="collector"
                onStatusUpdate={handleStatusUpdate}
                onCompletePayment={handleCompletePayment}
              />
            ))}
          </div>
        )}

      </main>

      <BottomNav role="collector" />
    </div>
  );
}
