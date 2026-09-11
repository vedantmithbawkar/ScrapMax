'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';
import {
  Recycle,
  User,
  Phone,
  Lock,
  Mail,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Loader2,
  AlertCircle,
  Fingerprint,
} from 'lucide-react';
import {
  formatAadhaarInput,
  maskAadhaar,
  markCollectorAadhaarVerified,
} from '@/lib/aadhaar-service';

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

  // Aadhaar Verification State for Collectors
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarTxnId, setAadhaarTxnId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [maskedAadhaarVal, setMaskedAadhaarVal] = useState('');
  const [aadhaarVerifiedAt, setAadhaarVerifiedAt] = useState<string | null>(null);
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [aadhaarError, setAadhaarError] = useState<string | null>(null);
  const [aadhaarNotice, setAadhaarNotice] = useState<string | null>(null);

  // Send Aadhaar OTP
  const handleSendAadhaarOtp = async () => {
    setAadhaarLoading(true);
    setAadhaarError(null);
    setAadhaarNotice(null);

    const clean = aadhaarInput.replace(/\s+/g, '');
    if (clean.length !== 12) {
      setAadhaarError('Please enter a valid 12-digit Aadhaar number.');
      setAadhaarLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-otp',
          aadhaarNumber: clean,
          phone: phone || '+91 9876543210',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAadhaarError(data.error || 'Failed to send Aadhaar verification OTP.');
      } else {
        setAadhaarTxnId(data.txnId || '');
        setOtpSent(true);
        setAadhaarNotice(data.message || 'OTP dispatched to Aadhaar linked mobile.');
      }
    } catch (err: any) {
      setAadhaarError(err.message || 'Network error while connecting to Aadhaar API.');
    } finally {
      setAadhaarLoading(false);
    }
  };

  // Verify Aadhaar OTP
  const handleVerifyAadhaarOtp = async () => {
    setAadhaarLoading(true);
    setAadhaarError(null);

    if (!aadhaarOtp || aadhaarOtp.trim().length < 6) {
      setAadhaarError('Please enter the 6-digit Aadhaar OTP.');
      setAadhaarLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-otp',
          txnId: aadhaarTxnId,
          otp: aadhaarOtp.trim(),
          aadhaarNumber: aadhaarInput.replace(/\s+/g, ''),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAadhaarError(data.error || 'Invalid OTP. Please check the code and try again.');
      } else {
        const masked = data.maskedAadhaar || maskAadhaar(aadhaarInput);
        const verifiedTime = data.aadhaarVerifiedAt || new Date().toISOString();
        setAadhaarVerified(true);
        setMaskedAadhaarVal(masked);
        setAadhaarVerifiedAt(verifiedTime);
        setAadhaarNotice('✓ Aadhaar verification confirmed by UIDAI e-KYC service.');
        setAadhaarError(null);
      }
    } catch (err: any) {
      setAadhaarError(err.message || 'Network error while verifying Aadhaar OTP.');
    } finally {
      setAadhaarLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Collector Aadhaar Verification Guard
    if (role === 'collector' && !aadhaarVerified) {
      setErrorMsg('⚠️ Mandatory KYC Requirement: Scrap Collectors must verify their Aadhaar card via OTP before registration.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone,
          aadhaar_number: role === 'collector' ? maskedAadhaarVal : undefined,
          aadhaar_verified: role === 'collector' ? true : false,
          aadhaar_verified_at: role === 'collector' ? aadhaarVerifiedAt : undefined,
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
          aadhaar_number: role === 'collector' ? maskedAadhaarVal : undefined,
          aadhaar_verified: role === 'collector' ? true : false,
          aadhaar_verified_at: role === 'collector' ? aadhaarVerifiedAt : undefined,
        });
      } catch (err) {
        console.warn('Profile upsert notice:', err);
      }

      // Sync verified collector to client-side cache
      if (role === 'collector') {
        markCollectorAadhaarVerified(email, maskedAadhaarVal, { phone, email });
        try {
          localStorage.setItem(
            'scrapmax_collector_profile',
            JSON.stringify({
              fullName,
              phone,
              email,
              aadhaarNumber: maskedAadhaarVal,
              aadhaarVerified: true,
              aadhaarVerifiedAt,
            })
          );
        } catch {}
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
        <p className="text-xs text-[#6B7280]">Join ScrapMax circular waste recycling platform</p>
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

        {/* Collector Mandatory Aadhaar Verification Card */}
        {role === 'collector' && (
          <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#14532D]">
                <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                <span>UIDAI Aadhaar e-KYC Verification</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Mandatory
              </span>
            </div>

            <p className="text-[11.5px] text-[#166534] leading-relaxed">
              ScrapMax requires verified UIDAI Aadhaar credentials for all scrap collectors to ensure identity safety and trust for household pickups.
            </p>

            {aadhaarVerified ? (
              <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-950">Aadhaar Verified</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">UIDAI OK</span>
                    </div>
                    <p className="text-xs font-mono text-gray-600 mt-0.5">{maskedAadhaarVal}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAadhaarVerified(false);
                    setOtpSent(false);
                    setAadhaarOtp('');
                  }}
                  className="text-[11px] text-gray-500 hover:text-emerald-800 underline font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#191C1E] mb-1">
                    12-Digit Aadhaar Card Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={14}
                        value={aadhaarInput}
                        onChange={(e) => setAadhaarInput(formatAadhaarInput(e.target.value))}
                        placeholder="XXXX XXXX XXXX"
                        className="w-full pl-9 pr-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-mono text-[#191C1E] tracking-wider placeholder-gray-400 focus:outline-none focus:border-[#136B3B]"
                      />
                      <Fingerprint className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                    <button
                      type="button"
                      disabled={aadhaarLoading || aadhaarInput.replace(/\s+/g, '').length !== 12}
                      onClick={handleSendAadhaarOtp}
                      className="px-3.5 py-2 bg-[#136B3B] hover:bg-[#0F5730] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shrink-0"
                    >
                      {aadhaarLoading && !otpSent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>{otpSent ? 'Resend OTP' : 'Get OTP'}</span>
                      )}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-[#191C1E]">
                        Enter 6-Digit Aadhaar OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => setAadhaarOtp('123456')}
                        className="text-[10px] text-[#136B3B] font-bold hover:underline"
                      >
                        ⚡ Fill Test OTP (123456)
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={6}
                          value={aadhaarOtp}
                          onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full pl-9 pr-3 py-2 bg-[#F8FAF9] border border-gray-200 rounded-xl text-xs font-mono text-[#191C1E] tracking-widest placeholder-gray-400 focus:outline-none focus:border-[#136B3B]"
                        />
                        <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                      </div>
                      <button
                        type="button"
                        disabled={aadhaarLoading || aadhaarOtp.length < 6}
                        onClick={handleVerifyAadhaarOtp}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shrink-0"
                      >
                        {aadhaarLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify OTP</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {aadhaarNotice && (
                  <p className="text-[11px] text-emerald-700 font-medium">{aadhaarNotice}</p>
                )}
                {aadhaarError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{aadhaarError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (role === 'collector' && !aadhaarVerified)}
          className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-full shadow-sm transition touch-feedback ${
            role === 'collector' && !aadhaarVerified
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-[#136B3B] hover:bg-[#0F5730] text-white'
          }`}
        >
          <span>
            {loading
              ? 'Creating account...'
              : role === 'collector' && !aadhaarVerified
              ? 'Verify Aadhaar to Register'
              : `Register as ${role.toUpperCase()}`}
          </span>
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

      <p className="text-center text-[11px] text-gray-400 pt-1">
        By registering, you agree to our{' '}
        <Link href="/privacy" className="text-[#136B3B] underline hover:text-[#0F5730] font-medium">
          Privacy Policy &amp; Data Charter
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
