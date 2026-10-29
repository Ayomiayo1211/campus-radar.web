
'use client';

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

type Media = {
  id: string;
  secureUrl: string;
  originalName: string | null;
  createdAt: string;
};

export default function NewRadarPage() {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function openImagePicker() {
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
      imageInputRef.current.click();
    }
  }

  async function uploadCoverImage(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      let imageToUpload = file;

      if (file.size > 8 * 1024 * 1024) {
        imageToUpload = await imageCompression(file, {
          maxSizeMB: 8,
          maxWidthOrHeight: 4572,
          useWebWorker: true,
          fileType: 'image/jpeg',
          initialQuality: 0.9,
        });
      }

      const formData = new FormData();
      formData.append('file', imageToUpload, imageToUpload.name);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as {
        error?: string;
        data: Media;
      };

      if (!response.ok) {
        throw new Error(result.error || 'Image upload failed.');
      }

      setCoverImage(result.data.secureUrl);

      setMedia((current) => [
        result.data,
        ...current.filter((item) => item.id !== result.data.id),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Image upload failed.'
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (file) {
      await uploadCoverImage(file);
    }

    event.target.value = '';
  }

  async function handleImageDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      await uploadCoverImage(file);
    }
  }

  async function loadMedia() {
    setLoadingMedia(true);

    try {
      const response = await fetch('/api/media');

      if (!response.ok) {
        throw new Error('Unable to load the Media Library.');
      }

      const result = (await response.json()) as { data?: Media[] };
      setMedia(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load the Media Library.'
      );
    } finally {
      setLoadingMedia(false);
    }
  }

  function openMediaLibrary() {
    setShowMediaLibrary(true);
    loadMedia();
  }

  function selectMedia(item: Media) {
    setCoverImage(item.secureUrl);
    setShowMediaLibrary(false);
    setError('');
  }

  function useExternalUrl() {
    const url = window.prompt('Enter the image URL:', coverImage);

    if (url === null) return;

    if (url.trim()) {
      try {
        const parsedUrl = new URL(url.trim());

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error();
        }

        setCoverImage(parsedUrl.toString());
        setError('');
      } catch {
        setError('Enter a valid HTTP or HTTPS image URL.');
      }
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/radar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          summary,
          coverImage: coverImage || undefined,
          kind,
          origin,
          commercialStatus,
          status,
          eventDate: eventDate || undefined,
          location: location || undefined,
          link: link || undefined,
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        let message = text;

        try {
          const result = JSON.parse(text);
          message = result.error || text;
        } catch {
          // Keep the server response for debugging.
        }

        throw new Error(
          `Failed to create Radar item (${response.status}): ${message.slice(0, 500)}`
        );
      }

      router.push('/admin/radar');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black';

  const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black';

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Campus Radar
          </p>
          <h1 className="mt-2 text-3xl font-bold text-black">
            New Radar Item
          </h1>
          <p className="mt-2 text-gray-600">
            Add a campus update, event or announcement.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-900">
                  Title
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  placeholder="e.g. FUNAAB releases examination timetable"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="summary" className="mb-2 block text-sm font-medium text-gray-900">
                  Summary
                </label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  required
                  rows={5}
                  placeholder="Give students the essential information."
                  className={`${inputClass} leading-6`}
                />
              </div>

              <div>
                <label htmlFor="kind" className="mb-2 block text-sm font-medium text-gray-900">
                  Type
                </label>
                <select
                  id="kind"
                  value={kind}
                  onChange={(event) => setKind(event.target.value)}
                  className={selectClass}
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
            <p className="mb-5 text-sm text-gray-500">
              Optional. Upload an image from your device, choose an existing image, or use an external URL.
            </p>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {coverImage ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <img
                    src={coverImage}
                    alt="Radar cover preview"
                    className="max-h-80 w-full bg-gray-50 object-contain"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openImagePicker}
                    disabled={uploadingImage}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Upload Different
                  </button>
                  <button
                    type="button"
                    onClick={openMediaLibrary}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                  >
                    Choose from Library
                  </button>
                  <button
                    type="button"
                    onClick={useExternalUrl}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                  >
                    Use External URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleImageDrop}
                className={`rounded-xl border-2 border-dashed p-8 text-center ${
                  dragging
                    ? 'border-black bg-gray-100'
                    : 'border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">
                  {dragging ? 'Drop image here' : 'Drag and drop an image'}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Or select an image from your device.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={openImagePicker}
                    disabled={uploadingImage}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <button
                    type="button"
                    onClick={openMediaLibrary}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                  >
                    Choose from Library
                  </button>
                  <button
                    type="button"
                    onClick={useExternalUrl}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                  >
                    Use External URL
                  </button>
                </div>
              </div>
            )}

            {uploadingImage && (
              <p className="mt-3 text-sm text-gray-500">
                Compressing and uploading image. Please wait...
              </p>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="mb-5 text-lg font-semibold text-black">
              Event Details
            </h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="eventDate" className="mb-2 block text-sm font-medium text-gray-900">
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
                <label htmlFor="location" className="mb-2 block text-sm font-medium text-gray-900">
                  Location
                </label>
                <input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. FUNAAB Ceremonial Building"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="link" className="mb-2 block text-sm font-medium text-gray-900">
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
                <label htmlFor="origin" className="mb-2 block text-sm font-medium text-gray-900">
                  Origin
                </label>
                <select
                  id="origin"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  className={selectClass}
                >
                  <option value="EDITORIAL">Editorial</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="ORGANISATION">Organisation</option>
                  <option value="EXTERNAL">External</option>
                  <option value="ADVERTISER">Advertiser</option>
                </select>
              </div>

              <div>
                <label htmlFor="commercialStatus" className="mb-2 block text-sm font-medium text-gray-900">
                  Commercial Status
                </label>
                <select
                  id="commercialStatus"
                  value={commercialStatus}
                  onChange={(event) => setCommercialStatus(event.target.value)}
                  className={selectClass}
                >
                  <option value="EDITORIAL">Editorial</option>
                  <option value="SPONSORED">Sponsored</option>
                  <option value="PROMOTED">Promoted</option>
                  <option value="ADVERTISEMENT">Advertisement</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium text-gray-900">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={selectClass}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/radar')}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Create Radar Item'}
            </button>
          </div>
        </form>
      </div>

      {showMediaLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-black">
                  Media Library
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select an image to use for this Radar item.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaLibrary(false)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            {loadingMedia ? (
              <p className="py-10 text-center text-gray-500">
                Loading images...
              </p>
            ) : media.length === 0 ? (
              <p className="py-10 text-center text-gray-500">
                No images in the library yet. Upload one from your device.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {media.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectMedia(item)}
                    className="overflow-hidden rounded-lg border border-gray-200 text-left hover:border-black"
                  >
                    <img
                      src={item.secureUrl}
                      alt={item.originalName || 'Media image'}
                      className="h-32 w-full bg-gray-50 object-cover"
                    />
                    <p className="truncate p-2 text-xs text-gray-600">
                      {item.originalName || 'Uploaded image'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
