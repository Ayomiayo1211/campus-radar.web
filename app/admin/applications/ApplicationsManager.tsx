'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type Status = 'NEW' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
type Application = {
  id: string;
  full_name: string;
  matric_number: string;
  level: string;
  department: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  teams: string[];
  why_team: string | null;
  skills: string | null;
  portfolio: string | null;
  prior_role: string | null;
  heard_from: string | null;
  hours_per_week: string;
  status: Status;
  created_at: string;
  reviewed_at: string | null;
};
const teamLabels: Record<string, string> = {
  EDITORIAL: 'Editorial', CREATIVE: 'Creative', PHOTOGRAPHY: 'Photography',
  PODCAST: 'Podcast', EVENTS: 'Events', PARTNERSHIPS: 'Partnerships',
};
const statuses: { value: Status | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All applications' },
  { value: 'NEW', label: 'New' },
  { value: 'REVIEWING', label: 'Reviewing' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
];

function csvCell(value: unknown) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"';
}

export default function ApplicationsManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/applications', { cache: 'no-store' });
      const result = await response.json() as { applications?: Application[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not load applications.');
      setApplications(result.applications ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter(item => {
      const statusMatch = filter === 'ALL' || item.status === filter;
      const text = [item.full_name, item.email, item.matric_number, item.department, item.phone, ...item.teams].join(' ').toLowerCase();
      return statusMatch && (!term || text.includes(term));
    });
  }, [applications, filter, search]);

  async function updateStatus(application: Application, status: Status) {
    setBusyId(application.id);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id, status }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not update application.');
      setApplications(current => current.map(item => item.id === application.id ? { ...item, status, reviewed_at: new Date().toISOString() } : item));
      setMessage('Application status updated.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update application.');
    } finally {
      setBusyId('');
    }
  }

  function exportCsv() {
    const columns: (keyof Application)[] = ['created_at','full_name','matric_number','level','department','phone','whatsapp','email','teams','why_team','skills','portfolio','prior_role','heard_from','hours_per_week','status'];
    const rows = [columns.join(','), ...visible.map(item => columns.map(column => csvCell(column === 'teams' ? item.teams.map(team => teamLabels[team] ?? team).join('; ') : item[column])).join(','))];
    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'campus-radar-member-applications.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const counts = useMemo(() => ({
    all: applications.length,
    fresh: applications.filter(item => item.status === 'NEW').length,
    reviewing: applications.filter(item => item.status === 'REVIEWING').length,
    accepted: applications.filter(item => item.status === 'ACCEPTED').length,
  }), [applications]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {[['Total', counts.all], ['New', counts.fresh], ['Reviewing', counts.reviewing], ['Accepted', counts.accepted]].map(([label, count]) => (
          <div key={String(label)} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-semibold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700">{message}</p>}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input aria-label="Search applications" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, email, matric number..." className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            <select aria-label="Filter by status" value={filter} onChange={event => setFilter(event.target.value as Status | 'ALL')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">Refresh</button>
            <button type="button" onClick={exportCsv} disabled={!visible.length} className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-40">Export CSV</button>
          </div>
        </div>

        {loading ? <p className="p-10 text-center text-sm text-gray-500">Loading applications...</p> : visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">{applications.length ? 'No applications match this filter.' : 'No applications have been submitted yet.'}</p>
        ) : (
          <div className="divide-y divide-gray-200">
            {visible.map(application => (
              <article key={application.id} className="p-5 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold">{application.status}</span>
                      <span className="text-xs text-gray-500">{new Date(application.created_at).toLocaleString()}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">{application.full_name}</h2>
                    <p className="mt-1 text-sm text-gray-600">{application.department} · {application.level} level · {application.matric_number}</p>
                    <div className="mt-3 grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
                      <p><strong>Email:</strong> <a className="underline" href={`mailto:${application.email}`}>{application.email}</a></p>
                      <p><strong>Phone:</strong> {application.phone}</p>
                      {application.whatsapp && <p><strong>WhatsApp:</strong> {application.whatsapp}</p>}
                      <p><strong>Availability:</strong> {application.hours_per_week} per week</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {application.teams.map(team => <span key={team} className="rounded-md border border-gray-200 px-2 py-1 text-xs">{teamLabels[team] ?? team}</span>)}
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      {application.why_team && <div><dt className="font-semibold text-gray-800">Why these teams</dt><dd className="mt-1 whitespace-pre-wrap text-gray-600">{application.why_team}</dd></div>}
                      {application.skills && <div><dt className="font-semibold text-gray-800">Skills / experience</dt><dd className="mt-1 whitespace-pre-wrap text-gray-600">{application.skills}</dd></div>}
                      {application.portfolio && <div><dt className="font-semibold text-gray-800">Portfolio / handles</dt><dd className="mt-1 break-words text-gray-600">{application.portfolio}</dd></div>}
                      {application.prior_role && <div><dt className="font-semibold text-gray-800">Previous leadership / media role</dt><dd className="mt-1 text-gray-600">{application.prior_role}</dd></div>}
                      {application.heard_from && <div><dt className="font-semibold text-gray-800">Heard about Campus Radar via</dt><dd className="mt-1 text-gray-600">{application.heard_from}</dd></div>}
                    </dl>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-44 lg:flex-col">
                    {application.status !== 'REVIEWING' && <button type="button" disabled={busyId === application.id} onClick={() => void updateStatus(application, 'REVIEWING')} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium disabled:opacity-50">Mark reviewing</button>}
                    {application.status !== 'ACCEPTED' && <button type="button" disabled={busyId === application.id} onClick={() => void updateStatus(application, 'ACCEPTED')} className="rounded-lg bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-50">Accept</button>}
                    {application.status !== 'REJECTED' && <button type="button" disabled={busyId === application.id} onClick={() => void updateStatus(application, 'REJECTED')} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium disabled:opacity-50">Reject</button>}
                    {application.status !== 'NEW' && <button type="button" disabled={busyId === application.id} onClick={() => void updateStatus(application, 'NEW')} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium disabled:opacity-50">Reset to new</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="border-t border-gray-200 px-5 py-3 text-xs text-gray-500">Showing {visible.length} of {applications.length} loaded applications. The dashboard loads the latest 300.</div>
      </section>
    </div>
  );
}
