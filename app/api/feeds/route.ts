
import Parser from 'rss-parser';
import { NextResponse } from 'next/server';

export const revalidate = 900;

const parser = new Parser();

const FEEDS = [
  {
    name: 'Substack',
    url: 'https://campusradarfunaab.substack.com/feed',
  },
  {
    name: 'Blogger',
    url: 'https://www.blogger.com/feeds/6628075254087960583/posts/default?alt=rss',
  },
] as const;

type FeedSource = (typeof FEEDS)[number]['name'];

type FeedPost = {
  id: string;
  title: string;
  source: FeedSource;
  link: string;
  publishedAt: string | null;
  excerpt: string;
  image: string | null;
};

function getImage(item: Record<string, unknown>): string | null {
  const enclosure = item.enclosure as
    | { url?: string }
    | undefined;

  if (enclosure?.url && /^https?:\/\//i.test(enclosure.url)) {
    return enclosure.url;
  }

  const content = String(
    item.content ?? item['content:encoded'] ?? ''
  );

  const imageMatch = content.match(
    /<img\b[^>]*\bsrc=["']([^"']+)["']/i
  );

  if (imageMatch?.[1] && /^https?:\/\//i.test(imageMatch[1])) {
    return imageMatch[1];
  }

  return null;
}

function getExcerpt(item: Record<string, unknown>): string {
  const snippet = String(item.contentSnippet ?? '').trim();

  if (snippet) {
    return snippet.slice(0, 280);
  }

  const content = String(
    item.content ?? item['content:encoded'] ?? ''
  );

  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

async function fetchFeed(feed: (typeof FEEDS)[number]) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'CampusRadar/1.0 RSS Reader',
      },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Feed returned HTTP ${response.status}`);
    }

    const xml = await response.text();
    const parsed = await parser.parseString(xml);

    const posts = parsed.items
      .map((item): FeedPost | null => {
        const raw = item as unknown as Record<string, unknown>;
        const title = String(raw.title ?? '').trim();
        const link = String(raw.link ?? '').trim();

        if (!title || !/^https?:\/\//i.test(link)) {
          return null;
        }

        const dateValue = raw.isoDate ?? raw.pubDate;
        const date = dateValue ? new Date(String(dateValue)) : null;

        return {
          id: `${feed.name}:${link}`,
          title,
          source: feed.name,
          link,
          publishedAt:
            date && !Number.isNaN(date.getTime())
              ? date.toISOString()
              : null,
          excerpt: getExcerpt(raw),
          image: getImage(raw),
        };
      })
      .filter((post): post is FeedPost => post !== null);

    return {
      source: feed.name,
      posts,
      error: null,
    };
  } catch (error) {
    console.error(
      `[Campus Radar feeds] ${feed.name} failed:`,
      error
    );

    return {
      source: feed.name,
      posts: [] as FeedPost[],
      error: 'This source is temporarily unavailable.',
    };
  }
}

export async function GET() {
  const results = await Promise.all(FEEDS.map(fetchFeed));

  const posts = results
    .flatMap((result) => result.posts)
    .sort((a, b) => {
      if (!a.publishedAt) return 1;
      if (!b.publishedAt) return -1;

      return (
        new Date(b.publishedAt).getTime() -
        new Date(a.publishedAt).getTime()
      );
    });

  return NextResponse.json(
    {
      posts,
      sources: results.map(({ source, error }) => ({
        source,
        available: error === null,
        error,
      })),
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control':
          'public, s-maxage=900, stale-while-revalidate=3600',
      },
    }
  );
}
