import { createClient } from '@/lib/supabase/client';

export interface AdminSession {
  email: string;
  role: 'admin';
  name: string;
  token: string;
  loggedInAt: number;
}

const ADMIN_STORAGE_KEY = 'scrapmax_admin_session';

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ADMIN_STORAGE_KEY) || localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    // Session valid for 4 hours
    if (session && session.role === 'admin' && Date.now() - session.loggedInAt < 14400000) {
      return session;
    }
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    return null;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}

export async function loginAdmin(
  identifier: string,
  pass: string
): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  const cleanId = identifier.trim();
  const cleanPass = pass.trim();

  try {
    // 1. Authenticate via Server API Route (reads Vercel runtime environment variables securely)
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cleanId, password: cleanPass }),
    });

    const data = await response.json();

    if (data.success && data.session) {
      const session: AdminSession = data.session;
      sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scrapmax_admin_auth_change', { detail: { session } }));
      }
      return { success: true, session };
    }

    return {
      success: false,
      error: data.error || 'Invalid administrator credentials.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Unable to reach authentication server. Please check your connection and try again.',
    };
  }
}

export async function logoutAdmin(): Promise<void> {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    // Clear cookie
    document.cookie = 'scrapmax_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.dispatchEvent(new CustomEvent('scrapmax_admin_auth_change', { detail: { session: null } }));
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
  }
}

