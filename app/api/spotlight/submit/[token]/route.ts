import { NextRequest,NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
async function hash(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
type Ctx={params:Promise<{token:string}>};
export async function POST(request:NextRequest,{params}:Ctx){
 const {token}=await params;if(!/^[a-f0-9-]{60,80}$/i.test(token))return NextResponse.json({error:'Invalid link'},{status:404});
 let b:any;try{b=await request.json();}catch{return NextResponse.json({error:'Invalid submission'},{status:400});}
 const title=String(b.title||'').trim(),excerpt=String(b.excerpt||'').trim(),body=String(b.body||'').trim(),author=String(b.authorName||'').trim(),image=typeof b.imageUrl==='string'?b.imageUrl:null;
 if(title.length<3||title.length>180||excerpt.length<10||excerpt.length>500||body.length<20||author.length<2)return NextResponse.json({error:'Please complete all required fields.'},{status:400});
 const db=getSupabaseAdmin() as any;const {data:link,error}=await db.from('spotlight_submission_links').select('id,expires_at,used_at').eq('token_hash',await hash(token)).maybeSingle();
 if(error||!link||link.used_at||new Date(link.expires_at).getTime()<Date.now())return NextResponse.json({error:'This link is invalid, expired or has already been used.'},{status:410});
 const {data:claimed,error:claimError}=await db.from('spotlight_submission_links').update({used_at:new Date().toISOString()}).eq('id',link.id).is('used_at',null).select('id').maybeSingle();
 if(claimError||!claimed)return NextResponse.json({error:'This link has already been used.'},{status:410});
 const {error:insertError}=await db.from('spotlights').insert({title,excerpt,body,author_name:author,image_url:image,status:'REVIEW',is_current:false,submitted_by:author});
 if(insertError)return NextResponse.json({error:'Could not save submission'},{status:500});
 return NextResponse.json({message:'Your Spotlight submission has been sent to the editors.'},{status:201});
}