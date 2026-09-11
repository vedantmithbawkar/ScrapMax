'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminSession, isAdminAuthenticated } from '@/lib/admin-auth';
import { Shield, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // If on /admin/login, bypass protection
    if (pathname === '/admin/login') {
      setIsAuthorized(true);
      return;
    }

    async function verifyAdminAccess() {
      // 1. Check local admin session token
      const session = getAdminSession();
      if (session && session.role === 'admin') {
        setIsAuthorized(true);
        return;
      }

      // 2. Check Supabase active user role
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          if (profile && profile.role === 'admin') {
            setIsAuthorized(true);
            return;
          }
        }
      } catch {}

      // 3. Unauthorized: Block access and redirect immediately to /admin/login
      setIsAuthorized(false);
      router.replace('/admin/login');
    }

    verifyAdminAccess();

    const handleAuthChange = () => {
      verifyAdminAccess();
    };

    window.addEventListener('scrapmax_admin_auth_change', handleAuthChange);
    return () => window.removeEventListener('scrapmax_admin_auth_change', handleAuthChange);
  }, [pathname, router]);

  // If on /admin/login, render immediately
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Loading / Verification state while blocking unauthorized render
  if (isAuthorized === null || isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#F7F9FA] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center animate-pulse">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-[#191C1E] flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-700" />
            <span>Verifying Administrator Access…</span>
          </h2>
          <p className="text-xs text-[#6B7280]">
            Restricted portal. Redirecting to Admin Authentication.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
