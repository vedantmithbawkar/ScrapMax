import { createClient } from '@/lib/supabase/client';

export interface AdminSession {
  email: string;
  role: 'admin';
  name: string;
  token: string;
  loggedInAt: number;
}

export const OFFICIAL_ADMIN_CREDENTIALS = {
  email: 'admin@scrapmax.gov.in',
  password: 'Admin@ScrapMax2026',
  secondaryEmail: 'admin@scrapmax.com',
  secondaryPassword: 'admin123',
};

const ADMIN_STORAGE_KEY = 'scrapmax_admin_session';

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    // Session valid for 24 hours
    if (session && session.role === 'admin' && Date.now() - session.loggedInAt < 86400000) {
      return session;
    }
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
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = pass.trim();

  // 1. Check Dedicated Admin Portal Credentials
  const isPrimary =
    (cleanId === OFFICIAL_ADMIN_CREDENTIALS.email || cleanId === 'admin') &&
    cleanPass === OFFICIAL_ADMIN_CREDENTIALS.password;

  const isSecondary =
    (cleanId === OFFICIAL_ADMIN_CREDENTIALS.secondaryEmail || cleanId === 'admin') &&
    cleanPass === OFFICIAL_ADMIN_CREDENTIALS.secondaryPassword;

  if (isPrimary || isSecondary) {
    const session: AdminSession = {
      email: cleanId.includes('@') ? cleanId : OFFICIAL_ADMIN_CREDENTIALS.email,
      role: 'admin',
      name: 'Municipal Admin Officer',
      token: `admin_token_${Date.now()}`,
      loggedInAt: Date.now(),
    };
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
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

    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
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
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('scrapmax_admin_auth_change', { detail: { session: null } }));
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
  }
}
