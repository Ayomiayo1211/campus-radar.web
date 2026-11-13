'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Resource = {
  id: string;
  title: string;
  description: string | null;
  originalFileName: string;
  mimeType: string;
  fileCategory: 'IMAGE' | 'PDF' | 'AUDIO';
  fileSize: number;
  uploadedBy: string | null;
  uploaderName: string;
  createdAt: string;
};

type LibraryResponse = {
  resources?: Resource[];
  currentUser?: { id: string; role: string };
  error?: string;
};

const ACCEPTED_FILES = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/flac,audio/aac';
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function NewsroomResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [currentUser, setCurrentUser] = useState<LibraryResponse['currentUser']>();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'ALL' | 'IMAGE' | 'PDF' | 'AUDIO'>('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadResources() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/newsroom/resources', { cache: 'no-store' });
      const result = await response.json() as LibraryResponse;
      if (!response.ok) throw new Error(result.error || 'Could not load the resources library.');
      setResources(result.resources ?? []);
      setCurrentUser(result.currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the resources library.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadResources(); }, []);

  async function uploadResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Choose an image, PDF or audio file first.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Files must be 25MB or smaller.');
      return;
    }

    setUploading(true);
    setError('');
    setNotice('');
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('title', title);
      form.append('description', description);
      const response = await fetch('/api/newsroom/resources', { method: 'POST', body: form });
      const result = await response.json() as { resource?: Resource; error?: string };
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      if (result.resource) setResources(current => [result.resource!, ...current]);
      setFile(null);
      setTitle('');
      setDescription('');
      if (inputRef.current) inputRef.current.value = '';
      setNotice('Resource uploaded to the newsroom library.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function deleteResource(resource: Resource) {
    if (!window.confirm(`Delete “${resource.title}” from the newsroom library?`)) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/newsroom/resources/${encodeURIComponent(resource.id)}`, { method: 'DELETE' });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not delete this resource.');
      setResources(current => current.filter(item => item.id !== resource.id));
      setNotice('Resource deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this resource.');
    }
  }

  const filteredResources = useMemo(() => resources.filter(resource => {
    const matchesCategory = category === 'ALL' || resource.fileCategory === category;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [resource.title, resource.description, resource.originalFileName, resource.uploaderName]
      .some(value => value?.toLowerCase().includes(term));
    return matchesCategory && matchesSearch;
  }), [resources, category, search]);

  const counts = {
    ALL: resources.length,
    IMAGE: resources.filter(item => item.fileCategory === 'IMAGE').length,
    PDF: resources.filter(item => item.fileCategory === 'PDF').length,
    AUDIO: resources.filter(item => item.fileCategory === 'AUDIO').length,
  };

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Campus Radar · Editorial operations</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-950">Newsroom Resources</h1>
            <p className="mt-2 text-sm text-gray-600">A shared library for images, documents and audio collected by the newsroom.</p>
          </div>
          <button type="button" onClick={() => void loadResources()} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium">Refresh library</button>
        </div>

        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}

        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-950">Add a resource</h2>
          <p className="mt-1 text-sm text-gray-500">Images, PDFs and common audio formats are supported. Maximum file size: 25MB.</p>
          <form onSubmit={uploadResource} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              File
              <input ref={inputRef} type="file" accept={ACCEPTED_FILES} onChange={event => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm font-normal" />
              {file && <span className="mt-1 block text-xs text-gray-500">{file.name} · {formatSize(file.size)}</span>}
            </label>
            <label className="text-sm font-medium text-gray-700">
              Resource title
              <input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder="e.g. SUG protest photographs" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Description (optional)
              <input value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} placeholder="Add context for other newsroom members" className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-3 font-normal" />
            </label>
            <div className="flex justify-end md:col-span-2">
              <button type="submit" disabled={uploading || !file} className="rounded-lg bg-[#173B87] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{uploading ? 'Uploading…' : 'Upload resource'}</button>
            </div>
          </form>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-950">Library</h2>
              <p className="mt-1 text-sm text-gray-500">{resources.length} resource{resources.length === 1 ? '' : 's'} available to newsroom members</p>
            </div>
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search resources…" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm sm:w-64" />
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(['ALL', 'IMAGE', 'PDF', 'AUDIO'] as const).map(item => (
              <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-xs font-semibold ${category === item ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
                {item === 'ALL' ? 'All' : item === 'IMAGE' ? 'Images' : item === 'PDF' ? 'PDFs' : 'Audio'} ({counts[item]})
              </button>
            ))}
          </div>

          {loading ? <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">Loading resources…</div> :
            filteredResources.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map(resource => {
                  const canDelete = resource.uploadedBy === currentUser?.id || ['SUPER_ADMIN', 'SENIOR_EDITOR'].includes(currentUser?.role || '');
                  return (
                    <article key={resource.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {resource.fileCategory === 'IMAGE' ? (
                        <a href={`/api/newsroom/resources/${resource.id}/download`} target="_blank" rel="noreferrer" className="block aspect-[16/9] bg-gray-100">
                          <img src={`/api/newsroom/resources/${resource.id}/download`} alt={resource.title} className="h-full w-full object-cover" loading="lazy" />
                        </a>
                      ) : (
                        <div className="flex h-28 items-center gap-3 bg-gray-50 px-5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-gray-700 shadow-sm">{resource.fileCategory}</div>
                          <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{resource.originalFileName}</p><p className="mt-1 text-xs text-gray-500">{formatSize(resource.fileSize)}</p></div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 font-semibold text-gray-950">{resource.title}</h3>
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">{resource.fileCategory}</span>
                        </div>
                        {resource.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{resource.description}</p>}
                        <p className="mt-3 text-xs text-gray-500">{resource.uploaderName} · {formatDate(resource.createdAt)} · {formatSize(resource.fileSize)}</p>
                        {resource.fileCategory === 'AUDIO' && <audio controls preload="none" src={`/api/newsroom/resources/${resource.id}/download`} className="mt-3 w-full" />}
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <a href={`/api/newsroom/resources/${resource.id}/download`} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">{resource.fileCategory === 'IMAGE' ? 'Open image' : resource.fileCategory === 'PDF' ? 'Open PDF' : 'Download audio'}</a>
                          {canDelete && <button type="button" onClick={() => void deleteResource(resource)} className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">{resources.length ? 'No resources match this search or filter.' : 'No newsroom resources have been uploaded yet.'}</div>}
        </section>
      </div>
    </main>
  );
}
