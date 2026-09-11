import { createClient } from '@/lib/supabase/client';
import {
  Report,
  ReportEvent,
  ReportStatus,
  ReportPriority,
  TransactionReportCategory,
  PlatformReportCategory,
} from '@/types';

// ──────────────────────────────────────────────────────────────────────────────
// REPORT NUMBER GENERATOR
// Format: RPT-YYYY-XXXXXX (e.g. RPT-2026-001245)
// ──────────────────────────────────────────────────────────────────────────────
export function generateReportNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  return `RPT-${year}-${seq}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// CREATE — Transaction (pickup-specific) report
// ──────────────────────────────────────────────────────────────────────────────
export async function createTransactionReport(params: {
  reporterId: string;
  category: TransactionReportCategory;
  description?: string;
  pickupId: string;
  collectorId?: string | null;
  evidenceUrls?: string[];
}): Promise<{ report: Report | null; error: string | null }> {
  const supabase = createClient();
  const reportNumber = generateReportNumber();

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_number: reportNumber,
      reporter_id: params.reporterId,
      report_type: 'transaction',
      category: params.category,
      description: params.description ?? null,
      pickup_id: params.pickupId,
      collector_id: params.collectorId ?? null,
      evidence_urls: params.evidenceUrls ?? [],
      status: 'open',
      priority: 'normal',
    })
    .select('*')
    .single();

  if (error) return { report: null, error: error.message };

  // Log the creation event
  await supabase.from('report_events').insert({
    report_id: data.id,
    actor_id: params.reporterId,
    event_type: 'created',
    new_value: 'open',
    note: `Report ${reportNumber} created`,
  });

  return { report: data as Report, error: null };
}

// ──────────────────────────────────────────────────────────────────────────────
// CREATE — Platform (general) report
// ──────────────────────────────────────────────────────────────────────────────
export async function createPlatformReport(params: {
  reporterId: string;
  category: PlatformReportCategory;
  subject?: string;
  description?: string;
  evidenceUrls?: string[];
}): Promise<{ report: Report | null; error: string | null }> {
  const supabase = createClient();
  const reportNumber = generateReportNumber();

  const { data, error } = await supabase
    .from('reports')
    .insert({
      report_number: reportNumber,
      reporter_id: params.reporterId,
      report_type: 'platform',
      category: params.category,
      subject: params.subject ?? null,
      description: params.description ?? null,
      evidence_urls: params.evidenceUrls ?? [],
      status: 'open',
      priority: 'normal',
    })
    .select('*')
    .single();

  if (error) return { report: null, error: error.message };

  // Log the creation event
  await supabase.from('report_events').insert({
    report_id: data.id,
    actor_id: params.reporterId,
    event_type: 'created',
    new_value: 'open',
    note: `Report ${reportNumber} created`,
  });

  return { report: data as Report, error: null };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET — My Reports (for the logged-in user)
// ──────────────────────────────────────────────────────────────────────────────
export async function getMyReports(
  userId: string
): Promise<{ reports: Report[]; error: string | null }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { reports: [], error: error.message };
  return { reports: (data as Report[]) ?? [], error: null };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET — Single report with events
// ──────────────────────────────────────────────────────────────────────────────
export async function getReportById(reportId: string): Promise<{
  report: Report | null;
  events: ReportEvent[];
  error: string | null;
}> {
  const supabase = createClient();

  const [reportRes, eventsRes] = await Promise.all([
    supabase.from('reports').select('*').eq('id', reportId).single(),
    supabase
      .from('report_events')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true }),
  ]);

  if (reportRes.error) {
    return { report: null, events: [], error: reportRes.error.message };
  }

  return {
    report: reportRes.data as Report,
    events: (eventsRes.data as ReportEvent[]) ?? [],
    error: null,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET — All reports (admin only)
// ──────────────────────────────────────────────────────────────────────────────
export async function getAdminReports(filters?: {
  type?: 'transaction' | 'platform';
  status?: ReportStatus;
}): Promise<{ reports: Report[]; error: string | null }> {
  const supabase = createClient();

  let query = supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(full_name, role)')
    .order('created_at', { ascending: false });

  if (filters?.type) query = query.eq('report_type', filters.type);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) return { reports: [], error: error.message };
  return { reports: (data as Report[]) ?? [], error: null };
}

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE — Report status (admin action)
// ──────────────────────────────────────────────────────────────────────────────
export async function updateReportStatus(params: {
  reportId: string;
  actorId: string;
  oldStatus: ReportStatus;
  newStatus: ReportStatus;
  note?: string;
  resolution?: string;
}): Promise<{ error: string | null }> {
  const supabase = createClient();

  const updates: Record<string, unknown> = {
    status: params.newStatus,
    updated_at: new Date().toISOString(),
  };

  if (params.newStatus === 'resolved' || params.newStatus === 'closed') {
    updates.resolved_at = new Date().toISOString();
  }
  if (params.resolution) {
    updates.resolution = params.resolution;
  }

  const { error: updateErr } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', params.reportId);

  if (updateErr) return { error: updateErr.message };

  const { error: eventErr } = await supabase.from('report_events').insert({
    report_id: params.reportId,
    actor_id: params.actorId,
    event_type: 'status_change',
    old_value: params.oldStatus,
    new_value: params.newStatus,
    note: params.note ?? null,
  });

  return { error: eventErr?.message ?? null };
}

// ──────────────────────────────────────────────────────────────────────────────
// UPDATE — Report priority (admin action)
// ──────────────────────────────────────────────────────────────────────────────
export async function updateReportPriority(params: {
  reportId: string;
  actorId: string;
  oldPriority: ReportPriority;
  newPriority: ReportPriority;
  note?: string;
}): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error: updateErr } = await supabase
    .from('reports')
    .update({ priority: params.newPriority, updated_at: new Date().toISOString() })
    .eq('id', params.reportId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from('report_events').insert({
    report_id: params.reportId,
    actor_id: params.actorId,
    event_type: 'priority_change',
    old_value: params.oldPriority,
    new_value: params.newPriority,
    note: params.note ?? null,
  });

  return { error: null };
}

// ──────────────────────────────────────────────────────────────────────────────
// ADD — Admin investigation note
// ──────────────────────────────────────────────────────────────────────────────
export async function addAdminNote(params: {
  reportId: string;
  actorId: string;
  note: string;
}): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error: updateErr } = await supabase
    .from('reports')
    .update({ admin_notes: params.note, updated_at: new Date().toISOString() })
    .eq('id', params.reportId);

  if (updateErr) return { error: updateErr.message };

  await supabase.from('report_events').insert({
    report_id: params.reportId,
    actor_id: params.actorId,
    event_type: 'note_added',
    note: params.note,
  });

  return { error: null };
}
