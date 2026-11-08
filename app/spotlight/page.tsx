import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleShare } from '@/components/ArticleShare';
import { ArticleEngagement } from '@/components/ArticleEngagement';
export const dynamic='force-dynamic';
export default async function SpotlightPublicPage(){
 const {data}=await (getSupabaseAdmin() as any).from('spotlights').select('id,title,excerpt,body,image_url,author_name,published_at').eq('status','PUBLISHED').eq('is_current',true).maybeSingle();
 return <><Header/><main className="container min-h-screen max-w-4xl py-8">
 <Link href="/news" className="spotlight-back text-sm font-bold hover:underline">← Back to Latest News</Link>
 {!data?<div className="py-20"><p className="spotlight-page-muted text-xs font-bold uppercase tracking-widest">Campus Radar</p><h1 className="mt-3 text-3xl font-bold">Nothing on our radar just yet.</h1></div>:
 <article className="spotlight-content mt-8"><p className="spotlight-page-eyebrow text-xs font-bold uppercase tracking-widest">Campus Radar presents</p><h1 className="spotlight-page-heading mt-2 text-4xl font-black">SPOTLIGHT.</h1>
 {data.image_url&&<img src={data.image_url} alt={data.title} className="mt-8 max-h-[520px] w-full rounded-2xl object-cover"/>}
 <h2 className="mt-8 text-3xl font-bold text-[var(--ink)]">{data.title}</h2><p className="mt-3 text-lg leading-8 text-[var(--muted)]">{data.excerpt}</p>
 <div className="my-6 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--line)] py-4"><p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Featuring {data.author_name}</p><ArticleShare title={data.title} excerpt={data.excerpt||''} shortCode="" sharePath={data ? `/spotlight/${data.id}` : undefined}/></div>
 <article className="prose prose-lg mt-8 max-w-none whitespace-pre-wrap text-[var(--ink)]">{data.body}</article>
 <div className="mt-10 border-t border-[var(--line)] pt-6"><ArticleShare title={data.title} excerpt={data.excerpt||''} shortCode="" sharePath={data ? `/spotlight/${data.id}` : undefined}/></div>
 <ArticleEngagement spotlightId={data.id}/>
 </article>}
 </main><Footer/></>;
}
