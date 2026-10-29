import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

const API_BASE_URL =
  'https://campus-radar-data-api.campusradarfunaab.workers.dev';

type ArticleImage = {
  id: string;
  url: string;
  altText: string | null;
  caption: string | null;
  photographer: string | null;
  displayOrder?: number;
};

type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  authorName: string | null;
  publishedAt: string | null;
  coverImage: string | null;
  contentType: string;
  images: ArticleImage[];
  tags: string[];
};

async function getStory(slug: string): Promise<Story | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/stories/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );

    if (response.status === 404) return null;

    if (!response.ok) {
      console.error(`Campus Radar API returned ${response.status} for article`);
      return null;
    }

    const data = (await response.json()) as { story?: Story };
    return data.story ?? null;
  } catch (error) {
    console.error('Unable to fetch article from Campus Radar API', error);
    return null;
  }
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const story = await getStory(slug);

  if (!story) notFound();

  const images = Array.isArray(story.images) ? story.images : [];

  return (
    <>
      <Header />

      <main className="container min-h-screen max-w-4xl py-8">
        <Link
          href="/news"
          className="text-sm font-bold text-[#173B87] hover:underline"
        >
          &larr; Back to Latest News
        </Link>

        <article className="mt-6">
          <p className="kicker mb-3 text-[var(--muted)]">
            {story.contentType.replaceAll('_', ' ')}
          </p>

          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
            {story.title}
          </h1>

          {story.excerpt && (
            <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
              {story.excerpt}
            </p>
          )}

          <div className="my-6 border-y border-[var(--line)] py-3 text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {story.authorName || 'Campus Radar'}
            </span>
            {story.publishedAt && (
              <span>{' · '}{formatDate(story.publishedAt)}</span>
            )}
          </div>

          {story.coverImage && (
            <figure className="mb-8">
              <img
                src={story.coverImage}
                alt={story.title}
                className="max-h-[480px] w-full rounded-xl object-cover"
              />
            </figure>
          )}

          <div className="whitespace-pre-wrap text-base leading-8 text-[var(--ink)]">
            {story.body}
          </div>

          {images.length > 0 && (
            <div className="mt-8 space-y-8">
              {images.map((image) => (
                <figure key={image.id}>
                  <img
                    src={image.url}
                    alt={image.altText || image.caption || story.title}
                    loading="lazy"
                    className="h-auto max-h-[700px] w-full rounded-xl object-contain"
                  />
                  {(image.caption || image.photographer) && (
                    <figcaption className="mt-2 space-y-1 text-sm leading-6 text-[var(--muted)]">
                      {image.caption && <p>{image.caption}</p>}
                      {image.photographer && (
                        <p className="text-xs">Photo credit: {image.photographer}</p>
                      )}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {Array.isArray(story.tags) && story.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {story.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
