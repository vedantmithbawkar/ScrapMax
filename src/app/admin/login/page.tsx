'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import { Shield, Lock, Mail, KeyRound, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { loginAdmin } from '@/lib/admin-auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please provide both Administrator Email and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginAdmin(identifier, password);
      if (res.success) {
        router.push('/admin');
      } else {
        setErrorMsg(res.error || 'Invalid administrator credentials.');
      }
    } catch (err: any) {
      setErrorMsg('An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          
          {/* Main Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden">
            
            {/* Ambient Purple Accent Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-100/60 rounded-full blur-2xl -z-1 pointer-events-none" />

            {/* Header / Shield Icon */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shadow-xs mb-3">
                <Shield className="w-7 h-7 stroke-[2.2]" />
              </div>
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 mb-1">
                Restricted Access
              </span>
              <h1 className="text-2xl font-black text-[#191C1E] tracking-tight">
                Admin Console Login
              </h1>
              <p className="text-xs text-[#6B7280] mt-1 max-w-xs leading-relaxed">
                Dedicated municipal administration credentials required. Normal users &amp; collectors cannot access this portal.
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1 leading-snug font-medium">
                  {errorMsg}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Admin Email */}
              <div>
                <label className="block text-xs font-bold text-[#191C1E] uppercase tracking-wider mb-1.5">
                  Admin Email / ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@scrapmax.gov.in"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F7F9FA] border border-gray-200 text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white transition shadow-2xs font-medium"
                  />
                </div>
              </div>

              {/* Admin Password */}
              <div>
                <label className="block text-xs font-bold text-[#191C1E] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#F7F9FA] border border-gray-200 text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white transition shadow-2xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-extrabold text-sm transition shadow-md flex items-center justify-center gap-2 touch-feedback mt-2"
              >
                {isLoading ? (
                  <span>Verifying Credentials…</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authenticate as Administrator</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <p className="text-[11px] text-[#6B7280]">
                Are you a citizen or collector?{' '}
                <Link href="/login" className="font-bold text-[#136B3B] hover:underline">
                  Go to Standard Login
                </Link>
              </p>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
