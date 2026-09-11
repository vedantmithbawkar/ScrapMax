import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  const code = searchParams.get('code');
  const roleParam = searchParams.get('role');
  const nextParam = searchParams.get('next');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth error or user cancellation
  if (error) {
    const errorMsg = errorDescription || error;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMsg)}`, requestUrl.origin)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging OAuth code for session:', exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    const user = data.user;
    if (user) {
      // 1. Check if user already has an existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', user.id)
        .maybeSingle();

      let finalRole: UserRole = 'household';

      if (existingProfile?.role) {
        // Retain existing role if profile already exists
        finalRole = existingProfile.role as UserRole;
      } else {
        // Map requested role param to valid database UserRole ('household' | 'collector' | 'recycler' | 'admin')
        if (roleParam === 'recycler') {
          finalRole = 'recycler';
        } else if (roleParam === 'collector') {
          finalRole = 'collector';
        } else if (roleParam === 'admin') {
          finalRole = 'admin';
        } else {
          finalRole = 'household';
        }

        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          (user.email ? user.email.split('@')[0] : 'ScrapMax Citizen');
        const phone = user.user_metadata?.phone || null;
        const avatarUrl =
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: fullName,
            role: finalRole,
            phone: phone,
            avatar_url: avatarUrl,
          });

          // If role is recycler, ensure a basic recycler_profiles row exists as well
          if (finalRole === 'recycler') {
            await supabase.from('recycler_profiles').upsert({
              id: user.id,
              company_name: `${fullName}'s Recycling Hub`,
              business_type: 'Recycler',
              authorized_person_name: fullName,
              business_email: user.email || 'contact@scrapmax.com',
            });
          }
        } catch (err) {
          console.warn('Profile upsert notice in auth callback:', err);
        }
      }

      // Determine redirect destination
      let destination = nextParam;
      if (!destination || destination === '/' || destination === '/login' || destination === '/register') {
        if (finalRole === 'recycler') {
          destination = '/recycler';
        } else if (finalRole === 'collector') {
          destination = '/collector';
        } else if (finalRole === 'admin') {
          destination = '/admin';
        } else {
          destination = '/household';
        }
      }

      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  // Fallback if no code is present
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
