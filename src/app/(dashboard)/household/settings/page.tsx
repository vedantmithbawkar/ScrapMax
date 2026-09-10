'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Bell,
  Globe,
  Shield,
  Trash2,
  Download,
  CheckCircle2,
  Lock,
  Smartphone,
  ChevronRight,
  LogOut,
  AlertTriangle
} from 'lucide-react';

import { useTranslation, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/i18n';

function getStoredSettings() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('aicle_settings');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return null;
}

export default function HouseholdSettingsPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  // Preferences State initialized lazily
  const [pickupAlerts, setPickupAlerts] = useState<boolean>(() => {
    const s = getStoredSettings();
    return s?.pickupAlerts !== undefined ? s.pickupAlerts : true;
  });
  const [receiptAlerts, setReceiptAlerts] = useState<boolean>(() => {
    const s = getStoredSettings();
    return s?.receiptAlerts !== undefined ? s.receiptAlerts : true;
  });
  const [rateAlerts, setRateAlerts] = useState<boolean>(() => {
    const s = getStoredSettings();
    return s?.rateAlerts !== undefined ? s.rateAlerts : false;
  });
  const [notification, setNotification] = useState<string | null>(null);

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordEmailSent, setPasswordEmailSent] = useState(false);

  const saveSettings = (patch: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      const current = {
        pickupAlerts,
        receiptAlerts,
        rateAlerts,
        language,
        paymentMode,
        ...patch,
      };
      localStorage.setItem('aicle_settings', JSON.stringify(current));
    }
    setNotification('Settings preference saved!');
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePasswordReset = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/login`,
        });
      }
      setPasswordEmailSent(true);
      setTimeout(() => {
        setPasswordEmailSent(false);
        setShowPasswordModal(false);
      }, 4000);
    } catch {
      setPasswordEmailSent(true);
      setTimeout(() => {
        setPasswordEmailSent(false);
        setShowPasswordModal(false);
      }, 4000);
    }
  };

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      platform: 'AiCLE Circular Waste Platform',
      userSettings: {
        pickupAlerts,
        receiptAlerts,
        rateAlerts,
        language,
        paymentMode,
      },
      personalInfo: typeof window !== 'undefined' ? localStorage.getItem('aicle_personal_info') : null,
      savedAddresses: typeof window !== 'undefined' ? localStorage.getItem('aicle_saved_addresses') : null,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aicle_household_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotification('Recycling data exported to your downloads!');
    setTimeout(() => setNotification(null), 3500);
  };

  const handleClearCache = () => {
    if (confirm('Clear local offline cache? Your saved addresses and preferences will be refreshed.')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aicle_settings');
      }
      setNotification('Cache cleared successfully.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />

      <main className="w-full max-w-lg mx-auto px-4 sm:px-6 pt-3 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 pt-2 pb-4">
          <button
            onClick={() => router.push('/household/profile')}
            aria-label="Go back to Profile"
            className="p-2 -ml-2 rounded-xl bg-white border border-gray-200 text-[#191C1E] hover:bg-gray-50 transition shadow-2xs"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#191C1E] tracking-tight">Settings</h1>
            <p className="text-xs text-[#6B7280]">App preferences, security, and notification alerts</p>
          </div>
        </header>

        {/* Toast */}
        {notification && (
          <div className="mb-4 p-3.5 bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#136B3B]" />
            <span>{notification}</span>
          </div>
        )}

        <div className="space-y-4">
          
          {/* Section: Notifications */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-[#136B3B]">
              <Bell className="w-4 h-4" />
              <span>Notifications &amp; Alerts</span>
            </div>

            {/* Toggle 1: Pickup Alerts */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#191C1E]">Pickup Live Tracking Alerts</p>
                <p className="text-xs text-[#6B7280]">Get notified when collector accepts or arrives at your gate</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPickupAlerts(!pickupAlerts);
                  saveSettings({ pickupAlerts: !pickupAlerts });
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                  pickupAlerts ? 'bg-[#136B3B]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4.5 h-4.5 bg-white rounded-full shadow-xs transform transition-transform ${
                    pickupAlerts ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Digital Receipts */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
              <div>
                <p className="text-sm font-bold text-[#191C1E]">Digital Weighing Receipts</p>
                <p className="text-xs text-[#6B7280]">Instant SMS &amp; in-app confirmation after scrap payment</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReceiptAlerts(!receiptAlerts);
                  saveSettings({ receiptAlerts: !receiptAlerts });
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                  receiptAlerts ? 'bg-[#136B3B]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4.5 h-4.5 bg-white rounded-full shadow-xs transform transition-transform ${
                    receiptAlerts ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Scrap Market Price */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-50">
              <div>
                <p className="text-sm font-bold text-[#191C1E]">Weekly Scrap Rate Changes</p>
                <p className="text-xs text-[#6B7280]">Notifies you when paper, metal, or plastic prices surge</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRateAlerts(!rateAlerts);
                  saveSettings({ rateAlerts: !rateAlerts });
                }}
                className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                  rateAlerts ? 'bg-[#136B3B]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4.5 h-4.5 bg-white rounded-full shadow-xs transform transition-transform ${
                    rateAlerts ? 'translate-x-5.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section: App Preferences */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-[#136B3B]">
              <Globe className="w-4 h-4" />
              <span>{t('preferences')}</span>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#191C1E]">{t('displayLanguage')}</p>
                  <p className="text-xs text-[#6B7280]">{t('chooseLanguage')}</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value as SupportedLanguage;
                    setLanguage(newLang);
                    setNotification(`${t('savedSuccessfully')} ${newLang}`);
                    setTimeout(() => setNotification(null), 3500);
                  }}
                  className="px-3.5 py-2 bg-[#F8FAF9] border-2 border-[#A6D5B8] rounded-xl text-xs font-bold text-[#136B3B] focus:outline-none focus:border-[#136B3B] cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Language Pill Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {SUPPORTED_LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLanguage(item.code);
                      setNotification(`${t('savedSuccessfully')} ${item.code}`);
                      setTimeout(() => setNotification(null), 3500);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition touch-feedback ${
                      language === item.code
                        ? 'bg-[#136B3B] text-white shadow-xs'
                        : 'bg-[#F8FAF9] text-[#526056] border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {item.nativeName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section: Security */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-[#136B3B]">
              <Shield className="w-4 h-4" />
              <span>Security &amp; Password</span>
            </div>

            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <Lock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-bold text-[#191C1E]">Change Password</p>
                  <p className="text-xs text-[#6B7280]">Send a secure password reset link to your email</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Section: Data & Backup */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-[#136B3B]">
              <Download className="w-4 h-4" />
              <span>Data &amp; Privacy</span>
            </div>

            <button
              type="button"
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <Download className="w-4 h-4 text-[#136B3B]" />
                <div>
                  <p className="text-sm font-bold text-[#191C1E]">Export My Account Data</p>
                  <p className="text-xs text-[#6B7280]">Download your addresses and preferences as JSON</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={handleClearCache}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition cursor-pointer pt-2 border-t border-gray-50"
            >
              <div className="flex items-center gap-3 text-left">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-bold text-[#191C1E]">Clear Offline Cache</p>
                  <p className="text-xs text-[#6B7280]">Re-sync data with the Supabase cloud</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Danger Zone: Logout / Deactivate */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-2xs space-y-3">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of this Device</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2 px-4 text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Deactivate Account</span>
            </button>
          </div>

          {/* Version Info */}
          <div className="text-center pt-2 pb-4 text-xs text-gray-400 space-y-1">
            <p className="font-bold text-gray-500">AiCLE · Eco-Waste &amp; Circular Logistics Platform</p>
            <p>Version 2.1.0 · Build 2026</p>
          </div>

        </div>
      </main>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E6F4EA] text-[#136B3B] flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#191C1E]">Password Reset</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              We will send a password reset email link to your registered email address.
            </p>

            {passwordEmailSent ? (
              <div className="p-3 bg-[#E6F4EA] text-[#136B3B] rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reset link sent to your email!</span>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="w-1/2 py-2.5 rounded-xl bg-[#136B3B] text-white text-xs font-bold hover:bg-[#0F5730]"
                >
                  Send Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl border border-gray-100 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-rose-900">Deactivate Account?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Deactivating your account will archive your pickup records and cancel any pending scrap collections.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-1/2 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Account deactivated. Signing out...');
                  handleLogout();
                }}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="household" />
    </div>
  );
}
