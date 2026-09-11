'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';
import {
  Recycle,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Info,
  ShieldCheck,
  Factory,
  Truck,
  CheckCircle2,
  KeyRound,
  Loader2,
  Fingerprint,
  X,
} from 'lucide-react';
import {
  formatAadhaarInput,
  maskAadhaar,
  isCollectorAadhaarVerified,
  markCollectorAadhaarVerified,
} from '@/lib/aadhaar-service';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [autoLoggingRole, setAutoLoggingRole] = useState<UserRole | null>(null);

  const routeForRole = (role: UserRole) => {
    switch (role) {
      case 'recycler':
        return '/recycler';
      case 'admin':
        return '/admin';
      case 'collector':
        return '/collector';
      default:
        return '/household';
    }
  };

  // Aadhaar Login Gate State for Collectors
  const [showAadhaarGateModal, setShowAadhaarGateModal] = useState(false);
  const [pendingCollectorUser, setPendingCollectorUser] = useState<{ id: string; email: string; phone?: string } | null>(null);
  const [gateAadhaarInput, setGateAadhaarInput] = useState('');
  const [gateAadhaarOtp, setGateAadhaarOtp] = useState('');
  const [gateTxnId, setGateTxnId] = useState('');
  const [gateOtpSent, setGateOtpSent] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateNotice, setGateNotice] = useState<string | null>(null);

  const handleRoleRouting = async (user: any, profileRole?: string, roleHint?: UserRole) => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, aadhaar_verified, aadhaar_number, full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    const finalRole: UserRole = (profile?.role as UserRole) || roleHint || 'household';

    if (finalRole === 'admin') {
      router.push('/admin');
      return;
    }

    if (finalRole === 'recycler') {
      router.push('/recycler');
      return;
    }

    if (finalRole === 'collector') {
      const isVerified = isCollectorAadhaarVerified(
        user.email,
        profile?.aadhaar_verified,
        user.user_metadata?.aadhaar_verified
      );

      if (!isVerified) {
        setPendingCollectorUser({
          id: user.id,
          email: user.email || '',
          phone: profile?.phone || user.user_metadata?.phone,
        });
        setShowAadhaarGateModal(true);
        setLoading(false);
        setAutoLoggingRole(null);
        setErrorMsg('🛡️ Aadhaar Verification Required: Scrap Collectors must complete UIDAI Aadhaar e-KYC verification before accessing the collector dashboard.');
        return;
      }

      router.push('/collector');
      return;
    }

    router.push('/household');
  };

  const loginWithCredentials = async (loginEmail: string, loginPass: string, roleHint?: UserRole) => {
    setEmail(loginEmail);
    setPassword(loginPass);
    if (roleHint) setAutoLoggingRole(roleHint);
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPass,
    });

    if (error) {
      // If Supabase credentials fail for demo accounts, allow instant 1-click exploration
      if (roleHint) {
        localStorage.setItem(
          'scrapmax_demo_user',
          JSON.stringify({
            email: loginEmail,
            role: roleHint,
            full_name:
              roleHint === 'recycler'
                ? 'Vikram Joshi (Green India E-Waste)'
                : roleHint === 'admin'
                ? 'ScrapMax Compliance Administrator'
                : roleHint === 'collector'
                ? 'Ramesh Kumar (Verified Kabadiwala)'
                : 'Sahil Citizen',
          })
        );
        router.push(routeForRole(roleHint));
        return;
      }

      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg(
          'Invalid login credentials. Demo account is not yet in your Supabase database. Please create an account on the Register page or use the 1-click demo buttons below.'
        );
      } else {
        setErrorMsg(error.message);
      }
      setLoading(false);
      setAutoLoggingRole(null);
    } else if (data.user) {
      await handleRoleRouting(data.user, undefined, roleHint);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleDemoClick = async (role: UserRole) => {
    const demoEmail =
      role === 'recycler'
        ? 'recycler@scrapmax.demo'
        : role === 'admin'
        ? 'admin@scrapmax.demo'
        : role === 'collector'
        ? 'collector@scrapmax.demo'
        : 'household@scrapmax.demo';
    const demoPass = 'demo123456';
    await loginWithCredentials(demoEmail, demoPass, role);
  };

  // Gate Modal OTP Handlers
  const handleGateSendOtp = async () => {
    setGateLoading(true);
    setGateError(null);
    setGateNotice(null);

    const clean = gateAadhaarInput.replace(/\s+/g, '');
    if (clean.length !== 12) {
      setGateError('Please enter a valid 12-digit Aadhaar number.');
      setGateLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-otp',
          aadhaarNumber: clean,
          phone: pendingCollectorUser?.phone || '+91 9876543210',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setGateError(data.error || 'Failed to send verification OTP.');
      } else {
        setGateTxnId(data.txnId || '');
        setGateOtpSent(true);
        setGateNotice(data.message || 'OTP dispatched to your Aadhaar-linked mobile.');
      }
    } catch (err: any) {
      setGateError(err.message || 'Network error while contacting Aadhaar API.');
    } finally {
      setGateLoading(false);
    }
  };

  const handleGateVerifyOtpAndLogin = async () => {
    setGateLoading(true);
    setGateError(null);

    if (!gateAadhaarOtp || gateAadhaarOtp.trim().length < 6) {
      setGateError('Please enter the 6-digit Aadhaar OTP.');
      setGateLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          txnId: gateTxnId,
          otp: gateAadhaarOtp.trim(),
          aadhaarNumber: gateAadhaarInput.replace(/\s+/g, ''),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setGateError(data.error || 'Invalid OTP. Please check the code.');
        setGateLoading(false);
        return;
      }

      const masked = data.maskedAadhaar || maskAadhaar(gateAadhaarInput);
      const verifiedAt = data.aadhaarVerifiedAt || new Date().toISOString();

      // Update Supabase profile
      if (pendingCollectorUser?.id) {
        const supabase = createClient();
        try {
          await supabase
            .from('profiles')
            .update({
              aadhaar_verified: true,
              aadhaar_number: masked,
              aadhaar_verified_at: verifiedAt,
            })
            .eq('id', pendingCollectorUser.id);
        } catch (err) {
          console.warn('Profile update notice:', err);
        }
      }

      // Mark verified in local cache
      if (pendingCollectorUser?.email) {
        markCollectorAadhaarVerified(pendingCollectorUser.email, masked, {
          email: pendingCollectorUser.email,
          phone: pendingCollectorUser.phone,
        });
      }

      setShowAadhaarGateModal(false);
      router.push('/collector');
    } catch (err: any) {
      setGateError(err.message || 'Verification failed.');
    } finally {
      setGateLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-[#E6F4EA] border border-[#A6D5B8] rounded-2xl text-[#136B3B] mb-1">
              <Recycle className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h2 className="text-2xl font-bold text-[#191C1E] tracking-tight">Welcome to ScrapMax</h2>
            <p className="text-xs text-[#6B7280]">Sign in to the circular scrap &amp; recycling marketplace</p>
          </div>

          {/* Quick Demo 4-Role Buttons */}
          <div className="p-3.5 bg-[#F8FAF9] border border-gray-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[#526056] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#136B3B]" />
              <span>1-Click Demo Login by Role:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('household')}
                className="px-2.5 py-2 bg-white hover:bg-emerald-50 text-xs font-bold text-[#136B3B] rounded-xl border border-gray-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <span>🏠</span>
                <span className="truncate">{autoLoggingRole === 'household' ? 'Logging in...' : 'Citizen'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('collector')}
                className="px-2.5 py-2 bg-white hover:bg-slate-50 text-xs font-bold text-[#191C1E] rounded-xl border border-gray-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <Truck className="w-3.5 h-3.5 text-[#136B3B]" />
                <span className="truncate">{autoLoggingRole === 'collector' ? 'Logging in...' : 'Collector'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('recycler')}
                className="px-2.5 py-2 bg-white hover:bg-amber-50 text-xs font-bold text-amber-900 rounded-xl border border-amber-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <Factory className="w-3.5 h-3.5 text-amber-700" />
                <span className="truncate">{autoLoggingRole === 'recycler' ? 'Logging in...' : 'Recycler'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('admin')}
                className="px-2.5 py-2 bg-white hover:bg-purple-50 text-xs font-bold text-purple-900 rounded-xl border border-purple-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span className="truncate">{autoLoggingRole === 'admin' ? 'Logging in...' : 'Admin'}</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] transition"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191C1E] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] transition"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#136B3B] hover:bg-[#0F5730] text-white font-bold rounded-full shadow-sm transition touch-feedback"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#6B7280]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#136B3B] font-bold hover:underline">
              Register as Citizen, Collector, or Recycler
            </Link>
          </div>

          {/* Collapsible Supabase Troubleshooting Box */}
          <div className="pt-2 border-t border-gray-100">
            <details className="text-xs text-[#526056] space-y-2 cursor-pointer group">
              <summary className="font-bold text-[#136B3B] flex items-center justify-between group-hover:underline">
                <span>🔧 Supabase Setup &amp; Fix Guide</span>
                <span className="text-[11px] text-gray-400">Expand ▼</span>
              </summary>
              <div className="pt-2 space-y-2.5 text-[11.5px] leading-relaxed text-[#4A5568] bg-[#F8FAF9] p-3 rounded-xl border border-gray-200">
                <p>
                  <strong>Why does login say &quot;Invalid login credentials&quot;?</strong><br />
                  Demo accounts are not pre-loaded in your Supabase project&apos;s <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">auth.users</code> table.
                </p>
                <div className="space-y-1.5">
                  <p className="font-bold text-[#191C1E]">Two 30-second solutions:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>
                      <strong>Option A (Recommended):</strong> In your{' '}
                      <a
                        href="https://supabase.com/dashboard/project/qaoczojfnraivdhbxsab/auth/providers"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#136B3B] font-bold underline"
                      >
                        Supabase Dashboard &gt; Auth Providers &gt; Email
                      </a>
                      , turn <strong>OFF &quot;Confirm email&quot;</strong> and save. Then register any account instantly!
                    </li>
                    <li>
                      <strong>Option B (Direct Add):</strong> In{' '}
                      <a
                        href="https://supabase.com/dashboard/project/qaoczojfnraivdhbxsab/auth/users"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#136B3B] font-bold underline"
                      >
                        Supabase Dashboard &gt; Users
                      </a>
                      , click <em>&quot;Add user&quot;</em> with email <code className="bg-gray-200 px-1 rounded">household@scrapmax.demo</code> and password <code className="bg-gray-200 px-1 rounded">demo123456</code> with <strong>&quot;Auto Confirm User&quot;</strong> checked.
                    </li>
                  </ol>
                </div>
              </div>
            </details>
          </div>

        </div>

        {/* Aadhaar Verification Gate Modal for Collectors */}
        {showAadhaarGateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-100 space-y-5 relative">
              <button
                type="button"
                onClick={() => setShowAadhaarGateModal(false)}
                className="absolute right-4 top-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                  <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
                </div>
                <h3 className="text-xl font-bold text-[#191C1E] tracking-tight">
                  Aadhaar Verification Required
                </h3>
                <p className="text-xs text-[#526056] leading-relaxed max-w-xs mx-auto">
                  Scrap Collectors must complete mandatory UIDAI Aadhaar verification before accessing the ScrapMax Collector Portal.
                </p>
                {pendingCollectorUser?.email && (
                  <p className="text-[11px] font-mono text-gray-500 bg-gray-50 py-1 px-2 rounded-lg border border-gray-100 inline-block">
                    Account: {pendingCollectorUser.email}
                  </p>
                )}
              </div>

              <div className="space-y-3 bg-[#F8FAF9] p-4 rounded-2xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-[#191C1E] mb-1.5">
                    12-Digit Aadhaar Card Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={14}
                        value={gateAadhaarInput}
                        onChange={(e) => setGateAadhaarInput(formatAadhaarInput(e.target.value))}
                        placeholder="XXXX XXXX XXXX"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono text-[#191C1E] tracking-wider placeholder-gray-400 focus:outline-none focus:border-[#136B3B]"
                      />
                      <Fingerprint className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                    <button
                      type="button"
                      disabled={gateLoading || gateAadhaarInput.replace(/\s+/g, '').length !== 12}
                      onClick={handleGateSendOtp}
                      className="px-3.5 py-2.5 bg-[#136B3B] hover:bg-[#0F5730] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shrink-0"
                    >
                      {gateLoading && !gateOtpSent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{gateOtpSent ? 'Resend' : 'Get OTP'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {gateOtpSent && (
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#191C1E]">
                        Enter 6-Digit Aadhaar OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setGateAadhaarOtp('123456')}
                        className="text-[10px] text-[#136B3B] font-bold hover:underline"
                      >
                        ⚡ Fill Test OTP (123456)
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={gateAadhaarOtp}
                        onChange={(e) => setGateAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono tracking-widest text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B]"
                      />
                      <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                )}

                {gateNotice && (
                  <p className="text-[11.5px] text-emerald-700 font-medium">{gateNotice}</p>
                )}
                {gateError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{gateError}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={gateLoading || !gateOtpSent || gateAadhaarOtp.length < 6}
                  onClick={handleGateVerifyOtpAndLogin}
                  className="w-full py-3.5 bg-[#136B3B] hover:bg-[#0F5730] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-full text-xs transition flex items-center justify-center gap-2 shadow-xs"
                >
                  {gateLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify Aadhaar &amp; Enter Collector Portal</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowAadhaarGateModal(false)}
                  className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-800 font-medium"
                >
                  Cancel &amp; Return
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
