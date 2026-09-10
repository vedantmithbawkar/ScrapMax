'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { RecyclingStore } from '@/lib/recycling-store-service';

interface StoreMapContainerProps {
  stores: RecyclingStore[];
  selectedStore: RecyclingStore | null;
  onSelectStore: (store: RecyclingStore) => void;
  userLocation: [number, number];
  zoom?: number;
  className?: string;
}

const DynamicStoreMap = dynamic(() => import('./StoreMapCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] bg-slate-100 animate-pulse rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3 border border-gray-200">
      <div className="w-10 h-10 border-4 border-[#136B3B] border-t-transparent rounded-full animate-spin" />
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-[#191C1E]">Loading Recycling Store Map...</p>
        <p className="text-xs text-gray-500">Connecting to OpenStreetMap live nodes</p>
      </div>
    </div>
  ),
});

export default function StoreMapContainer(props: StoreMapContainerProps) {
  return <DynamicStoreMap {...props} />;
}
