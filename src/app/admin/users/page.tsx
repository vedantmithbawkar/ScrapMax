'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { ArrowLeft, Search, Users as UsersIcon, User, Shield, ChevronRight } from 'lucide-react';

type RoleFilter = 'all' | 'household' | 'collector' | 'admin';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Demo data for when DB is empty
const DEMO_USERS: (UserProfile & { created_at?: string })[] = [
  { id: 'u1', full_name: 'Sahil Kumar', role: 'household', phone: '+91 98765 43210', created_at: '2026-08-15T10:00:00Z' },
  { id: 'u2', full_name: 'Raju Kabadiwala', role: 'collector', phone: '+91 87654 32100', created_at: '2026-08-20T10:00:00Z' },
  { id: 'u3', full_name: 'Priya Sharma', role: 'household', phone: '+91 76543 21000', created_at: '2026-09-01T10:00:00Z' },
  { id: 'u4', full_name: 'Admin User', role: 'admin' as UserProfile['role'], phone: '+91 99999 00000', created_at: '2026-07-01T10:00:00Z' },
  { id: 'u5', full_name: 'Vikram Singh', role: 'collector', phone: '+91 65432 10000', created_at: '2026-09-05T10:00:00Z' },
  { id: 'u6', full_name: 'Ananya Patel', role: 'household', phone: '+91 54321 00000', created_at: '2026-09-08T10:00:00Z' },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  household: { label: 'Household', color: 'bg-blue-50 text-blue-700', icon: '🏠' },
  collector: { label: 'Collector', color: 'bg-emerald-50 text-emerald-700', icon: '🚛' },
  admin: { label: 'Admin', color: 'bg-purple-50 text-purple-700', icon: '🛡️' },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<(UserProfile & { created_at?: string })[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/household'); return; }
      setIsAdmin(true);

      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData && usersData.length > 0) {
        setUsers(usersData as (UserProfile & { created_at?: string })[]);
      } else {
        setUsers(DEMO_USERS);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return u.full_name?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: users.length,
    household: users.filter(u => u.role === 'household').length,
    collector: users.filter(u => u.role === 'collector').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  if (!isAdmin && !loading) return null;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-3 flex-1">

        <header className="flex items-center gap-3 pt-2 pb-5">
          <button onClick={() => router.push('/admin')} aria-label="Go back" className="p-1 -ml-1 hover:opacity-75 transition" type="button">
            <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">User Management</h1>
            <p className="text-[12px] text-[#6B7280] font-medium">{users.length} registered users</p>
          </div>
        </header>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, phone, or ID…"
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 text-[14px] text-[#191C1E] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#136B3B]/30 focus:border-[#136B3B] transition"
          />
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
          {([
            { key: 'all' as RoleFilter, label: 'All Users' },
            { key: 'household' as RoleFilter, label: '🏠 Households' },
            { key: 'collector' as RoleFilter, label: '🚛 Collectors' },
            { key: 'admin' as RoleFilter, label: '🛡️ Admins' },
          ]).map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setRoleFilter(t.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition ${
                roleFilter === t.key
                  ? 'bg-[#191C1E] text-white'
                  : 'bg-white border border-gray-200 text-[#526056] hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-black ${roleFilter === t.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#136B3B] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span className="text-5xl">👥</span>
            <p className="text-[16px] font-bold text-[#191C1E]">No users found</p>
            <p className="text-[13px] text-[#6B7280] max-w-xs">
              {search ? 'Try a different search term.' : 'No users match the current filter.'}
            </p>
          </div>
        )}

        {/* User list */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(user => {
              const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.household;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3.5 bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition"
                >
                  <div className="w-11 h-11 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#136B3B] font-bold text-[16px] flex-shrink-0">
                    {user.full_name?.charAt(0) ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[14px] font-bold text-[#191C1E] truncate">{user.full_name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${roleCfg.color}`}>
                        {roleCfg.icon} {roleCfg.label}
                      </span>
                    </div>
                    {user.phone && (
                      <p className="text-[12px] text-[#6B7280] font-medium">{user.phone}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-[#9CA3AF] font-mono">ID: {user.id.slice(0, 8)}…</span>
                      {user.created_at && (
                        <span className="text-[10px] text-[#9CA3AF]">Joined {formatDate(user.created_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
      <BottomNav role="admin" />
    </div>
  );
}
