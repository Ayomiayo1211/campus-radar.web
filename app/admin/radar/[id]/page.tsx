
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

type RadarItem = {
  id: string;
  title: string;
  summary: string;
  kind: string;
  origin: string;
  commercialStatus: string;
  status: string;
  eventDate: string | null;
  location: string | null;
  link: string | null;
  coverImage: string | null;
};

type Media = {
  id: string;
  secureUrl: string;
  originalName: string | null;
  createdAt: string;
};

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black';

const labelClass =
  'mb-2 block text-sm font-medium text-gray-900';

export default function EditRadarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [kind, setKind] = useState('UPDATE');
  const [origin, setOrigin] = useState('EDITORIAL');
  const [commercialStatus, setCommercialStatus] =
    useState('EDITORIAL');
  const [status, setStatus] = useState('DRAFT');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');

  const [coverImage, setCoverImage] = useState('');
  const [media, setMedia] = useState<Media[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/radar/${id}?admin=true`);
        const text = await response.text();

        if (!response.ok) {
          throw new Error(
            `Failed to load Radar item (${response.status}): ${text.slice(0, 200)}`
          );
        }

        let result;

        try {
          result = JSON.parse(text);
        } catch {
          throw new Error(
            `Server returned non-JSON response: ${text.slice(0, 200)}`
          );
        }

        const item: RadarItem = result.data;

        setTitle(item.title);
        setSummary(item.summary);
        setKind(item.kind);
        setOrigin(item.origin);
        setCommercialStatus(item.commercialStatus);
        setStatus(item.status);
        setLocation(item.location ?? '');
        setLink(item.link ?? '');
        setCoverImage(item.coverImage ?? '');

        if (item.eventDate) {
          const date = new Date(item.eventDate);
          const localDate = new Date(
            date.getTime() - date.getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16);

          setEventDate(localDate);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Something went wrong'
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadItem();
    }
  }, [id]);

  async function loadMedia() {
    try {
      setLoadingMedia(true);

      const response = await fetch('/api/media');
      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `Failed to load Media Library (${response.status}): ${text.slice(0, 200)}`
        );
      }

      const result = JSON.parse(text);
      setMedia(result.data ?? []);
      setShowMediaLibrary(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load Media Library'
      );
    } finally {
      setLoadingMedia(false);
    }
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      let fileToUpload = file;

      if (file.size > 8 * 1024 * 1024) {
        fileToUpload = await imageCompression(file, {
          maxSizeMB: 8,
          maxWidthOrHeight: 4572,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: 0.9,
        });
      }

      if (fileToUpload.size > 10 * 1024 * 1024) {
        throw new Error(
          'The image is still too large after compression. Please choose a smaller image.'
        );
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `Image upload failed (${response.status}): ${text.slice(0, 200)}`
        );
      }

      const result = JSON.parse(text);
      const uploadedMedia: Media = result.data;

      if (!uploadedMedia?.secureUrl) {
        throw new Error('The upload succeeded but no image URL was returned.');
      }

      setCoverImage(uploadedMedia.secureUrl);

      setMedia((current) => [
        uploadedMedia,
        ...current.filter((item) => item.id !== uploadedMedia.id),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Image upload failed'
      );
    } finally {
      setUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadImage(file);
    }
  }

  function openImagePicker() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void uploadImage(file);
    }
  }

  function selectMedia(item: Media) {
    setCoverImage(item.secureUrl);
    setShowMediaLibrary(false);
    setError('');
  }

  function useExternalImageUrl() {
    const value = window.prompt('Enter the full URL of the image:');

    if (value === null) return;

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError('Please enter an image URL.');
      return;
    }

    try {
      const url = new URL(trimmedValue);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }

      setCoverImage(url.toString());
      setError('');
    } catch {
      setError('Please enter a valid image URL beginning with https:// or http://');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/radar/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          summary,
          kind,
          origin,
          commercialStatus,
          status,
          eventDate: eventDate || undefined,
          location: location || undefined,
          link: link || undefined,
          coverImage: coverImage || undefined,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `Failed to update Radar item (${response.status}): ${text.slice(0, 200)}`
        );
      }

      router.push('/admin/radar');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this Radar item? This cannot be undone.'
    );

    if (!confirmed) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/radar/${id}`, {
        method: 'DELETE',
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `Failed to delete Radar item (${response.status}): ${text.slice(0, 200)}`
        );
      }

      router.push('/admin/radar');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-gray-500">Loading Radar item...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Campus Radar
          </p>

          <h1 className="mt-2 text-3xl font-bold text-black">
            Edit Radar Item
          </h1>

          <p className="mt-2 text-gray-600">
            Update the campus information before publishing.
          </p>
        </div>

        {error && (
          <div className="mb-6 whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-5 text-lg font-semibold text-black">
              Radar Information
            </h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="title" className={labelClass}>
                  Title
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="summary" className={labelClass}>
                  Summary
                </label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  required
                  rows={5}
                  className={`${inputClass} leading-6`}
                />
              </div>

              <div>
                <label htmlFor="kind" className={labelClass}>
                  Type
                </label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className={`${inputClass} bg-white`}
                >
                  <option value="UPDATE">Update</option>
                  <option value="EVENT">Event</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="CAMPUS_LIFE">Campus Life</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-2 text-lg font-semibold text-black">
              Cover Image
            </h2>

            <p className="mb-5 text-sm leading-6 text-gray-600">
              Add an image to accompany this Radar item. You can upload
              one from your device, choose an existing image, or use an
              external image URL.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {coverImage ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <img
                    src={coverImage}
                    alt="Radar cover preview"
                    className="max-h-96 w-full object-contain"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openImagePicker}
                    disabled={uploadingImage}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Different Image'}
                  </button>

                  <button
                    type="button"
                    onClick={loadMedia}
                    disabled={loadingMedia || uploadingImage}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loadingMedia ? 'Loading Library...' : 'Choose from Library'}
                  </button>

                  <button
                    type="button"
                    onClick={useExternalImageUrl}
                    disabled={uploadingImage}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    Use External URL
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    disabled={uploadingImage}
                    className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed p-8 text-center transition ${
                  dragging
                    ? 'border-black bg-gray-100'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <p className="font-medium text-gray-900">
                  {uploadingImage
                    ? 'Uploading image...'
                    : 'Drop an image here'}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  Or choose an image from your device.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={openImagePicker}
                    disabled={uploadingImage}
                    className="rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </button>

                  <button
                    type="button"
                    onClick={loadMedia}
                    disabled={loadingMedia || uploadingImage}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-white disabled:opacity-50"
                  >
                    {loadingMedia ? 'Loading Library...' : 'Choose from Library'}
                  </button>

                  <button
                    type="button"
                    onClick={useExternalImageUrl}
                    disabled={uploadingImage}
                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-white disabled:opacity-50"
                  >
                    Use External URL
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-5 text-lg font-semibold text-black">
              Event Details
            </h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="eventDate" className={labelClass}>
                  Date and Time
                </label>
                <input
                  id="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="location" className={labelClass}>
                  Location
                </label>
                <input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="link" className={labelClass}>
                  External Link
                </label>
                <input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-5 text-lg font-semibold text-black">
              Publishing
            </h2>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="origin" className={labelClass}>
                  Origin
                </label>
                <select
                  id="origin"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  className={`${inputClass} bg-white`}
                >
                  <option value="EDITORIAL">Editorial</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="ORGANISATION">Organisation</option>
                  <option value="EXTERNAL">External</option>
                  <option value="ADVERTISER">Advertiser</option>
                </select>
              </div>

              <div>
                <label htmlFor="commercialStatus" className={labelClass}>
                  Commercial Status
                </label>
                <select
                  id="commercialStatus"
                  value={commercialStatus}
                  onChange={(event) =>
                    setCommercialStatus(event.target.value)
                  }
                  className={`${inputClass} bg-white`}
                >
                  <option value="EDITORIAL">Editorial</option>
                  <option value="SPONSORED">Sponsored</option>
                  <option value="PROMOTED">Promoted</option>
                  <option value="ADVERTISEMENT">Advertisement</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={`${inputClass} bg-white`}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || saving || uploadingImage}
              className="rounded-lg border border-red-300 px-5 py-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/radar')}
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || deleting || uploadingImage}
                className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {showMediaLibrary && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowMediaLibrary(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="media-library-title"
              className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2
                    id="media-library-title"
                    className="text-xl font-bold text-black"
                  >
                    Media Library
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Select an image to use for this Radar item.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMediaLibrary(false)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              {media.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
                  <p className="text-sm text-gray-600">
                    No images found in the Media Library.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaLibrary(false);
                      openImagePicker();
                    }}
                    className="mt-4 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Upload an Image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {media.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => selectMedia(item)}
                      className="overflow-hidden rounded-xl border border-gray-200 text-left transition hover:border-black"
                    >
                      <img
                        src={item.secureUrl}
                        alt={item.originalName ?? 'Media image'}
                        className="h-32 w-full bg-gray-100 object-cover"
                      />
                      <span className="block truncate p-3 text-xs text-gray-700">
                        {item.originalName ?? 'Untitled image'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
