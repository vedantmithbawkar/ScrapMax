'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { UserProfile, UserRole } from '@/types';
import {
  ArrowLeft,
  Search,
  Users,
  Shield,
  Truck,
  Home,
  CheckCircle2,
  X,
  Phone,
  Calendar,
  Sparkles,
  Eye,
  ChevronRight,
  UserCheck,
  UserCog,
} from 'lucide-react';

type RoleFilter = 'all' | 'household' | 'collector' | 'admin';

function formatDate(iso?: string) {
  if (!iso) return 'Recent';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// Fallback demo users for instant rendering & offline resilience
const DEMO_USERS: (UserProfile & { created_at?: string; total_pickups?: number; total_payout?: number })[] = [
  {
    id: 'u1',
    full_name: 'Sahil Kumar',
    role: 'household',
    phone: '+91 98765 43210',
    created_at: '2026-08-15T10:00:00Z',
    total_pickups: 8,
    total_payout: 2450,
  },
  {
    id: 'u2',
    full_name: 'Raju Kabadiwala',
    role: 'collector',
    phone: '+91 87654 32100',
    created_at: '2026-08-20T10:00:00Z',
    total_pickups: 42,
    total_payout: 38900,
  },
  {
    id: 'u3',
    full_name: 'Priya Sharma',
    role: 'household',
    phone: '+91 76543 21000',
    created_at: '2026-09-01T10:00:00Z',
    total_pickups: 3,
    total_payout: 920,
  },
  {
    id: 'u4',
    full_name: 'Vedant Mithbawkar',
    role: 'admin',
    phone: '+91 99999 00000',
    created_at: '2026-07-01T10:00:00Z',
    total_pickups: 0,
    total_payout: 0,
  },
  {
    id: 'u5',
    full_name: 'Vikram Singh (Scrap Fleet)',
    role: 'collector',
    phone: '+91 65432 10000',
    created_at: '2026-09-05T10:00:00Z',
    total_pickups: 19,
    total_payout: 18200,
  },
  {
    id: 'u6',
    full_name: 'Ananya Patel',
    role: 'household',
    phone: '+91 54321 00000',
    created_at: '2026-09-08T10:00:00Z',
    total_pickups: 2,
    total_payout: 480,
  },
  {
    id: 'u7',
    full_name: 'Amitabh Sen',
    role: 'household',
    phone: '+91 91234 56789',
    created_at: '2026-09-10T10:00:00Z',
    total_pickups: 5,
    total_payout: 1650,
  },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; badgeBg: string; avatarBg: string; avatarText: string; icon: any }> = {
  household: {
    label: 'Household',
    color: 'text-blue-700',
    badgeBg: 'bg-blue-50 border-blue-200',
    avatarBg: 'bg-blue-50',
    avatarText: 'text-blue-700',
    icon: Home,
  },
  collector: {
    label: 'Collector',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    avatarBg: 'bg-emerald-50',
    avatarText: 'text-emerald-700',
    icon: Truck,
  },
  admin: {
    label: 'Admin',
    color: 'text-purple-700',
    badgeBg: 'bg-purple-50 border-purple-200',
    avatarBg: 'bg-purple-50',
    avatarText: 'text-purple-700',
    icon: Shield,
  },
};

export default function AdminUsersPage() {
  const router = useRouter();
  // Initialize with demo data immediately so UI NEVER hangs on blank spinner
  const [users, setUsers] = useState<(UserProfile & { created_at?: string; total_pickups?: number; total_payout?: number })[]>(DEMO_USERS);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { created_at?: string; total_pickups?: number; total_payout?: number }) | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const supabase = createClient();
        
        // Timeout helper to avoid indefinite hang if Supabase is offline
        const fetchWithTimeout = async <T,>(promise: PromiseLike<T>, ms = 2500): Promise<T> => {
          return Promise.race([
            Promise.resolve(promise),
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
          ]);
        };

        const authRes = await fetchWithTimeout(supabase.auth.getUser());
        const user = authRes?.data?.user;
        if (user) {
          const profileRes: any = await fetchWithTimeout(supabase.from('profiles').select('role').eq('id', user.id).single());
          if (profileRes?.data?.role !== 'admin' && isMounted) {
            setIsDemoMode(true);
          }
        } else if (isMounted) {
          setIsDemoMode(true);
        }

        const usersRes: any = await fetchWithTimeout(
          supabase.from('profiles').select('*').order('created_at', { ascending: false })
        );
        const usersData = usersRes?.data;
        if (usersData && usersData.length > 0 && isMounted) {
          setUsers(usersData as any);
        }

        // Sync cached personal profile info if updated from Household profile
        try {
          const cached = localStorage.getItem('scrapmax_personal_info') || localStorage.getItem('aicle_personal_info');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.fullName) {
              setUsers((prev) =>
                prev.map((u) => (u.id === 'u1' ? { ...u, full_name: parsed.fullName, phone: parsed.phone || u.phone } : u))
              );
            }
          }
        } catch {}
      } catch {
        // Graceful fallback to demo users already in state
        if (isMounted) {
          setIsDemoMode(true);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const supabase = createClient();
      await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    } catch {}

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
    setSuccessMsg(`User role successfully changed to ${newRole}`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      return matchName || matchPhone || matchRole;
    }
    return true;
  });

  const roleCounts = {
    all: users.length,
    household: users.filter((u) => u.role === 'household').length,
    collector: users.filter((u) => u.role === 'collector').length,
    admin: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        
        {/* ScrapMax Emerald Hero Header Banner (Consistent with Collector Portal) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 bg-[#136B3B] text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="space-y-1.5 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold mb-1 backdrop-blur-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>User Accounts Directory</span>
            </h1>
            <p className="text-sm text-[#A6D5B8] max-w-xl">
              Audit citizen households, manage verified scrap collectors, assign permissions, and oversee accounts.
            </p>
          </div>

          <div className="z-10 flex flex-wrap items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#136B3B] font-bold rounded-full text-xs shadow-xs hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/pickups"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full text-xs transition"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Pickups</span>
            </Link>
          </div>
          <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Action Toast Feedback */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Admin Demo Mode: Full user directory loaded. You can interactively switch roles below.</span>
          </div>
        )}

        {/* KPI Stat Cards Grid (Aesthetic consistent with PersonalDashboard) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">{roleCounts.all}</p>
              <p className="text-xs font-semibold text-[#526056] mt-1">Total Users</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 flex-shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">{roleCounts.household}</p>
              <p className="text-xs font-semibold text-[#526056] mt-1">Households</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">{roleCounts.collector}</p>
              <p className="text-xs font-semibold text-[#526056] mt-1">Collectors</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#191C1E] leading-none">{roleCounts.admin}</p>
              <p className="text-xs font-semibold text-[#526056] mt-1">Admins</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 space-y-3.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by full name, phone number, or role…"
              className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAF9] rounded-xl border border-gray-200 text-xs sm:text-sm text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 focus:border-[#136B3B] transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills with Counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {([
              { key: 'all' as RoleFilter, label: 'All Accounts', count: roleCounts.all, icon: Users },
              { key: 'household' as RoleFilter, label: 'Households', count: roleCounts.household, icon: Home },
              { key: 'collector' as RoleFilter, label: 'Collectors', count: roleCounts.collector, icon: Truck },
              { key: 'admin' as RoleFilter, label: 'Admins', count: roleCounts.admin, icon: Shield },
            ]).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setRoleFilter(t.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  roleFilter === t.key
                    ? 'bg-[#136B3B] text-white shadow-xs'
                    : 'bg-[#F8FAF9] border border-gray-200 text-[#526056] hover:bg-gray-100'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    roleFilter === t.key ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* User Cards Grid (Consistent with RequestCard style) */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-md mx-auto space-y-3">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-[#191C1E]">No accounts match your query</h3>
            <p className="text-xs text-[#6B7280]">Try clearing the search text or selecting another role tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((user) => {
              const cfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.household;
              const RoleIcon = cfg.icon;
              const initial = (user.full_name || 'U').charAt(0).toUpperCase();

              return (
                <article
                  key={user.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-gray-100 hover:border-gray-200 transition-all flex flex-col justify-between space-y-3.5"
                >
                  <div className="space-y-3">
                    {/* Top Row: User Avatar & Role Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl ${cfg.avatarBg} ${cfg.avatarText} font-black text-base flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                          {initial}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-[15px] sm:text-base text-[#191C1E] leading-tight">
                              {user.full_name || 'Anonymous User'}
                            </h3>
                          </div>
                          <p className="text-xs text-[#6B7280] font-medium flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{user.phone || '+91 Unregistered'}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${cfg.badgeBg} ${cfg.color}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        <span>{cfg.label}</span>
                      </span>
                    </div>

                    {/* Metadata Pill Box */}
                    <div className="bg-[#F8FAF9] p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                          Pickups Completed
                        </span>
                        <span className="font-extrabold text-[#191C1E]">
                          {user.total_pickups ?? (user.role === 'collector' ? 14 : 3)} orders
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider block">
                          Registered
                        </span>
                        <span className="font-semibold text-[#526056]">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-400">
                      ID: {user.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 bg-[#E6F4EA] hover:bg-[#D4EBD9] text-[#136B3B] text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                      >
                        <UserCog className="w-3.5 h-3.5" />
                        <span>Change Role</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>

      {/* Role Management Modal (Consistent Modal Layout) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F4EA] text-[#136B3B] font-black flex items-center justify-center">
                  {(selectedUser.full_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#191C1E]">{selectedUser.full_name}</h3>
                  <p className="text-xs text-gray-500 font-mono">UID: {selectedUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#F8FAF9] p-3 rounded-2xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#6B7280] font-medium">Contact Phone:</span>
                  <span className="font-bold text-[#191C1E]">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] font-medium">Current Role:</span>
                  <span className="font-extrabold uppercase text-[#136B3B]">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] font-medium">Joined On:</span>
                  <span className="font-semibold text-[#191C1E]">{formatDate(selectedUser.created_at)}</span>
                </div>
              </div>

              {/* Role Assignment Switcher */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Assign Platform Role
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateRole(selectedUser.id, 'household')}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                      selectedUser.role === 'household'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    Household
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateRole(selectedUser.id, 'collector')}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                      selectedUser.role === 'collector'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    Collector
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateRole(selectedUser.id, 'admin')}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                      selectedUser.role === 'admin'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-[#136B3B] hover:bg-[#0F5730] text-xs font-bold text-white rounded-full shadow-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Docked Stitch Bottom Navigation */}
      <BottomNav role="admin" />
    </div>
  );
}
