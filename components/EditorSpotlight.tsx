'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
type Spotlight={id:string;title:string;excerpt:string;body:string;imageUrl:string|null;authorName:string};
export function EditorialSpotlight(){
 const [item,setItem]=useState<Spotlight|null>(null),[visible,setVisible]=useState(false);
 useEffect(()=>{
  if(window.location.pathname.startsWith('/admin'))return;
  let cancelled=false;
  const timer=window.setTimeout(()=>{if(!cancelled)setVisible(true);},20000);
  fetch('/api/spotlight',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{if(cancelled||!j?.data)return;const value=j.data as Spotlight;const key='campus-radar-spotlight-dismissed-'+value.id;if(sessionStorage.getItem(key)==='true')return;setItem(value);}).catch(e=>console.error('Spotlight load failed',e));
  return()=>{cancelled=true;window.clearTimeout(timer);};
 },[]);
 function dismiss(){if(item)sessionStorage.setItem('campus-radar-spotlight-dismissed-'+item.id,'true');setVisible(false);}
 useEffect(()=>{if(!visible)return;const key=(e:KeyboardEvent)=>{if(e.key==='Escape')dismiss();};document.addEventListener('keydown',key);document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',key);document.body.style.overflow='';};},[visible,item]);
 if(!visible||!item)return null;
 return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050914]/80 p-3 backdrop-blur-sm sm:p-6" onClick={dismiss}>
  <section role="dialog" aria-modal="true" aria-labelledby="spotlight-title" className="relative grid max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl md:grid-cols-[1.05fr_.95fr]" onClick={e=>e.stopPropagation()}>
   <button type="button" onClick={dismiss} aria-label="Close Spotlight" className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-2xl text-white">×</button>
   <div className="relative min-h-[250px] bg-[#111827] md:min-h-[470px]">{item.imageUrl?<img src={item.imageUrl} alt={item.title} className="absolute inset-0 h-full w-full object-cover"/>:<div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_50%,#294a9a,#111827_70%)]"><span className="text-5xl font-black tracking-widest text-white/90">RADAR</span></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10"/><p className="absolute bottom-5 left-5 text-xs font-bold uppercase tracking-[.24em] text-white">Campus Radar / Spotlight</p></div>
   <div className="flex flex-col justify-center p-6 sm:p-8"><p className="text-[10px] font-black uppercase tracking-[.24em] text-[#B52E35]">Campus Radar presents</p><h2 id="spotlight-title" className="mt-2 text-3xl font-black tracking-tight text-[#173B87] sm:text-4xl">SPOTLIGHT<span className="text-[#B52E35]">.</span></h2><p className="mt-3 text-xs font-bold uppercase tracking-[.16em] text-gray-500">Something is on our radar</p><h3 className="mt-7 text-2xl font-extrabold leading-snug text-gray-950">{item.title}</h3><p className="mt-3 text-sm leading-6 text-gray-600">{item.excerpt}</p><p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">Featuring {item.authorName}</p><div className="mt-7 flex gap-3"><button type="button" onClick={dismiss} className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700">Close</button><Link href="/spotlight" onClick={dismiss} className="flex-1 rounded-lg bg-[#173B87] px-5 py-3 text-center text-sm font-bold text-white hover:bg-[#244FAE]">Explore Spotlight →</Link></div></div>
  </section></div>;
}
