'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';
import { Recycle, Lock, Mail, ArrowRight, Sparkles, AlertCircle, Info, ShieldCheck, Factory, Truck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const loginWithCredentials = async (loginEmail: string, loginPass: string, roleHint?: UserRole) => {
    setEmail(loginEmail);
    setPassword(loginPass);
    if (roleHint) setAutoLoggingRole(roleHint);
    setLoading(true);
    setErrorMsg('');

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const finalRole = (profile?.role as UserRole) || roleHint || 'household';
      router.push(routeForRole(finalRole));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleDemoClick = (role: UserRole) => {
    const demoEmail =
      role === 'recycler'
        ? 'recycler@scrapmax.demo'
        : role === 'admin'
        ? 'admin@scrapmax.demo'
        : role === 'collector'
        ? 'collector@scrapmax.demo'
        : 'household@scrapmax.demo';
    const demoPass = 'demo123456';
    loginWithCredentials(demoEmail, demoPass, role);
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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('household')}
                className="px-3 py-2.5 bg-white hover:bg-emerald-50 text-xs font-bold text-[#136B3B] rounded-xl border border-gray-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <span>🏠</span>
                <span>{autoLoggingRole === 'household' ? 'Logging in...' : 'Citizen'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('collector')}
                className="px-3 py-2.5 bg-white hover:bg-slate-50 text-xs font-bold text-[#191C1E] rounded-xl border border-gray-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Truck className="w-3.5 h-3.5 text-[#136B3B]" />
                <span>{autoLoggingRole === 'collector' ? 'Logging in...' : 'Collector'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('recycler')}
                className="px-3 py-2.5 bg-white hover:bg-amber-50 text-xs font-bold text-amber-900 rounded-xl border border-amber-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Factory className="w-3.5 h-3.5 text-amber-700" />
                <span>{autoLoggingRole === 'recycler' ? 'Logging in...' : 'Recycler'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('admin')}
                className="px-3 py-2.5 bg-white hover:bg-purple-50 text-xs font-bold text-purple-900 rounded-xl border border-purple-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>{autoLoggingRole === 'admin' ? 'Logging in...' : 'Admin'}</span>
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

        </div>
      </main>
    </div>
  );
}
