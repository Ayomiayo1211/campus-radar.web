'use client';
import {useEffect,useState} from 'react';
type Comment={id:string;display_name:string;body:string;created_at:string};
export function ArticleEngagement({storyId,spotlightId}:{storyId?:string;spotlightId?:string}){
 const destination:Record<string,string>=spotlightId?{spotlightId}:storyId?{storyId}:{};
 const destinationKey=spotlightId||storyId||'';
 const [items,setItems]=useState<Comment[]>([]),[name,setName]=useState(''),[email,setEmail]=useState(''),[body,setBody]=useState(''),[subscribe,setSubscribe]=useState(false),[loading,setLoading]=useState(false),[message,setMessage]=useState('');
 async function load(){const params=new URLSearchParams(destination);const r=await fetch(`/api/comments?${params.toString()}`);const d=await r.json() as any;if(r.ok)setItems(d.data||[])}
 useEffect(()=>{void load()},[destinationKey]);
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setMessage('');try{
  const r=await fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...destination,displayName:name,email,body,website:''})});const d=await r.json() as any;if(!r.ok)throw new Error(d.error||'Could not submit comment.');
  setItems(current=>[d.data,...current]);setBody('');setMessage('Your comment has been published.');
  if(subscribe){const sr=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,consent:true,source:spotlightId?'spotlight-comment':'article-comment'})});const sd=await sr.json() as any;setMessage(`Comment published. ${sr.ok?sd.message:sd.error}`)}
 }catch(err){setMessage(err instanceof Error?err.message:'Something went wrong.')}finally{setLoading(false)}}
 async function report(id:string){const reason=window.prompt('Why are you reporting this comment?');if(!reason)return;const r=await fetch('/api/comments/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({commentId:id,reason})});const d=await r.json() as any;setMessage(d.message||d.error||'Report submitted.')}
 return <section className="mt-12 border-t border-[var(--line)] pt-8" id="comments">
  <h2 className="text-2xl font-bold">Join the conversation <span className="text-base font-normal text-[var(--muted)]">({items.length})</span></h2>
  <p className="mt-2 text-sm text-[var(--muted)]">Keep the discussion respectful. Comments may be reviewed by the editorial team.</p>
  <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-[var(--line)] p-5">
   <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Display name<input required minLength={2} maxLength={60} value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2" /></label>
   <label className="block text-sm font-medium">Email address (private)<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2" /></label></div>
   <label className="block text-sm font-medium">Your comment<textarea required minLength={2} maxLength={2000} rows={4} value={body} onChange={e=>setBody(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2" placeholder="Add to the conversation..." /></label>
   <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={subscribe} onChange={e=>setSubscribe(e.target.checked)} className="mt-1" /><span>Also subscribe me to Campus Radar updates. I agree to receive emails when new stories and features are published.</span></label>
   <button disabled={loading} className="rounded-lg bg-[#173B87] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading?'Submitting...':'Post comment'}</button>
   {message&&<p role="status" className="text-sm text-[var(--muted)]">{message}</p>}
  </form>
  <div className="mt-8 space-y-5">{items.map(item=><article key={item.id} className="border-b border-[var(--line)] pb-5">
   <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.display_name}</p><time className="text-xs text-[var(--muted)]">{new Date(item.created_at).toLocaleString()}</time></div><button onClick={()=>void report(item.id)} className="text-xs text-[var(--muted)] underline">Report</button></div>
   <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{item.body}</p>
  </article>)}{items.length===0&&<p className="text-sm text-[var(--muted)]">No comments yet. Start the conversation.</p>}</div>
 </section>
}
