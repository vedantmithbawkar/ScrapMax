'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import { createClient } from '@/lib/supabase/client';
import { Recycle, Lock, Mail, ArrowRight, Sparkles, AlertCircle, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [autoLoggingRole, setAutoLoggingRole] = useState<'household' | 'collector' | null>(null);

  const loginWithCredentials = async (loginEmail: string, loginPass: string, roleHint?: 'household' | 'collector') => {
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
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg(
          'Invalid login credentials. Demo account is not yet in your Supabase database. Please run the SQL seed script in Supabase SQL Editor, or create the account on the Register page.'
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

      const finalRole = profile?.role || roleHint || 'household';
      if (finalRole === 'admin') {
        router.push('/admin');
      } else if (finalRole === 'collector') {
        router.push('/collector');
      } else {
        router.push('/household');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleDemoClick = async (role: 'household' | 'collector') => {
    setAutoLoggingRole(role);
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const primaryEmail = role === 'household' ? 'household@scrapmax.demo' : 'collector@scrapmax.demo';
    const legacyEmail = role === 'household' ? 'household@aicle.demo' : 'collector@aicle.demo';
    const demoPass = 'demo123456';

    // Try primary scrapmax email first
    let res = await supabase.auth.signInWithPassword({
      email: primaryEmail,
      password: demoPass,
    });

    // If failed, try legacy email
    if (res.error && res.error.message.includes('Invalid login credentials')) {
      res = await supabase.auth.signInWithPassword({
        email: legacyEmail,
        password: demoPass,
      });
    }

    if (res.error) {
      setErrorMsg(
        'Demo account is not yet seeded in your Supabase database. You can create an account on the Register page or seed it via SQL Editor.'
      );
      setLoading(false);
      setAutoLoggingRole(null);
    } else if (res.data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', res.data.user.id)
        .single();

      const finalRole = profile?.role || role;
      if (finalRole === 'admin') {
        router.push('/admin');
      } else if (finalRole === 'collector') {
        router.push('/collector');
      } else {
        router.push('/household');
      }
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
            <h2 className="text-2xl font-bold text-[#191C1E] tracking-tight">Welcome Back</h2>
            <p className="text-xs text-[#6B7280]">Sign in to manage waste pickups and view Supabase data</p>
          </div>

          {/* Quick Demo Buttons */}
          <div className="p-3.5 bg-[#F8FAF9] border border-gray-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[#526056] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#136B3B]" />
              <span>Quick Demo 1-Click Login:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('household')}
                className="px-2 py-2.5 bg-white hover:bg-emerald-50 text-xs font-bold text-[#136B3B] rounded-xl border border-gray-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <span>🏠</span>
                <span className="truncate">{autoLoggingRole === 'household' ? 'Logging in...' : 'Household'}</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoClick('collector')}
                className="px-2 py-2.5 bg-white hover:bg-slate-50 text-xs font-bold text-[#191C1E] rounded-xl border border-gray-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1 disabled:opacity-60"
              >
                <span>🚛</span>
                <span className="truncate">{autoLoggingRole === 'collector' ? 'Logging in...' : 'Collector'}</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => router.push('/admin')}
                className="px-2 py-2.5 bg-purple-50 hover:bg-purple-100 text-xs font-bold text-purple-800 rounded-xl border border-purple-200 transition touch-feedback shadow-xs flex items-center justify-center gap-1"
              >
                <span>🛡️</span>
                <span className="truncate">Admin</span>
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

          {/* Supabase Email Rate Limit or Email Confirm Guide */}
          <div className="p-3.5 bg-[#EAF5EE] border border-[#A6D5B8] rounded-2xl text-xs text-[#136B3B] space-y-2">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#136B3B]" />
              <div className="space-y-1">
                <p className="font-bold">Supabase Setup Tip:</p>
                <p className="text-[11.5px] leading-relaxed text-[#2B6B47]">
                  To register and log in without needing email verification: in your <strong>Supabase Dashboard &gt; Authentication &gt; Providers &gt; Email</strong>, toggle <strong>OFF</strong> &quot;Confirm email&quot; and save.
                </p>
              </div>
            </div>
          </div>

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

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <Link
              href="/household"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#F8FAF9] hover:bg-[#EAE6F8] text-[#191C1E] border border-gray-200 font-bold rounded-full text-xs transition touch-feedback"
            >
              <span>Explore as Guest (No Login Required)</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </form>

          <p className="text-center text-xs text-[#6B7280]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#136B3B] font-bold hover:underline">
              Create one now
            </Link>
          </p>

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
                      , click <em>&quot;Add user&quot;</em> with email <code className="bg-gray-200 px-1 rounded">household@scrapmax.demo</code> (or <code className="bg-gray-200 px-1 rounded">household@aicle.demo</code>) and password <code className="bg-gray-200 px-1 rounded">demo123456</code> with <strong>&quot;Auto Confirm User&quot;</strong> checked.
                    </li>
                  </ol>
                </div>
              </div>
            </details>
          </div>

        </div>
      </main>
    </div>
  );
}
