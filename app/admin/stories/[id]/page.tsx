
'use client';

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

type Story = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  contentType: string;
  origin: string;
  commercialStatus: string;
  status: string;
  featured: boolean;
  coverImage: string | null;
  authorName: string;
};

type Media = {
  id: string;
  secureUrl: string;
  originalName: string | null;
  width: number | null;
  height: number | null;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [contentType, setContentType] = useState('NEWS');
  const [origin, setOrigin] = useState('EDITORIAL');
  const [commercialStatus, setCommercialStatus] = useState('EDITORIAL');
  const [status, setStatus] = useState('DRAFT');
  const [featured, setFeatured] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const [media, setMedia] = useState<Media[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStory() {
      try {
        const response = await fetch(`/api/stories/${id}`);
        const result = (await response.json()) as ApiResponse<Story>;

        if (!response.ok || !result.data) {
          throw new Error(result.error || 'Failed to load story');
        }

        if (cancelled) return;

        const data = result.data;
        setStory(data);
        setTitle(data.title);
        setExcerpt(data.excerpt);
        setBody(data.body);
        setContentType(data.contentType);
        setOrigin(data.origin);
        setCommercialStatus(data.commercialStatus);
        setStatus(data.status);
        setFeatured(data.featured);
        setAuthorName(data.authorName);
        setCoverImage(data.coverImage || '');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) loadStory();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function loadMedia() {
    setMediaLoading(true);

    try {
      const response = await fetch('/api/media');
      const result = (await response.json()) as ApiResponse<Media[]>;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load media');
      }

      setMedia(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setMediaLoading(false);
    }
  }

  async function uploadCoverImage(file: File) {
    setError('');
    setUploadingImage(true);

    try {
      let uploadFile = file;

      if (file.size > 8 * 1024 * 1024) {
        uploadFile = await imageCompression(file, {
          maxSizeMB: 8,
          maxWidthOrHeight: 4572,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: 0.9,
        });
      }

      const formData = new FormData();
      formData.append('file', uploadFile, uploadFile.name);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as ApiResponse<Media>;

      if (!response.ok || !result.data) {
        throw new Error(result.error || 'Image upload failed');
      }

      const uploadedMedia = result.data;
      setCoverImage(uploadedMedia.secureUrl);
      setMedia((current) => [uploadedMedia, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadCoverImage(file);
    event.target.value = '';
  }

  function openImagePicker() {
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    }
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    void uploadCoverImage(file);
  }

  function selectMedia(url: string) {
    setCoverImage(url);
    setShowMediaLibrary(false);
  }

  function removeCoverImage() {
    setCoverImage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          body,
          contentType,
          origin,
          commercialStatus,
          status,
          featured,
          authorName,
          coverImage: coverImage || null,
        }),
      });

      const result = (await response.json()) as ApiResponse<Story>;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update story');
      }

      router.push('/admin/stories');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
      });

      const result = (await response.json()) as ApiResponse<Story>;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete story');
      }

      router.push('/admin/stories');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl text-center text-gray-500">
          Loading story...
        </div>
      </main>
    );
  }

  if (!story) {
    return (
      <main className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error || 'Story not found.'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Campus Radar
          </p>
          <h1 className="mt-2 text-3xl font-bold text-black">Edit Story</h1>
          <p className="mt-2 text-gray-600">Update this newsroom story.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-black">Story Details</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-900">Title</label>
                <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
              </div>

              <div>
                <label htmlFor="excerpt" className="mb-2 block text-sm font-medium text-gray-900">Excerpt</label>
                <textarea id="excerpt" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} required rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
              </div>

              <div>
                <label htmlFor="body" className="mb-2 block text-sm font-medium text-gray-900">Story Body</label>
                <textarea id="body" value={body} onChange={(event) => setBody(event.target.value)} required rows={14} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm leading-6 outline-none focus:border-black" />
              </div>

              <div>
                <label htmlFor="authorName" className="mb-2 block text-sm font-medium text-gray-900">Author Name</label>
                <input id="authorName" value={authorName} onChange={(event) => setAuthorName(event.target.value)} required className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">Cover Image</label>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

                {coverImage ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="aspect-video bg-gray-100">
                      <img src={coverImage} alt="Story cover preview" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-4">
                      <p className="text-sm text-gray-600">Cover image selected</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={openImagePicker} disabled={uploadingImage} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                          {uploadingImage ? 'Uploading...' : 'Upload Different'}
                        </button>
                        <button type="button" onClick={() => { void loadMedia(); setShowMediaLibrary(true); }} disabled={uploadingImage} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                          Choose from Library
                        </button>
                        <button type="button" onClick={removeCoverImage} disabled={uploadingImage} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div onDragOver={(event) => event.preventDefault()} onDrop={handleImageDrop} onClick={openImagePicker} className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center transition hover:border-gray-500 hover:bg-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {uploadingImage ? 'Optimizing and uploading...' : 'Drop an image here or click to upload'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Upload directly from your laptop or phone. Large images are optimized automatically.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button type="button" onClick={() => { void loadMedia(); setShowMediaLibrary(true); }} disabled={uploadingImage} className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                        Choose from Media Library
                      </button>
                      <button type="button" onClick={() => { const url = window.prompt('Enter image URL'); if (url) setCoverImage(url); }} disabled={uploadingImage} className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                        Use External URL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-black">Publishing</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="contentType" className="mb-2 block text-sm font-medium text-gray-900">Content Type</label>
                <select id="contentType" value={contentType} onChange={(event) => setContentType(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black">
                  <option value="NEWS">News</option>
                  <option value="THE_RADAR">The Radar</option>
                  <option value="FEATURE">Feature</option>
                  <option value="OPINION">Opinion</option>
                </select>
              </div>

              <div>
                <label htmlFor="origin" className="mb-2 block text-sm font-medium text-gray-900">Origin</label>
                <select id="origin" value={origin} onChange={(event) => setOrigin(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black">
                  <option value="EDITORIAL">Editorial</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="ORGANISATION">Organisation</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                  <option value="EXTERNAL">External</option>
                  <option value="ADVERTISER">Advertiser</option>
                </select>
              </div>

              <div>
                <label htmlFor="commercialStatus" className="mb-2 block text-sm font-medium text-gray-900">Commercial Status</label>
                <select id="commercialStatus" value={commercialStatus} onChange={(event) => setCommercialStatus(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black">
                  <option value="EDITORIAL">Editorial</option>
                  <option value="SPONSORED">Sponsored</option>
                  <option value="PROMOTED">Promoted</option>
                  <option value="ADVERTISEMENT">Advertisement</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-900">Status</label>
                <select id="status" value={status} onChange={(event) => setStatus(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black">
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <label className="mt-6 flex items-center gap-3 text-sm text-gray-900">
              <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} className="h-4 w-4" />
              Feature this story
            </label>
          </section>

          <div className="flex flex-wrap justify-between gap-3">
            <button type="button" onClick={handleDelete} disabled={saving || uploadingImage} className="rounded-lg border border-red-300 px-5 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">
              Delete Story
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => router.push('/admin/stories')} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving || uploadingImage} className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showMediaLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-black">Media Library</h2>
                <p className="mt-1 text-sm text-gray-500">Select an existing image.</p>
              </div>
              <button type="button" onClick={() => setShowMediaLibrary(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-black">
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {mediaLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">Loading media...</div>
              ) : media.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-sm text-gray-500">No media available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {media.map((item) => (
                    <button key={item.id} type="button" onClick={() => selectMedia(item.secureUrl)} className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:border-black hover:shadow-sm">
                      <div className="aspect-square bg-gray-100">
                        <img src={item.secureUrl} alt={item.originalName || 'Media image'} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-medium text-gray-900">{item.originalName || 'Untitled image'}</p>
                        {item.width && item.height && (
                          <p className="mt-1 text-xs text-gray-500">{item.width} × {item.height}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
