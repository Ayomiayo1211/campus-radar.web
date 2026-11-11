'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Story = {
  id: string;
  title: string;
  excerpt: string;
  status: string;
  authorName: string;
  assignedEditorId?: string | null;
  assignedReporterId?: string | null;
  updatedAt: string;
};
type Person = { id: string; name: string; email: string; role?: string };
type Inbox = {
  stories: Story[];
  reporters: Person[];
  editors: Person[];
  currentUser: { id: string; role: string; name: string };
};

export default function NewsroomAssignmentsPage() {
  const [data, setData] = useState<Inbox | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/newsroom/assignments', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load newsroom work.');
      setData(result as Inbox);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load newsroom work.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function assign(story: Story, type: 'EDITOR_REVIEW' | 'REPORTER_TASK') {
    const assigneeId = targets[story.id];
    if (!assigneeId) { setError('Choose a recipient first.'); return; }
    setBusy(story.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/stories/${story.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, assigneeId, note: notes[story.id] || '' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not route this story.');
      setNotice(result.message || 'Story routed.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not route this story.');
    } finally {
      setBusy(null);
    }
  }

  const role = data?.currentUser.role;
  const canAllocate = role === 'SENIOR_EDITOR' || role === 'SUPER_ADMIN';
  const canSendToEditor = ['REPORTER', 'EDITOR', 'SENIOR_EDITOR', 'SUPER_ADMIN'].includes(role || '');
  const people = canAllocate ? data?.reporters ?? [] : data?.editors ?? [];

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#173B87]">Campus Radar newsroom</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">Assignments & submissions</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">Route stories to an editor for review, or allocate reporting work to a reporter. The original byline stays with the writer.</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-100 disabled:opacity-50">Refresh inbox</button>
        </div>

        {error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</p>}

        {canAllocate && (
          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div><h2 className="text-lg font-semibold text-gray-900">Reporter directory</h2><p className="mt-1 text-sm text-gray-500">Active reporters available for assignments.</p></div>
              <span className="text-sm text-gray-500">{data?.reporters.length ?? 0} reporters</span>
            </div>
            {loading ? <p className="text-sm text-gray-500">Loading reporters...</p> : data?.reporters.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.reporters.map(person => <div key={person.id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"><p className="text-sm font-medium text-gray-900">{person.name}</p><p className="mt-1 text-xs text-gray-500">{person.email}</p></div>)}
              </div>
            ) : <p className="text-sm text-gray-500">No active reporters found.</p>}
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">{role === 'REPORTER' ? 'My stories' : 'Your editorial queue'}</h2>
            <p className="mt-1 text-sm text-gray-500">{role === 'REPORTER' ? 'Your drafts and assigned reporting work.' : 'Stories assigned to you and stories awaiting an editor.'}</p>
          </div>
          {loading ? <div className="p-10 text-center text-sm text-gray-500">Loading newsroom work...</div> : !data?.stories.length ? (
            <div className="p-10 text-center"><p className="font-medium text-gray-800">Nothing in this queue yet.</p><p className="mt-1 text-sm text-gray-500">New submissions and assignments will appear here.</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.stories.map(story => (
                <article key={story.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">{story.status}</span>{story.assignedEditorId && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-800">With editor</span>}{story.assignedReporterId && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">Reporter assigned</span>}</div>
                      <h3 className="text-lg font-semibold text-gray-950">{story.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{story.excerpt}</p>
                      <p className="mt-3 text-xs text-gray-500">By {story.authorName} · Updated {new Date(story.updatedAt).toLocaleString()}</p>
                    </div>
                    <Link href={`/admin/stories/${story.id}`} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50">Open story</Link>
                  </div>
                  {(canAllocate || canSendToEditor) && (
                    <div className="mt-5 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-[1fr_1.2fr_auto] sm:items-end">
                      <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">{canAllocate ? 'Allocate to reporter' : 'Send to editor'}</label>
                        <select value={targets[story.id] || ''} onChange={e => setTargets(v => ({ ...v, [story.id]: e.target.value }))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"><option value="">Choose recipient</option>{(canAllocate ? data.reporters : data.editors).map(person => <option key={person.id} value={person.id}>{person.name}{person.role ? ` · ${person.role.replace('_', ' ')}` : ''}</option>)}</select>
                      </div>
                      <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Note (optional)</label><input value={notes[story.id] || ''} onChange={e => setNotes(v => ({ ...v, [story.id]: e.target.value }))} maxLength={1000} placeholder="Add instructions or context" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"/></div>
                      <button type="button" onClick={() => void assign(story, canAllocate ? 'REPORTER_TASK' : 'EDITOR_REVIEW')} disabled={busy === story.id || !targets[story.id]} className="rounded-lg bg-[#173B87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102d68] disabled:opacity-50">{busy === story.id ? 'Sending...' : canAllocate ? 'Allocate story' : 'Send to editor'}</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
        <p className="mt-5 text-xs leading-5 text-gray-500">Editorial authority remains with the receiving Editor or Senior Editor. Reporters retain their byline and can view saved revisions, but cannot publish or override an editorial decision.</p>
      </div>
    </main>
  );
}
