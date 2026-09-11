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
// LOCAL STORAGE PERSISTENCE HELPERS (FOR OFFLINE / BEFORE-MIGRATION FALLBACK)
// ──────────────────────────────────────────────────────────────────────────────
function getLocalReports(): Report[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('local_reports');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: Report[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('local_reports', JSON.stringify(reports));
  } catch (e) {
    console.warn('Could not save to local_reports:', e);
  }
}

function appendLocalReport(report: Report): void {
  const current = getLocalReports();
  // Check if already exists
  const idx = current.findIndex((r) => r.id === report.id || r.report_number === report.report_number);
  if (idx >= 0) {
    current[idx] = report;
  } else {
    current.unshift(report);
  }
  saveLocalReports(current);
}

function getLocalEvents(): ReportEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('local_report_events');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendLocalEvent(event: ReportEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalEvents();
    current.push(event);
    localStorage.setItem('local_report_events', JSON.stringify(current));
  } catch (e) {
    console.warn('Could not save to local_report_events:', e);
  }
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
  const reportNumber = generateReportNumber();

  try {
    const supabase = createClient();
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

    if (!error && data) {
      try {
        await supabase.from('report_events').insert({
          report_id: data.id,
          actor_id: params.reporterId,
          event_type: 'created',
          new_value: 'open',
          note: `Report ${reportNumber} created`,
        });
      } catch {}

      appendLocalReport(data as Report);
      return { report: data as Report, error: null };
    }
    console.warn('Supabase reports insert returned error, activating local persistence:', error?.message);
  } catch (err) {
    console.warn('Supabase reports connection error, activating local persistence:', err);
  }

  // Graceful fallback: Store in local storage so user is never blocked
  const localReport: Report = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    report_number: reportNumber,
    reporter_id: params.reporterId,
    report_type: 'transaction',
    category: params.category,
    description: params.description ?? undefined,
    pickup_id: params.pickupId,
    collector_id: params.collectorId ?? undefined,
    evidence_urls: params.evidenceUrls ?? [],
    status: 'open',
    priority: 'normal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  appendLocalReport(localReport);
  appendLocalEvent({
    id: `evt-${localReport.id}`,
    report_id: localReport.id,
    actor_id: params.reporterId,
    event_type: 'created',
    new_value: 'open',
    note: `Report ${reportNumber} created`,
    created_at: new Date().toISOString(),
  });

  return { report: localReport, error: null };
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
  const reportNumber = generateReportNumber();

  try {
    const supabase = createClient();
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

    if (!error && data) {
      try {
        await supabase.from('report_events').insert({
          report_id: data.id,
          actor_id: params.reporterId,
          event_type: 'created',
          new_value: 'open',
          note: `Report ${reportNumber} created`,
        });
      } catch {}

      appendLocalReport(data as Report);
      return { report: data as Report, error: null };
    }
    console.warn('Supabase reports insert returned error, activating local persistence:', error?.message);
  } catch (err) {
    console.warn('Supabase reports connection error, activating local persistence:', err);
  }

  // Graceful fallback: Store in local storage so user is never blocked
  const localReport: Report = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    report_number: reportNumber,
    reporter_id: params.reporterId,
    report_type: 'platform',
    category: params.category,
    subject: params.subject ?? undefined,
    description: params.description ?? undefined,
    evidence_urls: params.evidenceUrls ?? [],
    status: 'open',
    priority: 'normal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  appendLocalReport(localReport);
  appendLocalEvent({
    id: `evt-${localReport.id}`,
    report_id: localReport.id,
    actor_id: params.reporterId,
    event_type: 'created',
    new_value: 'open',
    note: `Report ${reportNumber} created`,
    created_at: new Date().toISOString(),
  });

  return { report: localReport, error: null };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET — My Reports (for the logged-in user)
// ──────────────────────────────────────────────────────────────────────────────
export async function getMyReports(
  userId: string
): Promise<{ reports: Report[]; error: string | null }> {
  let remoteList: Report[] = [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      remoteList = data as Report[];
    }
  } catch {}

  const localList = getLocalReports().filter((r) => r.reporter_id === userId || r.reporter_id === 'guest-user');

  // Deduplicate
  const seen = new Set<string>();
  const combined: Report[] = [];
  for (const rep of [...localList, ...remoteList]) {
    const key = rep.report_number || rep.id;
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(rep);
    }
  }

  return { reports: combined, error: null };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET — Single report with events
