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
      <Link
        href={articleUrl}
        aria-label={`Read story: ${story.title}`}
        className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:border-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--blue)] dark:hover:border-[#83A8FF]"
      >
        <div className="aspect-square story-image overflow-hidden bg-[var(--surface)]" aria-hidden="true">
          {story.image && (
            <img src={story.image} alt="" className="h-full w-full object-contain" loading="lazy" />
          )}
        </div>
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3">
            <span className="kicker text-[var(--accent)]">{story.category}</span>
            {story.commercialStatus !== 'Editorial' && <span className="kicker text-[var(--muted)]">{story.commercialStatus}</span>}
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight md:text-2xl transition-colors group-hover:text-[var(--blue)]">
            {story.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{story.excerpt}</p>
          <div className="mt-5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--muted)]">
            <span>{story.author}</span><span>·</span><span>{story.date}</span><span>·</span><span>{story.readTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
