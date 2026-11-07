
import Link from 'next/link';
import type { Story } from '@/lib/data';

type StoryCardProps = {
  story: Story & { slug?: string };
  large?: boolean;
};

export function StoryCard({ story }: StoryCardProps) {
  const articleUrl = story.slug ? `/news/${story.slug}` : '/news';

  return (
    <article>
      <div className="card overflow-hidden transition hover:-translate-y-0.5 hover:border-black">
        <div className="aspect-square story-image overflow-hidden bg-white" aria-hidden="true">
          {story.image && (
            <img src={story.image} alt="" className="h-full w-full object-contain" loading="lazy" />
          )}
        </div>
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="kicker text-[var(--accent)]">{story.category}</span>
            {story.commercialStatus !== 'Editorial' && <span className="kicker text-[var(--muted)]">{story.commercialStatus}</span>}
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight md:text-2xl">
            <Link href={articleUrl}>{story.title}</Link>
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{story.excerpt}</p>
          <div className="mt-5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
            <span>{story.author}</span><span>·</span><span>{story.date}</span><span>·</span><span>{story.readTime}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
