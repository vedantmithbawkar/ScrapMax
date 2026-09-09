import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    '';
  const cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');

  return NextResponse.json({
    status: 'ok',
    hasKey: cleanKey.length > 0,
    keyLength: cleanKey.length,
    keyPrefix: cleanKey.length > 4 ? cleanKey.slice(0, 4) + '...' : 'empty',
    envNamesChecked: [
      'GEMINI_API_KEY',
      'NEXT_PUBLIC_GEMINI_API_KEY',
      'GEMINI_KEY',
      'GOOGLE_API_KEY',
      'GOOGLE_GEMINI_API_KEY',
    ],
    vercelEnv: process.env.VERCEL_ENV || 'local',
  });
}
