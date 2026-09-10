'use client';

import React, { useEffect, useState } from 'react';
import {
  SmartNotification,
  subscribeToNotificationToast,
} from '@/lib/notification-service';
import { Truck, MapPin, CheckCircle2, IndianRupee, TrendingUp, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function NotificationToast() {
  const [activeToast, setActiveToast] = useState<SmartNotification | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToNotificationToast((notif) => {
      setActiveToast(notif);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'collector_accepted':
        return <Truck className="w-5 h-5 text-[#136B3B]" />;
      case 'collector_near':
        return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'pickup_completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'payment_received':
        return <IndianRupee className="w-5 h-5 text-amber-600" />;
      case 'price_alert':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-[#136B3B]" />;
    }
  };

  const getBg = () => {
    switch (activeToast.category) {
      case 'pickup':
        return 'bg-emerald-50 border-emerald-200';
      case 'payment':
        return 'bg-amber-50 border-amber-200';
      case 'market':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] animate-in slide-in-from-top-4 fade-in duration-300">
      <div
        className={`p-4 rounded-2xl shadow-xl border ${getBg()} bg-white/95 backdrop-blur-md flex items-start gap-3 relative overflow-hidden`}
      >
        <div className="w-9 h-9 rounded-xl bg-white shadow-2xs flex items-center justify-center flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        <div className="flex-1 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#136B3B]">
              ScrapMax Alert
            </span>
            <span className="text-[10px] text-gray-400">· Just now</span>
          </div>
          <h4 className="text-sm font-bold text-[#191C1E] mt-0.5 leading-snug">
            {activeToast.title}
          </h4>
          <p className="text-xs text-[#526056] mt-1 leading-relaxed">
            {activeToast.message}
          </p>

          {activeToast.actionUrl && (
            <Link
              href={activeToast.actionUrl}
              onClick={() => setActiveToast(null)}
              className="inline-flex items-center gap-1 mt-2.5 text-xs font-bold text-[#136B3B] hover:underline"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Animated 5s countdown line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
          <div className="h-full bg-[#136B3B] animate-[shrink_5.5s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
}
