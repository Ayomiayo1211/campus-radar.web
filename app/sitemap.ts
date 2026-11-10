import type { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.campusradarfunaab.com.ng';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseAdmin();

  const [storiesResult, radarResult, opportunitiesResult] = await Promise.all([
    supabase
      .from('stories')
      .select('slug,published_at')
      .eq('status', 'PUBLISHED')
      .not('published_at', 'is', null),
    supabase
      .from('radar_items')
      .select('slug,published_at')
      .eq('status', 'PUBLISHED'),
    supabase
      .from('opportunities')
      .select('slug')
      .eq('status', 'PUBLISHED'),
  ]);

  if (storiesResult.error) {
    console.error('Sitemap stories query failed:', storiesResult.error.message);
  }
  if (radarResult.error) {
    console.error('Sitemap Radar query failed:', radarResult.error.message);
  }
  if (opportunitiesResult.error) {
    console.error('Sitemap opportunities query failed:', opportunitiesResult.error.message);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/news`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/radar`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/opportunities`, changeFrequency: 'daily', priority: 0.8 },
  ];

  const storyRoutes: MetadataRoute.Sitemap = (storiesResult.data ?? []).map((story) => ({
    url: `${SITE_URL}/news/${story.slug}`,
    lastModified: story.published_at ? new Date(story.published_at) : undefined,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const radarRoutes: MetadataRoute.Sitemap = (radarResult.data ?? []).map((item) => ({
    url: `${SITE_URL}/radar/${item.slug}`,
    lastModified: item.published_at ? new Date(item.published_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const opportunityRoutes: MetadataRoute.Sitemap = (opportunitiesResult.data ?? []).map((item) => ({
    url: `${SITE_URL}/opportunities/${item.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...storyRoutes, ...radarRoutes, ...opportunityRoutes];
}
