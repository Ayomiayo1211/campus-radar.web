'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Person = { id: string; name: string; email: string; role?: string };
type Story = {
  id: string; title: string; slug: string; excerpt: string | null; status: string;
  authorName: string; authorId: string; assignedEditorId: string | null;
  assignedReporterId: string | null; assignedNote: string | null; updatedAt: string;
};
type DeskResponse = {
  stories?: Story[]; reporters?: Person[]; editors?: Person[];
  currentUser?: { id: string; role: string; name: string }; error?: string;
};

export default function NewsroomDeskPage() {
  const [data, setData] = useState<DeskResponse>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [storyId, setStoryId] = useState('');
  const [reporterId, setReporterId] = useState('');
  const [note, setNote] = useState('');

  async function loadDesk() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/newsroom/assignments', { cache: 'no-store' });
      const result = await response.json() as DeskResponse;
      if (!response.ok) throw new Error(result.error || 'Could not load newsroom desk.');
      setData(result);
      setStoryId(current => current || result.stories?.[0]?.id || '');
      setReporterId(current => current || result.reporters?.[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load newsroom desk.');
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadDesk(); }, []);

  async function assignTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storyId || !reporterId) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/stories/${encodeURIComponent(storyId)}/assign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'REPORTER_TASK', assigneeId: reporterId, note }),
      });
      const result = await response.json() as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not assign this story.');
      setMessage(result.message || 'Task assigned.');
      setNote('');
      await loadDesk();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign this story.');
    } finally { setBusy(false); }
  }

  const canAllocate = ['SUPER_ADMIN', 'SENIOR_EDITOR'].includes(data.currentUser?.role || '');
  const reporters = data.reporters || [];
  const editors = data.editors || [];
  const stories = data.stories || [];
  const assignedStories = stories.filter(story => story.assignedReporterId);

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Campus Radar · Editorial operations</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Newsroom Desk</h1>
            <p className="mt-2 text-sm text-gray-600">Coordinate story assignments and monitor newsroom activity.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void loadDesk()} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium">Refresh</button>
            <Link href="/admin/stories" className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white">All stories</Link>
          </div>
        </div>

        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{message}</div>}

        {loading ? <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">Loading newsroom desk…</div> : (
          <>
            {canAllocate && (
              <section className="mb-7 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-gray-950">Allocate a story</h2>
                  <p className="mt-1 text-sm text-gray-500">The selected reporter will receive an email with the story link and your instructions.</p>
                </div>
                <form onSubmit={assignTask} className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-gray-700">Story
                    <select value={storyId} onChange={event => setStoryId(event.target.value)} required className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 font-normal">
                      <option value="">Choose a story</option>
                      {stories.filter(story => !['PUBLISHED', 'ARCHIVED'].includes(story.status)).map(story => <option key={story.id} value={story.id}>{story.title} · {story.status}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">Assign to reporter
                    <select value={reporterId} onChange={event => setReporterId(event.target.value)} required className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 font-normal">
                      <option value="">Choose a reporter</option>
                      {reporters.map(person => <option key={person.id} value={person.id}>{person.name} ({person.email})</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700 md:col-span-2">Instructions / brief
                    <textarea value={note} onChange={event => setNote(event.target.value)} rows={3} maxLength={1000} placeholder="What should the reporter cover? Include key details, contacts, or angles." className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal" />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                    <p className="text-xs text-gray-500">Task allocation is available to Senior Editors and Super Admins.</p>
                    <button disabled={busy || !storyId || !reporterId} className="rounded-lg bg-[#173B87] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Assigning…' : 'Assign story & email reporter'}</button>
                  </div>
                </form>
              </section>
            )}

            <div className="mb-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Active reporters</p><p className="mt-2 text-3xl font-semibold text-gray-950">{reporters.length}</p></div>
              <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Editorial staff</p><p className="mt-2 text-3xl font-semibold text-gray-950">{editors.length}</p></div>
              <div className="rounded-xl border border-gray-200 bg-white p-5"><p className="text-sm text-gray-500">Assigned stories</p><p className="mt-2 text-3xl font-semibold text-gray-950">{assignedStories.length}</p></div>
            </div>

            <section className="mb-7 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold text-gray-950">Reporter roster</h2><p className="mt-1 text-sm text-gray-500">Active reporters available for story allocation.</p></div>
              {reporters.length ? <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">{reporters.map(person => <div key={person.id} className="bg-white p-4"><p className="font-medium text-gray-900">{person.name}</p><p className="mt-1 break-all text-xs text-gray-500">{person.email}</p></div>)}</div> : <p className="p-5 text-sm text-gray-500">No active reporter accounts were returned for your role.</p>}
            </section>

            <section className="mb-7 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold text-gray-950">Editors & senior editors</h2><p className="mt-1 text-sm text-gray-500">Active editorial staff and newsroom administrators.</p></div>
              {editors.length ? <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">{editors.map(person => <div key={person.id} className="bg-white p-4"><div className="flex items-center justify-between gap-2"><p className="font-medium text-gray-900">{person.name}</p><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase text-gray-600">{person.role?.replace('_', ' ')}</span></div><p className="mt-1 break-all text-xs text-gray-500">{person.email}</p></div>)}</div> : <p className="p-5 text-sm text-gray-500">No editorial accounts were returned.</p>}
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-4"><h2 className="font-semibold text-gray-950">Assigned story queue</h2><p className="mt-1 text-sm text-gray-500">Current reporter allocations and story status.</p></div>
              {assignedStories.length ? <div className="divide-y divide-gray-100">{assignedStories.map(story => {
                const reporter = reporters.find(person => person.id === story.assignedReporterId);
                return <article key={story.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div className="min-w-0"><p className="font-medium text-gray-950">{story.title}</p><p className="mt-1 text-xs text-gray-500">Assigned to {reporter?.name || 'Reporter'} · {story.status} · Updated {new Date(story.updatedAt).toLocaleString()}</p>{story.assignedNote && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{story.assignedNote}</p>}</div><Link href={`/admin/stories/${story.id}`} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium">Open story</Link></article>;
              })}</div> : <p className="p-5 text-sm text-gray-500">No reporter tasks have been allocated yet.</p>}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
