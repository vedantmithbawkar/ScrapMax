import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const startTime = Date.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !hasKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Supabase credentials missing in environment variables.',
        supabaseUrl: supabaseUrl || null,
        hasKey,
      },
      { status: 500 }
    );
  }

  try {
    const supabase = await createClient();

    // Query profiles table
    const { count: profileCount, error: profileErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Query pickup_requests table
    const { count: requestCount, error: reqErr } = await supabase
      .from('pickup_requests')
      .select('*', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (profileErr || reqErr) {
      return NextResponse.json(
        {
          status: 'warning',
          message: 'Connected to Supabase, but encountered table query warnings.',
          supabaseUrl,
          latencyMs,
          errors: {
            profiles: profileErr?.message,
            pickup_requests: reqErr?.message,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'connected',
      message: 'Successfully connected to Supabase PostgreSQL database!',
      supabaseUrl,
      latencyMs: `${latencyMs}ms`,
      tables: {
        profiles: { status: 'accessible', totalRows: profileCount || 0 },
        pickup_requests: { status: 'accessible', totalRows: requestCount || 0 },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Database connection error',
        latencyMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
