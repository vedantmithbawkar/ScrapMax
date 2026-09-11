'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SmartNotification,
  NotificationCategory,
  getStoredNotifications,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  isPushNotificationSupported,
  getNotificationPermission,
  requestPushPermission,
  triggerCollectorAcceptedNotification,
  triggerCollectorNearNotification,
  triggerPickupCompletedNotification,
  triggerPaymentReceivedNotification,
  triggerPriceAlertNotification,
} from '@/lib/notification-service';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Truck,
  MapPin,
  CheckCircle2,
  IndianRupee,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | NotificationCategory>('all');
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setNotifications(getStoredNotifications());
    setIsSupported(isPushNotificationSupported());
    setPushStatus(getNotificationPermission());

    const unsubscribe = subscribeToNotifications((updated) => {
      setNotifications(updated);
    });

    return () => unsubscribe();
  }, []);

  const handleRequestPush = async () => {
    const result = await requestPushPermission();
    setPushStatus(result);
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'collector_accepted':
        return <Truck className="w-4 h-4 text-[#136B3B]" />;
      case 'collector_near':
        return <MapPin className="w-4 h-4 text-blue-600" />;
      case 'pickup_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'payment_received':
        return <IndianRupee className="w-4 h-4 text-amber-600" />;
      case 'price_alert':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-[#136B3B]" />;
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop overlay dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Body */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#191C1E]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#136B3B] text-white">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-[#526056]">Real-time PWA and pickup alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                title="Mark all as read"
                className="p-2 text-gray-500 hover:text-[#136B3B] hover:bg-[#E6F4EA] rounded-xl transition"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => clearAllNotifications()}
                title="Clear all"
                className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* PWA Browser Push Permission Banner */}
          {isSupported && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#E6F4EA] to-[#F2F9F4] border border-[#A6D5B8] flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#136B3B]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Browser Push Notifications</span>
                </div>
                <p className="text-[11px] text-[#526056] leading-relaxed">
                  {pushStatus === 'granted'
                    ? 'Push alerts are active! You will receive collector arrivals and price updates even when PWA is in background.'
                    : pushStatus === 'denied'
                    ? 'Notifications are blocked in browser settings. Enable them in site settings for background updates.'
                    : 'Get native mobile/desktop alerts when a collector is 500m away or payment is received.'}
                </p>
              </div>

              {pushStatus === 'default' && (
                <button
                  type="button"
                  onClick={handleRequestPush}
                  className="flex-shrink-0 px-3 py-1.5 bg-[#136B3B] hover:bg-[#0F5730] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Enable Push
                </button>
              )}

              {pushStatus === 'granted' && (
                <span className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-[#136B3B] bg-white/80 px-2 py-1 rounded-lg border border-[#A6D5B8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] animate-pulse" />
                  Active
                </span>
              )}
            </div>
          )}

          {/* Quick Simulation Bar (For live testing all 5 notification scenarios) */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#191C1E]">
                <Sparkles className="w-3.5 h-3.5 text-[#136B3B]" />
                <span>Simulate Live Smart Notifications</span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">Click to test</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => triggerCollectorAcceptedNotification('Verified Scrap Collector')}
                className="p-2 text-left bg-white hover:bg-emerald-50/70 border border-gray-200 rounded-xl transition group text-xs flex items-center gap-2"
              >
                <Truck className="w-3.5 h-3.5 text-[#136B3B] group-hover:scale-110 transition" />
                <span className="font-semibold text-gray-800 text-[11px] truncate">Collector Accepted</span>
              </button>

              <button
                type="button"
                onClick={() => triggerCollectorNearNotification(500)}
                className="p-2 text-left bg-white hover:bg-blue-50/70 border border-gray-200 rounded-xl transition group text-xs flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition" />
                <span className="font-semibold text-gray-800 text-[11px] truncate">Collector 500m Away</span>
              </button>

              <button
                type="button"
                onClick={() => triggerPickupCompletedNotification(18.5, 148)}
                className="p-2 text-left bg-white hover:bg-emerald-50/70 border border-gray-200 rounded-xl transition group text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition" />
                <span className="font-semibold text-gray-800 text-[11px] truncate">Pickup Completed</span>
              </button>

              <button
                type="button"
                onClick={() => triggerPaymentReceivedNotification(320.0, 'UPI')}
                className="p-2 text-left bg-white hover:bg-amber-50/70 border border-gray-200 rounded-xl transition group text-xs flex items-center gap-2"
              >
                <IndianRupee className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition" />
                <span className="font-semibold text-gray-800 text-[11px] truncate">Payment Received</span>
              </button>

              <button
                type="button"
                onClick={() => triggerPriceAlertNotification('Plastic', 22)}
                className="col-span-2 p-2 text-left bg-white hover:bg-purple-50/70 border border-gray-200 rounded-xl transition group text-xs flex items-center gap-2"
              >
                <TrendingUp className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition" />
                <span className="font-semibold text-gray-800 text-[11px] truncate">Plastic Prices Increased Today (+10%)</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'pickup', label: 'Pickups' },
                { id: 'payment', label: 'Payments' },
                { id: 'market', label: 'Market' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 rounded-lg text-center transition ${
                  activeTab === tab.id
                    ? 'bg-white text-[#191C1E] shadow-2xs font-extrabold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="space-y-2.5">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                  <Bell className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#191C1E]">No notifications yet</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Click any of the simulation buttons above to test live push alerts.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    notif.read
                      ? 'bg-white border-gray-100 opacity-80 hover:opacity-100'
                      : 'bg-emerald-50/40 border-[#A6D5B8]/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-2xs border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className="text-xs font-bold text-[#191C1E] leading-snug flex items-center gap-1.5">
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#136B3B] inline-block" />
                          )}
                          <span className="truncate">{notif.title}</span>
                        </h5>
                        <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-[#526056] mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.actionUrl && (
                        <div className="mt-2 pt-2 border-t border-gray-100/80 flex items-center justify-between">
                          <Link
                            href={notif.actionUrl}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#136B3B] hover:underline"
                          >
                            <span>Open details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          <span className="text-[10px] uppercase font-bold text-gray-400">
                            {notif.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
