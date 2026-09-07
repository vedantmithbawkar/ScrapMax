'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const DynamicMap = dynamic(() => import('./LeafletMapCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-900 animate-pulse rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-800">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-medium">Loading Interactive Map...</p>
    </div>
  ),
});

export default DynamicMap;
