import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleShare } from '@/components/ArticleShare';

export const dynamic = 'force-dynamic';

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

async function getPublishedStory(slug: string) {
  const { data, error } = await getSupabaseAdmin()
    .from('stories')
    .select('title,excerpt,body,author_name,published_at,cover_image,content_type,images:story_images(id,url,alt_text,caption,photographer,display_order)')
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
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    authorName: row.author_name,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    coverImage: row.cover_image,
    contentType: row.content_type,
    images: (row.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.alt_text,
      caption: image.caption,
      photographer: image.photographer,
      displayOrder: image.display_order,
    })).sort((a, b) => a.displayOrder - b.displayOrder),
  };

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
            <ArticleShare title={story.title} excerpt={story.excerpt || ''} />
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
            {story.body.split(/(\{\{gallery-image:[^}]+\}\})/g).map((part, index) => {
              const match = part.match(/^\{\{gallery-image:([^}]+)\}\}$/);
              if (!match) return <span key={index} className="whitespace-pre-wrap">{part}</span>;
              let imageUrl = '';
              try { imageUrl = decodeURIComponent(match[1]); } catch { return null; }
              const image = story.images.find((item) => item.url === imageUrl);
              if (!image) return null;
              return (
                <figure key={index} className="my-8">
                  <img
                    src={image.url}
                    alt={image.altText || image.caption || story.title}
                    loading="lazy"
                    className="h-auto max-h-[700px] w-full rounded-xl object-contain"
                  />
                  {(image.caption || image.photographer) && (
                    <figcaption className="mt-2 space-y-1 text-sm leading-6 text-[var(--muted)]">
                      {image.caption && <p>{image.caption}</p>}
                      {image.photographer && <p className="text-xs">Photo credit: {image.photographer}</p>}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>

          {story.images.length > 0 && (
            <div className="mt-8 space-y-8">
              {story.images.filter((image) => !story.body.includes(`{{gallery-image:${encodeURIComponent(image.url)}}}`)).map((image) => (
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
                      {image.photographer && <p className="text-xs">Photo credit: {image.photographer}</p>}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          <div className="mt-10 border-t border-[var(--line)] pt-6">
            <ArticleShare title={story.title} excerpt={story.excerpt || ''} />
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}
