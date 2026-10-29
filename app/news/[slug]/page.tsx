import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { formatPublicDate, getPublicStory } from '@/lib/public-content';

export const dynamic = 'force-dynamic';

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const story = await getPublicStory(slug);

  if (!story || !story.publishedAt) notFound();

  const images = [...(story.images ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
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

          {story.excerpt && (
            <p className="mt-4 text-lg leading-7 text-[var(--muted)]">
              {story.excerpt}
            </p>
          )}

          <div className="my-6 border-y border-[var(--line)] py-3 text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">
              {story.authorName || 'Campus Radar'}
            </span>
            {' · '}
            {formatPublicDate(story.publishedAt, 'long')}
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
                        <p className="text-xs">
                          Photo credit: {image.photographer}
                        </p>
                      )}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
