const API_BASE_URL =
  'https://campus-radar-data-api.campusradarfunaab.workers.dev';

async function requestPublicApi<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Campus Radar API returned ${response.status} for ${path}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Unable to fetch ${path} from Campus Radar API`, error);
    return null;
  }
}

export type PublicStory = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body?: string | null;
  contentType: string;
  authorName: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  tags?: string[];
  images?: {
    id: string;
    url: string;
    altText: string | null;
    caption: string | null;
    photographer: string | null;
    displayOrder?: number;
  }[];
};

export async function getPublicStories(limit = 25): Promise<PublicStory[]> {
  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)));
  const data = await requestPublicApi<{ stories?: PublicStory[] }>(
    `/stories?limit=${safeLimit}`,
  );

  return Array.isArray(data?.stories) ? data.stories : [];
}

export async function getPublicStory(slug: string): Promise<PublicStory | null> {
  const data = await requestPublicApi<{ story?: PublicStory }>(
    `/stories/${encodeURIComponent(slug)}`,
  );

  return data?.story ?? null;
}

export function formatPublicDate(value: string | null, month: 'short' | 'long' = 'short') {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month,
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
}