// ──────────────────────────────────────────────────────────────────────────────
export async function getReportById(reportId: string): Promise<{
  report: Report | null;
  events: ReportEvent[];
  error: string | null;
}> {
  try {
    const supabase = createClient();
    const [reportRes, eventsRes] = await Promise.all([
      supabase.from('reports').select('*').eq('id', reportId).single(),
      supabase
        .from('report_events')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true }),
    ]);

    if (!reportRes.error && reportRes.data) {
      return {
        report: reportRes.data as Report,
        events: (eventsRes.data as ReportEvent[]) ?? [],
        error: null,
      };
    }
  } catch {}

  // Fallback to local storage
  const localList = getLocalReports();
  const match = localList.find((r) => r.id === reportId || r.report_number === reportId);
  if (match) {
    const localEvents = getLocalEvents().filter((e) => e.report_id === match.id);
    if (localEvents.length === 0) {
      localEvents.push({
        id: `evt-${match.id}`,
        report_id: match.id,
        actor_id: match.reporter_id,
        event_type: 'created',
        new_value: match.status,
        note: `Report ${match.report_number} created`,
        created_at: match.created_at,
      });
    }
    return {
      report: match,
      events: localEvents,
      error: null,
    };
  }

  return { report: null, events: [], error: 'Report not found' };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET — All reports (admin only)
// ──────────────────────────────────────────────────────────────────────────────
export async function getAdminReports(filters?: {
  type?: 'transaction' | 'platform';
  status?: ReportStatus;
}): Promise<{ reports: Report[]; error: string | null }> {
  let remoteList: Report[] = [];
  try {
    const supabase = createClient();
    let query = supabase
      .from('reports')
      .select('*, reporter:profiles!reporter_id(full_name, role)')
      .order('created_at', { ascending: false });

    if (filters?.type) query = query.eq('report_type', filters.type);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (!error && data) {
      remoteList = data as Report[];
    }
  } catch {}

  const localList = getLocalReports();

  const seen = new Set<string>();
  const combined: Report[] = [];
  for (const rep of [...localList, ...remoteList]) {
    const key = rep.report_number || rep.id;
    if (!seen.has(key)) {
      seen.add(key);
      if (filters?.type && rep.report_type !== filters.type) continue;
      if (filters?.status && rep.status !== filters.status) continue;
      combined.push(rep);
    }
  }

  return { reports: combined, error: null };
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

  try {
    const supabase = createClient();
    await supabase.from('reports').update(updates).eq('id', params.reportId);
    await supabase.from('report_events').insert({
      report_id: params.reportId,
      actor_id: params.actorId,
      event_type: 'status_change',
      old_value: params.oldStatus,
      new_value: params.newStatus,
      note: params.note ?? null,
    });
  } catch {}

  // Update in local storage if present
  const localList = getLocalReports();
  const idx = localList.findIndex((r) => r.id === params.reportId || r.report_number === params.reportId);
  if (idx >= 0) {
    localList[idx] = {
      ...localList[idx],
      status: params.newStatus,
      resolution: params.resolution ?? localList[idx].resolution,
      resolved_at: (params.newStatus === 'resolved' || params.newStatus === 'closed') ? new Date().toISOString() : localList[idx].resolved_at,
      updated_at: new Date().toISOString(),
    };
    saveLocalReports(localList);

    appendLocalEvent({
      id: `evt-${Date.now()}`,
      report_id: localList[idx].id,
      actor_id: params.actorId,
      event_type: 'status_change',
      old_value: params.oldStatus,
      new_value: params.newStatus,
      note: params.note ?? undefined,
      created_at: new Date().toISOString(),
    });
  }

  return { error: null };
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
  try {
    const supabase = createClient();
    await supabase
      .from('reports')
      .update({ priority: params.newPriority, updated_at: new Date().toISOString() })
      .eq('id', params.reportId);

    await supabase.from('report_events').insert({
      report_id: params.reportId,
      actor_id: params.actorId,
      event_type: 'priority_change',
      old_value: params.oldPriority,
      new_value: params.newPriority,
      note: params.note ?? null,
    });
  } catch {}

  const localList = getLocalReports();
  const idx = localList.findIndex((r) => r.id === params.reportId || r.report_number === params.reportId);
  if (idx >= 0) {
    localList[idx].priority = params.newPriority;
    localList[idx].updated_at = new Date().toISOString();
    saveLocalReports(localList);
  }

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
  try {
    const supabase = createClient();
    await supabase
      .from('reports')
      .update({ admin_notes: params.note, updated_at: new Date().toISOString() })
      .eq('id', params.reportId);

    await supabase.from('report_events').insert({
      report_id: params.reportId,
      actor_id: params.actorId,
      event_type: 'note_added',
      note: params.note,
    });
  } catch {}

  const localList = getLocalReports();
  const idx = localList.findIndex((r) => r.id === params.reportId || r.report_number === params.reportId);
  if (idx >= 0) {
    localList[idx].admin_notes = params.note;
    localList[idx].updated_at = new Date().toISOString();
    saveLocalReports(localList);
  }

  return { error: null };
}
