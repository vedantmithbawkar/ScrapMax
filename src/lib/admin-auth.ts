import { createClient } from '@/lib/supabase/client';

export interface AdminSession {
  email: string;
  role: 'admin';
  name: string;
  token: string;
  loggedInAt: number;
}

// Admin credentials loaded from NEXT_PUBLIC_ env vars (required for client-side access).
// Passwords should still be treated as sensitive — avoid logging or exposing them.
const ADMIN_PRIMARY_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@scrapmax.gov.in';
const ADMIN_PRIMARY_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
const ADMIN_SECONDARY_EMAIL = process.env.NEXT_PUBLIC_ADMIN_SECONDARY_EMAIL || '';
const ADMIN_SECONDARY_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_SECONDARY_PASSWORD || '';

const ADMIN_STORAGE_KEY = 'scrapmax_admin_session';

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    // Only read from sessionStorage — admin session must not persist across browser closes
    const raw = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    // Session valid for 4 hours
    if (session && session.role === 'admin' && Date.now() - session.loggedInAt < 14400000) {
      return session;
    }
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
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
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Check Dedicated Admin Portal Credentials (loaded from env vars only)
  const isPrimary =
    ADMIN_PRIMARY_PASSWORD.length > 0 &&
    cleanId === ADMIN_PRIMARY_EMAIL.toLowerCase() &&
    cleanPass === ADMIN_PRIMARY_PASSWORD;

  const isSecondary =
    ADMIN_SECONDARY_PASSWORD.length > 0 &&
    ADMIN_SECONDARY_EMAIL.length > 0 &&
    cleanId === ADMIN_SECONDARY_EMAIL.toLowerCase() &&
    cleanPass === ADMIN_SECONDARY_PASSWORD;

  if (isPrimary || isSecondary) {
    const session: AdminSession = {
      email: cleanId,
      role: 'admin',
      name: 'Municipal Admin Officer',
      // Use crypto.randomUUID for secure token if available, otherwise timestamp-based
      token: typeof crypto !== 'undefined' && crypto.randomUUID
        ? `admin_${crypto.randomUUID()}`
        : `admin_token_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      loggedInAt: Date.now(),
    };
    // Store ONLY in sessionStorage — ends when browser tab/window closes
    sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scrapmax_admin_auth_change', { detail: { session } }));
    }
    return { success: true, session };
  }

  // 2. Attempt Supabase Auth & Verify 'admin' Role Strictly
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanId,
      password: cleanPass,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'Invalid Administrator credentials. Please verify your Admin email and password.',
      };
    }

    // Check profile role in public.profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', authData.user.id)
      .single();

    // STRICT CHECK: Users and Collectors are strictly forbidden
    if (!profile || profile.role !== 'admin') {
      // Immediately sign out this unauthorized user
      await supabase.auth.signOut();
      return {
        success: false,
        error: `Access Denied: Account role is "${profile?.role || 'user'}". Only verified Administrators can access the Admin Console.`,
      };
    }

    const session: AdminSession = {
      email: authData.user.email || cleanId,
      role: 'admin',
      name: profile.full_name || 'System Admin',
      token: `admin_token_${authData.user.id}`,
      loggedInAt: Date.now(),
    };

    sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
    // Do NOT persist to localStorage — admin session must end when browser closes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scrapmax_admin_auth_change', { detail: { session } }));
    }
    return { success: true, session };
  } catch (err: any) {
    return {
      success: false,
      error: 'Authentication server error. Please use dedicated admin credentials.',
    };
  }
}

export async function logoutAdmin(): Promise<void> {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_STORAGE_KEY); // cleanup any legacy persisted session
    window.dispatchEvent(new CustomEvent('scrapmax_admin_auth_change', { detail: { session: null } }));
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
  }
}
