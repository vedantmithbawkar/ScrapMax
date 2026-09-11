'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/common/Navbar';
import BottomNav from '@/components/common/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getAdminReports } from '@/lib/reports-service';
import { Report, REPORT_STATUS_CONFIG } from '@/types';
import { Shield, Users, Truck, ClipboardList, TrendingUp, AlertTriangle, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [pickupCount, setPickupCount] = useState(0);
  const [householdCount, setHouseholdCount] = useState(0);
  const [collectorCount, setCollectorCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/household'); return; }
      setIsAdmin(true);

      // Fetch stats in parallel
      const [reportsRes, usersRes, pickupsRes, householdsRes, collectorsRes] = await Promise.all([
        getAdminReports(),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('pickup_requests').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'household'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'collector'),
      ]);

      setReports(reportsRes.reports);
      setUserCount(usersRes.count ?? 0);
      setPickupCount(pickupsRes.count ?? 0);
      setHouseholdCount(householdsRes.count ?? 0);
      setCollectorCount(collectorsRes.count ?? 0);
      setLoading(false);
    }
    load();
  }, [router]);

  const openReports = reports.filter(r => r.status === 'open').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'closed').length;
  const recentReports = reports.slice(0, 5);

  if (!isAdmin && !loading) return null;

  return (
    <div className="min-h-screen bg-[#F7F9FA] text-[#191C1E] flex flex-col font-sans pb-32">
      <Navbar />
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-3 flex-1">

        {/* Admin Header */}
        <header className="pt-2 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[#136B3B] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[24px] font-extrabold tracking-tight text-[#191C1E]">Admin Panel</h1>
              <p className="text-[12px] text-[#6B7280] font-medium">ScrapMax Platform Management</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-[#136B3B] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] text-[#6B7280]">Loading dashboard…</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/admin/users" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Users</span>
                </div>
                <p className="text-[28px] font-black text-[#191C1E] leading-none">{userCount}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-medium text-[#6B7280]">{householdCount} households</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-[11px] font-medium text-[#6B7280]">{collectorCount} collectors</span>
                </div>
              </Link>

              <Link href="/admin/pickups" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Pickups</span>
                </div>
                <p className="text-[28px] font-black text-[#191C1E] leading-none">{pickupCount}</p>
                <p className="text-[11px] font-medium text-[#6B7280] mt-1.5">Total pickup requests</p>
              </Link>

              <Link href="/admin/reports" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-200 hover:shadow-sm transition">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Open Reports</span>
                </div>
                <p className="text-[28px] font-black text-red-600 leading-none">{openReports}</p>
                <p className="text-[11px] font-medium text-[#6B7280] mt-1.5">Need attention</p>
              </Link>

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Resolved</span>
                </div>
                <p className="text-[28px] font-black text-emerald-600 leading-none">{resolvedReports}</p>
                <p className="text-[11px] font-medium text-[#6B7280] mt-1.5">Reports closed</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-[15px] font-bold text-[#191C1E] mb-3">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Manage Users', icon: Users, href: '/admin/users', color: 'bg-blue-50 text-blue-600' },
                  { label: 'All Pickups', icon: Truck, href: '/admin/pickups', color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'View Reports', icon: ClipboardList, href: '/admin/reports', color: 'bg-red-50 text-red-600' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2 py-4 px-3 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition text-center"
                  >
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#191C1E]">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Platform Health */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <TrendingUp className="w-5 h-5 text-[#136B3B]" />
                <h2 className="text-[15px] font-bold text-[#191C1E]">Platform Health</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[22px] font-black text-[#136B3B]">{reports.length}</p>
                  <p className="text-[11px] font-medium text-[#6B7280]">Total Reports</p>
                </div>
                <div className="text-center">
                  <p className="text-[22px] font-black text-[#136B3B]">
                    {reports.length > 0 ? Math.round((resolvedReports / reports.length) * 100) : 0}%
                  </p>
                  <p className="text-[11px] font-medium text-[#6B7280]">Resolution Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-[22px] font-black text-[#136B3B]">{pickupCount}</p>
                  <p className="text-[11px] font-medium text-[#6B7280]">All Pickups</p>
                </div>
              </div>
            </div>

            {/* Recent Reports */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold text-[#191C1E]">Recent Reports</h2>
                <Link href="/admin/reports" className="text-[12px] font-bold text-[#136B3B] hover:underline">See all</Link>
              </div>
              {recentReports.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                  <span className="text-4xl">📋</span>
                  <p className="text-[14px] font-bold text-[#191C1E] mt-2">No reports yet</p>
                  <p className="text-[12px] text-[#6B7280]">Reports will appear here as users file them.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReports.map((report) => {
                    const statusCfg = REPORT_STATUS_CONFIG[report.status];
                    return (
                      <Link
                        key={report.id}
                        href={`/admin/reports/${report.id}`}
                        className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3.5 hover:border-gray-200 hover:shadow-sm transition"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${report.report_type === 'transaction' ? 'bg-red-50' : 'bg-orange-50'}`}>
                          <span className="text-lg">{report.report_type === 'transaction' ? '🚩' : '🆘'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#191C1E] truncate">{report.category}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>{statusCfg.label}</span>
                            <span className="text-[10px] text-[#9CA3AF] font-mono">{report.report_number}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Clock className="w-3 h-3 text-[#9CA3AF]" />
                          <span className="text-[11px] text-[#9CA3AF] font-medium">{formatDate(report.created_at)}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
      <BottomNav role="admin" />
    </div>
  );
}
