import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Block this diagnostic endpoint entirely in production
  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 404 });
  }

  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    '';
  const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');

  // Never expose any part of the key — only presence/length
  return NextResponse.json({
    status: 'ok',
    hasKey: cleanKey.length > 0,
    keyLength: cleanKey.length,
    // Intentionally NOT returning keyPrefix to avoid leaking API key
    vercelEnv: process.env.VERCEL_ENV || 'local',
  });
}
