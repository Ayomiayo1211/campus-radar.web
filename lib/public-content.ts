const API_BASE_URL = 'https://campus-radar-data-api.campusradarfunaab.workers.dev';

export type PublicStory = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  contentType: string;
  authorName: string | null;
  coverImage: string | null;
  publishedAt: string | null;
};

export type PublicRadarItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: string;
  coverImage: string | null;
  eventDate: string | null;
  location: string | null;
  link: string | null;
  publishedAt: string | null;
};

export type PublicOpportunity = {
  id: string;
  slug: string;
  title: string;
  organisation: string;
  type: string;
  description: string;
  deadline: string | null;
  applicationUrl: string | null;
  publishedAt: string | null;
};

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Campus Radar public API returned ${response.status} for ${path}`);
      return null;
    }
    return await response.json() as T;
  } catch (error) {
    console.error(`Campus Radar public API request failed for ${path}`, error);
    return null;
  }
}

export async function getPublicStories(type?: 'NEWS' | 'FEATURE' | 'OPINION', limit = 25) {
  const query = new URLSearchParams({ limit: String(Math.min(25, Math.max(1, limit))) });
  if (type) query.set('type', type);
  const result = await getJson<{ stories?: PublicStory[] }>(`/stories?${query}`);
  return Array.isArray(result?.stories) ? result.stories : [];
}

export async function getPublicRadar(limit = 25) {
  const result = await getJson<{ items?: PublicRadarItem[] }>(`/radar?limit=${Math.min(25, Math.max(1, limit))}`);
  return Array.isArray(result?.items) ? result.items : [];
}

export async function getPublicOpportunities(limit = 25) {
  const result = await getJson<{ opportunities?: PublicOpportunity[] }>(`/opportunities?limit=${Math.min(25, Math.max(1, limit))}`);
  return Array.isArray(result?.opportunities) ? result.opportunities : [];
}

export function formatPublicDate(value: string | null, month: 'short' | 'long' = 'short') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-NG', { day: 'numeric', month, year: 'numeric', timeZone: 'Africa/Lagos' });
}
