import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Administrator Email/ID and Password are required.' },
        { status: 400 }
      );
    }

    const cleanEnv = (val?: string) => (val || '').trim().replace(/^["']|["']$/g, '');

    // 1. Check Server Environment Variables (runtime on Vercel / Node server)
    const adminEmail = cleanEnv(
      process.env.ADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      'admin@scrapmax.gov.in'
    ).toLowerCase();

    const adminPassword = cleanEnv(
      process.env.ADMIN_PASSWORD ||
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      ''
    );

    const adminSecEmail = cleanEnv(
      process.env.ADMIN_SECONDARY_EMAIL ||
      process.env.NEXT_PUBLIC_ADMIN_SECONDARY_EMAIL ||
      ''
    ).toLowerCase();

    const adminSecPassword = cleanEnv(
      process.env.ADMIN_SECONDARY_PASSWORD ||
      process.env.NEXT_PUBLIC_ADMIN_SECONDARY_PASSWORD ||
      ''
    );

    const isPrimary =
      adminPassword.length > 0 &&
      (identifier === adminEmail || identifier === 'admin') &&
      password === adminPassword;

    const isSecondary =
      adminSecPassword.length > 0 &&
      adminSecEmail.length > 0 &&
      (identifier === adminSecEmail || identifier === 'admin') &&
      password === adminSecPassword;

    if (isPrimary || isSecondary) {
      const session = {
        email: identifier === 'admin' ? adminEmail : identifier,
        role: 'admin' as const,
        name: 'Municipal Admin Officer',
        token: `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        loggedInAt: Date.now(),
      };

      const response = NextResponse.json({ success: true, session });
      response.cookies.set('scrapmax_admin_token', session.token, {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 14400, // 4 hours
      });

      return response;
    }

    // 2. Fallback: Attempt Supabase Auth & Verify 'admin' Role Strictly
    try {
      const supabase = await createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (!authError && authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', authData.user.id)
          .single();

        if (profile && profile.role === 'admin') {
          const session = {
            email: authData.user.email || identifier,
            role: 'admin' as const,
            name: profile.full_name || 'System Admin',
            token: `admin_token_${authData.user.id}`,
            loggedInAt: Date.now(),
          };

          const response = NextResponse.json({ success: true, session });
          response.cookies.set('scrapmax_admin_token', session.token, {
            path: '/',
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 14400,
          });

          return response;
        } else {
          await supabase.auth.signOut();
          return NextResponse.json(
            {
              success: false,
              error: `Access Denied: Account role is "${profile?.role || 'user'}". Only verified Administrators can access the Admin Console.`,
            },
            { status: 403 }
          );
        }
      }
    } catch {
      // Supabase not reachable or credentials not in Supabase DB
    }

    // 3. Informative error if password env var was never set on Vercel
    if (!adminPassword && !adminSecPassword) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ADMIN_PASSWORD environment variable is not configured in your Vercel Project Settings. Please add ADMIN_PASSWORD (and optionally ADMIN_EMAIL) in Vercel.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid administrator credentials. Please check your email and password.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('[Admin Auth Error]', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
