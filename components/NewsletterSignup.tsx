'use client';
import {useState} from 'react';
export function NewsletterSignup({compact=false}:{compact?:boolean}){
 const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{const r=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,consent:true,source:'website-form'})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not subscribe.');setMessage(d.message);setEmail('')}catch(err){setMessage(err instanceof Error?err.message:'Something went wrong.')}finally{setBusy(false)}}
 return <section className={compact?'':'my-10 rounded-xl border border-[var(--line)] p-6'}>
  <h2 className="text-xl font-bold">Stay in the loop</h2><p className="mt-2 text-sm text-[var(--muted)]">Get new Campus Radar stories, features and opportunities in your inbox.</p>
  <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email address" className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-transparent px-3 py-2.5 text-sm" /><button disabled={busy} className="rounded-lg bg-[#173B87] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy?'Submitting...':'Subscribe'}</button></form>
  <p className="mt-3 text-xs text-[var(--muted)]">You'll receive a confirmation email before being added. Unsubscribe at any time.</p>{message&&<p role="status" className="mt-2 text-sm">{message}</p>}
 </section>
}
