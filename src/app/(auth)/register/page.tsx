'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';
import { Recycle, User, Phone, Lock, Mail, Truck, ArrowRight } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get('role');
  const [role, setRole] = useState<UserRole>(
    roleParam === 'collector' ? 'collector' : 'household'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
        },
      },
    });

    if (error) {
      if (error.message.includes('rate limit')) {
        setErrorMsg(
          '⚠️ Supabase Email Rate Limit Exceeded: Supabase free tier limits verification emails to ~3/hour. To fix this instantly: open your Supabase Dashboard > Authentication > Providers > Email, turn OFF "Confirm email", and click Save. Then you can register and sign in immediately with any email!'
        );
      } else {
        setErrorMsg(error.message);
      }
      setLoading(false);
      return;
    }

    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          phone,
          role,
        });
      } catch (err) {
        console.warn('Profile upsert notice:', err);
      }
    }

    if (data?.session) {
      if (role === 'collector') {
        router.push('/collector');
      } else {
        router.push('/household');
      }
    } else {
      setSuccessMsg(
        'Account created in Supabase! If "Confirm email" is enabled in your Supabase project, please check your inbox to verify your email, or disable "Confirm email" in Supabase Dashboard (Auth > Providers > Email) to sign in immediately.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[#191C1E] tracking-tight">Create Your Account</h2>
        <p className="text-xs text-[#6B7280]">Join AiCLE circular waste recycling platform</p>
      </div>

      {/* Role Choice Selector */}
      <div>
        <label className="block text-xs font-bold text-[#191C1E] mb-2">Select Your Role</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('household')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition touch-feedback ${
              role === 'household'
                ? 'border-[#136B3B] bg-[#E6F4EA] text-[#136B3B] font-bold shadow-xs'
                : 'border-gray-200 bg-[#F8FAF9] text-[#526056] hover:bg-gray-100'
            }`}
          >
            <Recycle className="w-6 h-6 stroke-[2.2]" />
            <span className="text-xs">🏠 Household</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('collector')}
            className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition touch-feedback ${
              role === 'collector'
                ? 'border-[#136B3B] bg-[#E6F4EA] text-[#136B3B] font-bold shadow-xs'
                : 'border-gray-200 bg-[#F8FAF9] text-[#526056] hover:bg-gray-100'
            }`}
          >
            <Truck className="w-6 h-6 stroke-[2.2]" />
            <span className="text-xs">🚛 Collector</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#E6F4EA] border border-[#A6D5B8] text-[#136B3B] rounded-2xl text-xs leading-relaxed space-y-2 font-medium">
          <p>{successMsg}</p>
          <p>
            Already verified?{' '}
            <Link href="/login" className="underline font-bold text-[#136B3B]">
              Sign In Here
            </Link>
          </p>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#191C1E] mb-1.5">Full Name</label>
          <div className="relative">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Sahil Doe"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] transition"
            />
            <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
          </div>
        </div>

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
          <label className="block text-xs font-bold text-[#191C1E] mb-1.5">Phone Number</label>
          <div className="relative">
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAF9] border border-gray-200 rounded-xl text-sm text-[#191C1E] placeholder-gray-400 focus:outline-none focus:border-[#136B3B] transition"
            />
            <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
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
          <span>{loading ? 'Creating account...' : `Register as ${role.toUpperCase()}`}</span>
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
          <span>Explore as Guest (No Account Required)</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </Link>
      </form>

      <p className="text-center text-xs text-[#6B7280]">
        Already registered?{' '}
        <Link href="/login" className="text-[#136B3B] font-bold hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <Suspense fallback={<div className="text-[#6B7280] text-xs">Loading Registration...</div>}>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  );
}
