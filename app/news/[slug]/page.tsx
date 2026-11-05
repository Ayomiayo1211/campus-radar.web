import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleShare } from '@/components/ArticleShare';
import { ArticleReadTracker } from '@/components/ArticleReadTracker';
import { ArticleEngagement } from '@/components/ArticleEngagement';

export const dynamic = 'force-dynamic';

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

async function getPublishedStory(slug: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('stories')
    .select('id,title,excerpt,body,author_name,published_at,cover_image,content_type,short_code,read_count,images:story_images(id,url,alt_text,caption,photographer,display_order)')
    .eq('slug', slug)
    .eq('status', 'PUBLISHED')
    .maybeSingle();

  if (error) console.error('Article query failed:', error.message);
  return data;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStory(slug);
  if (!story) return { title: 'Article not found | Campus Radar' };

  const title = story.title;
  const description = story.excerpt || `Read ${title} on Campus Radar.`;
  const canonical = `/news/${slug}`;
  const images = story.cover_image ? [{ url: story.cover_image, alt: title }] : [];

  return {
    title: `${title} | Campus Radar`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      siteName: 'Campus Radar',
      publishedTime: story.published_at || undefined,
      authors: story.author_name ? [story.author_name] : undefined,
      images,
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const row = await getPublishedStory(slug);

  if (!row) notFound();

  const story = {
    id: row.id,
    readCount: Number(row.read_count ?? 0),
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    authorName: row.author_name,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    coverImage: row.cover_image,
    contentType: row.content_type,
    shortCode: row.short_code,
    images: (row.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.alt_text,
      caption: image.caption,
      photographer: image.photographer,
      displayOrder: image.display_order,
    })).sort((a, b) => a.displayOrder - b.displayOrder),
  };
  const paragraphs = story.body.split(/\n\s*\n/);
  const manuallyPlacedUrls = new Set(Array.from(story.body.matchAll(/\{\{gallery-image:([^}]+)\}\}/g), (match) => {
    try { return decodeURIComponent(match[1]); } catch { return ''; }
  }));
  const automaticImages = story.images.filter((image) => !manuallyPlacedUrls.has(image.url));
  const automaticPlacement = new Map<number, typeof automaticImages>();
  automaticImages.forEach((image, index) => {
    if (!paragraphs.length) return;
    const position = Math.min(paragraphs.length - 1, Math.max(0, Math.round(((index + 1) * paragraphs.length) / (automaticImages.length + 1)) - 1));
    automaticPlacement.set(position, [...(automaticPlacement.get(position) ?? []), image]);
  });
  const renderGalleryImage = (image: (typeof story.images)[number], key: string) => (
    <figure key={key} className="my-8">
      <img src={image.url} alt={image.altText || image.caption || story.title} loading="lazy" className="h-auto max-h-[700px] w-full rounded-xl object-contain" />
      {(image.caption || image.photographer) && <figcaption className="mt-2 space-y-1 text-sm leading-6 text-[var(--muted)]">{image.caption && <p>{image.caption}</p>}{image.photographer && <p className="text-xs">Photo credit: {image.photographer}</p>}</figcaption>}
    </figure>
  );

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

          <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
            {story.excerpt}
          </p>

          <div className="my-6 space-y-4 border-y border-[var(--line)] py-3">
            <div className="text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--ink)]">
                {story.authorName}
              </span>

              {story.publishedAt && (
                <span>
                  {' · '}
                  {story.publishedAt.toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ArticleShare title={story.title} excerpt={story.excerpt || ''} shortCode={story.shortCode} />
              <span className="text-sm text-[var(--muted)]"><ArticleReadTracker storyId={story.id} initialCount={story.readCount} /></span>
            </div>
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

          <div className="text-base leading-8 text-[var(--ink)]">
            {paragraphs.map((paragraph, index) => {
              const marker = paragraph.trim().match(/^\{\{gallery-image:([^}]+)\}\}$/);
              let manuallyPlacedImage: (typeof story.images)[number] | undefined;
              if (marker) {
                try {
                  const imageUrl = decodeURIComponent(marker[1]);
                  manuallyPlacedImage = story.images.find((image) => image.url === imageUrl);
                } catch {
                  manuallyPlacedImage = undefined;
                }
              }
              return (
                <div key={index}>
                  {marker ? (manuallyPlacedImage ? renderGalleryImage(manuallyPlacedImage, "manual-" + index) : null) : <p className="whitespace-pre-wrap">{paragraph}</p>}
                  {(automaticPlacement.get(index) ?? []).map((image) => renderGalleryImage(image, "auto-" + image.id))}
                </div>
              );
            })}
          </div>
          <ArticleEngagement storyId={story.id} />
          <div className="mt-10 border-t border-[var(--line)] pt-6">
            <ArticleShare title={story.title} excerpt={story.excerpt || ''} shortCode={story.shortCode} />
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
