'use client';

import { useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';

type Media = {
  id: string;
  secureUrl: string;
  originalName: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
};

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadMedia() {
    try {
      const response = await fetch('/api/media');
      const result = (await response.json()) as { error?: string; message?: string; data?: unknown };

      if (!response.ok) {
        throw new Error(
          result.error || 'Failed to load media'
        );
      }

      setMedia(result.data as Media[]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load media'
      );
    }
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function uploadFile(file: File) {
    setError('');
    setUploading(true);

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

      formData.append(
        'file',
        uploadFile,
        uploadFile.name
      );

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as {
        error?: string;
        message?: string;
        data?: Media;
      };

      if (!response.ok) {
        throw new Error(
          result.error || 'Upload failed'
        );
      }

      if (!result.data) throw new Error('Upload completed without returning media details');
      setMedia((current) => [result.data!, ...current]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Upload failed'
      );
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (file) {
      uploadFile(file);
    }

    event.target.value = '';
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file) {
      uploadFile(file);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          Media Library
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Upload and manage images used across Campus Radar.
        </p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="mb-10 cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center transition hover:border-gray-500 hover:bg-gray-100"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="text-sm font-medium">
          {uploading
            ? 'Optimizing and uploading...'
            : 'Drop an image here or click to upload'}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Images up to 20MB. Larger images are optimized automatically.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {media.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          No media uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="aspect-square bg-gray-100">
                <img
                  src={item.secureUrl}
                  alt={
                    item.originalName ||
                    'Uploaded image'
                  }
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-3">
                <p className="truncate text-xs font-medium">
                  {item.originalName ||
                    'Untitled image'}
                </p>

                {item.width && item.height && (
                  <p className="mt-1 text-xs text-gray-500">
                    {item.width} × {item.height}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}