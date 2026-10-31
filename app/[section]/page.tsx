import Link from 'next/link';
import {notFound} from 'next/navigation';
import {Header} from '@/components/Header';
import {Footer} from '@/components/Footer';
import {StoryCard} from '@/components/StoryCard';
import type {Story} from '@/lib/data';
import {getSupabaseAdmin} from '@/lib/server/supabase';

export const dynamic='force-dynamic';
const dateLabel=(value:string|null)=>value?new Date(value).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'}):'';
const editorialLabel=(value:string|null)=>value?value.charAt(0)+value.slice(1).toLowerCase():'Editorial';

export default async function Section({params}:{params:Promise<{section:string}>}){
 const {section}=await params;
 if(section==='news')notFound();
 if(section==='radar')return <RadarPage/>;
 if(section==='opportunities')return <OpportunitiesPage/>;
 if(section==='events')notFound();
 if(section!=='features'&&section!=='opinion')notFound();
 const contentType=section==='features'?'FEATURE':'OPINION';
 const title=section==='features'?'Features':'Opinion';
 const {data,error}=await getSupabaseAdmin().from('stories').select('id,slug,title,excerpt,author_name,published_at,content_type,origin,commercial_status,cover_image,featured').eq('status','PUBLISHED').eq('content_type',contentType).order('published_at',{ascending:false}).limit(50);
 if(error)console.error(`Could not load ${title} stories:`,error.message);
 const stories:(Story&{slug:string})[]=(data??[]).map(s=>({id:s.id,slug:s.slug,title:s.title,excerpt:s.excerpt,category:title as Story['category'],author:s.author_name,date:dateLabel(s.published_at),readTime:'',origin:editorialLabel(s.origin) as Story['origin'],commercialStatus:editorialLabel(s.commercial_status) as Story['commercialStatus'],image:s.cover_image??undefined,featured:s.featured}));
 return <Page title={title} kicker="Campus Radar">{stories.length?<div className="grid gap-5 md:grid-cols-2">{stories.map(s=><StoryCard key={s.id} story={s}/>)}</div>:<p className="py-8 text-sm text-[var(--muted)]">No {title.toLowerCase()} have been published yet. Check back soon.</p>}</Page>;
}

async function RadarPage(){
 const {data,error}=await getSupabaseAdmin().from('radar_items').select('id,title,summary,kind,origin,commercial_status,event_date,location,link,published_at').eq('status','PUBLISHED').order('published_at',{ascending:false}).limit(50);
 if(error)console.error('Could not load Radar items:',error.message);
 return <Page title="The Radar" kicker="What's happening"><div className="mb-8 max-w-2xl"><p className="text-lg leading-8 text-[var(--muted)]">The campus pulse: events, updates, announcements and useful things students should know. The Radar is information, not automatically editorial reporting.</p></div>{(data??[]).length?<div className="grid gap-4">{(data??[]).map(item=><Link href={item.link||'/radar'} key={item.id} target={item.link?'_blank':undefined} rel={item.link?'noopener noreferrer':undefined} className="card p-6 transition hover:border-black"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-3"><span className="kicker text-[var(--accent)]">{item.kind.replaceAll('_',' ')}</span><span className="kicker text-[var(--muted)]">{editorialLabel(item.commercial_status)}</span></div><span className="text-xs text-[var(--muted)]">{dateLabel(item.event_date||item.published_at)}</span></div><h2 className="mt-2 text-2xl font-black">{item.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{item.summary}</p>{item.location&&<p className="mt-3 text-xs text-[var(--muted)]">{item.location}</p>}</Link>)}</div>:<p className="py-8 text-sm text-[var(--muted)]">No Radar updates have been published yet.</p>}</Page>;
}

async function OpportunitiesPage(){
 const {data,error}=await getSupabaseAdmin().from('opportunities').select('id,title,organisation,type,description,deadline,application_url,commercial_status').eq('status','PUBLISHED').order('deadline',{ascending:true}).limit(50);
 if(error)console.error('Could not load opportunities:',error.message);
 return <Page title="Opportunities" kicker="Useful information">{(data??[]).length?<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{(data??[]).map(o=><div className="card p-6" key={o.id}><div className="flex items-center justify-between gap-3"><span className="kicker text-[var(--accent)]">{o.type.replaceAll('_',' ')}</span>{o.commercial_status!=='EDITORIAL'&&<span className="kicker text-[var(--muted)]">{editorialLabel(o.commercial_status)}</span>}</div><h2 className="mt-3 text-2xl font-black">{o.title}</h2><p className="mt-2 text-sm font-bold">{o.organisation}</p><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{o.description}</p><div className="mt-6 border-t border-[var(--line)] pt-4 text-xs font-bold">DEADLINE · {dateLabel(o.deadline)}</div>{o.application_url&&<a href={o.application_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-bold text-[#173B87] underline underline-offset-4">Apply / Learn more</a>}</div>)}</div>:<p className="py-8 text-sm text-[var(--muted)]">No opportunities have been published yet. Check back soon.</p>}</Page>;
}

function Page({title,kicker,children}:{title:string;kicker:string;children:React.ReactNode}){return <><Header/><main className="container min-h-[65vh] py-12"><div className="border-b border-black pb-6"><div className="kicker text-[var(--accent)]">{kicker}</div><h1 className="mt-1 text-5xl font-black tracking-tight md:text-6xl">{title}</h1></div><div className="mt-8">{children}</div></main><Footer/></>;}
