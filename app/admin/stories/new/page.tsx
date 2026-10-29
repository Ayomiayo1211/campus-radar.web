
'use client';

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';

type Media = {
  id: string;
  secureUrl: string;
  originalName: string | null;
  width: number | null;
  height: number | null;
};

type GalleryImage = {
  key: string;
  mediaId?: string;
  url: string;
  altText: string;
  caption: string;
  photographer: string;
};

const MAX_GALLERY_IMAGES = 30;

export default function NewStoryPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [contentType, setContentType] = useState('NEWS');
  const [origin, setOrigin] = useState('EDITORIAL');
  const [commercialStatus, setCommercialStatus] =
    useState('EDITORIAL');
  const [status, setStatus] = useState('DRAFT');
  const [featured, setFeatured] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const [media, setMedia] = useState<Media[]>([]);
  const [showMediaLibrary, setShowMediaLibrary] =
    useState(false);
  const [mediaPurpose, setMediaPurpose] =
    useState<'cover' | 'gallery'>('cover');

  const [galleryImages, setGalleryImages] =
    useState<GalleryImage[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);
  const [uploadingGallery, setUploadingGallery] =
    useState(false);
  const [mediaLoading, setMediaLoading] =
    useState(false);
  const [error, setError] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function loadMedia() {
    setMediaLoading(true);

    try {
      const response = await fetch('/api/media');
      const result = (await response.json()) as {
        error?: string;
        data: Media[];
      };

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load media');
      }

      setMedia(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load media'
      );
    } finally {
      setMediaLoading(false);
    }
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function prepareImage(file: File) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    if (file.size > 8 * 1024 * 1024) {
      return imageCompression(file, {
        maxSizeMB: 8,
        maxWidthOrHeight: 4572,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.9,
      });
    }

    return file;
  }

  async function uploadToMediaLibrary(file: File) {
    const uploadFile = await prepareImage(file);
    const formData = new FormData();

    formData.append('file', uploadFile, uploadFile.name);

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    const result = (await response.json()) as {
      error?: string;
      data: Media;
    };

    if (!response.ok) {
      throw new Error(result.error || 'Image upload failed');
    }

    const uploaded = result.data as Media;

    setMedia((current) => [
      uploaded,
      ...current.filter((item) => item.id !== uploaded.id),
    ]);

    return uploaded;
  }

  async function uploadCoverImage(file: File) {
    setError('');
    setUploadingImage(true);

    try {
      const uploaded = await uploadToMediaLibrary(file);
      setCoverImage(uploaded.secureUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Image upload failed'
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void uploadCoverImage(file);
    }

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

  function openMediaLibrary(purpose: 'cover' | 'gallery') {
    setMediaPurpose(purpose);
    setShowMediaLibrary(true);
  }

  function selectMedia(item: Media) {
    if (mediaPurpose === 'cover') {
      setCoverImage(item.secureUrl);
    } else {
      addGalleryImage(item.secureUrl, item.id);
    }

    setShowMediaLibrary(false);
  }

  function removeCoverImage() {
    setCoverImage('');
  }

  function addGalleryImage(url: string, mediaId?: string) {
    setGalleryImages((current) => {
      if (current.length >= MAX_GALLERY_IMAGES) {
        setError(`A story can have at most ${MAX_GALLERY_IMAGES} gallery images.`);
        return current;
      }

      if (current.some((image) => image.url === url)) {
        setError('That image is already in this gallery.');
        return current;
      }

      setError('');

      return [
        ...current,
        {
          key: `${Date.now()}-${Math.random()}`,
          mediaId,
          url,
          altText: '',
          caption: '',
          photographer: '',
        },
      ];
    });
  }

  function updateGalleryImage(
    key: string,
    field: 'altText' | 'caption' | 'photographer',
    value: string
  ) {
    setGalleryImages((current) =>
      current.map((image) =>
        image.key === key ? { ...image, [field]: value } : image
      )
    );
  }

  function removeGalleryImage(key: string) {
    setGalleryImages((current) =>
      current.filter((image) => image.key !== key)
    );
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    setGalleryImages((current) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const reordered = [...current];
      [reordered[index], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[index],
      ];

      return reordered;
    });
  }

  async function handleGalleryFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!files.length) return;

    const remaining = MAX_GALLERY_IMAGES - galleryImages.length;

    if (files.length > remaining) {
      setError(
        `You can add ${remaining} more image(s). The limit is ${MAX_GALLERY_IMAGES}.`
      );
    } else {
      setError('');
    }

    const selectedFiles = files.slice(0, Math.max(remaining, 0));

    if (!selectedFiles.length) return;

    setUploadingGallery(true);

    let uploadedCount = 0;
    const failures: string[] = [];

    for (const file of selectedFiles) {
      try {
        const uploaded = await uploadToMediaLibrary(file);

        addGalleryImage(uploaded.secureUrl, uploaded.id);
        uploadedCount += 1;
      } catch (err) {
        failures.push(
          `${file.name}: ${
            err instanceof Error ? err.message : 'Upload failed'
          }`
        );
      }
    }

    if (failures.length) {
      setError(
        `Uploaded ${uploadedCount} image(s). ${failures.join(' | ')}`
      );
    }

    setUploadingGallery(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          coverImage: coverImage || undefined,
          galleryImages: galleryImages.map((image, index) => ({
            url: image.url,
            mediaId: image.mediaId,
            altText: image.altText || undefined,
            caption: image.caption || undefined,
            photographer: image.photographer || undefined,
            displayOrder: index,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message =
          result &&
          typeof result === 'object' &&
          'error' in result &&
          typeof result.error === 'string'
            ? result.error
            : 'Failed to create story';
        throw new Error(message);
      }

      router.push('/admin/stories');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || uploadingImage || uploadingGallery;

  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Campus Radar
          </p>
          <h1 className="mt-2 text-3xl font-bold text-black">
            New Story
          </h1>
          <p className="mt-2 text-gray-600">
            Create a new newsroom story.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-black">
              Story Details
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  placeholder="Enter story headline"
                />
              </div>

              <div>
                <label htmlFor="excerpt" className="mb-2 block text-sm font-medium text-gray-900">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(event) => setExcerpt(event.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  placeholder="Short summary of the story"
                />
              </div>

              <div>
                <label htmlFor="body" className="mb-2 block text-sm font-medium text-gray-900">
                  Story Body
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  required
                  rows={14}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm leading-6 outline-none focus:border-black"
                  placeholder="Write the full story..."
                />
              </div>

              <div>
                <label htmlFor="authorName" className="mb-2 block text-sm font-medium text-gray-900">
                  Author Name
                </label>
                <input
                  id="authorName"
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                  placeholder="Author name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Cover Image
                </label>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {coverImage ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <div className="aspect-video bg-gray-100">
                      <img
                        src={coverImage}
                        alt="Story cover preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-4">
                      <p className="text-sm text-gray-600">
                        Cover image selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={openImagePicker}
                          disabled={uploadingImage}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          {uploadingImage ? 'Uploading...' : 'Upload Different'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openMediaLibrary('cover')}
                          disabled={uploadingImage}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          Choose from Library
                        </button>
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          disabled={uploadingImage}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleImageDrop}
                      onClick={openImagePicker}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center transition hover:border-gray-500 hover:bg-gray-100"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {uploadingImage
                          ? 'Optimizing and uploading...'
                          : 'Drop an image here or click to upload'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Large images are optimized automatically.
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => openMediaLibrary('cover')}
                        className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                      >
                        Choose from Media Library
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = window.prompt('Enter image URL');
                          if (url) {
                            try {
                              const parsed = new URL(url);
                              if (!['https:', 'http:'].includes(parsed.protocol)) {
                                throw new Error();
                              }
                              setCoverImage(parsed.toString());
                            } catch {
                              setError('Enter a valid HTTP or HTTPS image URL.');
                            }
                          }
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                      >
                        Use External URL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-black">
                  Article Gallery
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Add photos that appear within or below the article. The cover image stays separate.
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                {galleryImages.length}/{MAX_GALLERY_IMAGES}
              </span>
            </div>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryFiles}
              className="hidden"
            />

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploadingGallery || galleryImages.length >= MAX_GALLERY_IMAGES}
                className="rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {uploadingGallery ? 'Uploading images...' : 'Upload Gallery Images'}
              </button>
              <button
                type="button"
                onClick={() => openMediaLibrary('gallery')}
                disabled={galleryImages.length >= MAX_GALLERY_IMAGES}
                className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Choose from Media Library
              </button>
            </div>

            {galleryImages.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <p className="text-sm font-medium text-gray-800">
                  No gallery images added
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Upload several photos or select existing media. You can add captions and credits after selecting them.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {galleryImages.map((image, index) => (
                  <div
                    key={image.key}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="mb-4 flex items-start gap-4">
                      <div className="h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-28 sm:w-40">
                        <img
                          src={image.url}
                          alt={image.altText || 'Gallery preview'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          Image {index + 1}
                        </p>
                        <p className="mt-1 break-all text-xs text-gray-500">
                          {image.url}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moveGalleryImage(index, -1)}
                            disabled={index === 0}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveGalleryImage(index, 1)}
                            disabled={index === galleryImages.length - 1}
                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(image.key)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-gray-900">
                          Image caption
                        </label>
                        <input
                          value={image.caption}
                          onChange={(event) =>
                            updateGalleryImage(image.key, 'caption', event.target.value)
                          }
                          maxLength={500}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                          placeholder="Caption displayed with the photo"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-900">
                          Photographer credit
                        </label>
                        <input
                          value={image.photographer}
                          onChange={(event) =>
                            updateGalleryImage(image.key, 'photographer', event.target.value)
                          }
                          maxLength={180}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                          placeholder="e.g. Photo: FUNAAB Bulletin"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-900">
                          Alt text
                        </label>
                        <input
                          value={image.altText}
                          onChange={(event) =>
                            updateGalleryImage(image.key, 'altText', event.target.value)
                          }
                          maxLength={300}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-black"
                          placeholder="Describe the image for accessibility"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-black">
              Publishing
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="contentType" className="mb-2 block text-sm font-medium text-gray-900">
                  Content Type
                </label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(event) => setContentType(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="NEWS">News</option>
                  <option value="THE_RADAR">The Radar</option>
                  <option value="FEATURE">Feature</option>
                  <option value="OPINION">Opinion</option>
                </select>
              </div>

              <div>
                <label htmlFor="origin" className="mb-2 block text-sm font-medium text-gray-900">
                  Origin
                </label>
                <select
                  id="origin"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="EDITORIAL">Editorial</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="ORGANISATION">Organisation</option>
                  <option value="CONFIDENTIAL">Confidential</option>
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <label className="mt-6 flex items-center gap-3 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
                className="h-4 w-4"
              />
              Feature this story
            </label>
          </section>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/stories')}
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating...' : uploadingGallery ? 'Uploading images...' : 'Create Story'}
            </button>
          </div>
        </form>
      </div>

      {showMediaLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-black">
                  Media Library
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {mediaPurpose === 'cover'
                    ? 'Select a cover image.'
                    : 'Select an image to add to the article gallery.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaLibrary(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-black"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {mediaLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  Loading media...
                </div>
              ) : media.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-sm text-gray-500">
                    No media available yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectMedia(item)}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left transition hover:border-black hover:shadow-sm"
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={item.secureUrl}
                          alt={item.originalName || 'Media image'}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="truncate text-xs font-medium text-gray-900">
                          {item.originalName || 'Untitled image'}
                        </p>
                        {item.width && item.height && (
                          <p className="mt-1 text-xs text-gray-500">
                            {item.width} × {item.height}
                          </p>
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
