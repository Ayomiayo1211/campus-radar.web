import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
async function hash(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function POST(request:NextRequest){
 let user;try{user=await requireRole(['SUPER_ADMIN','EDITOR']);}catch{return NextResponse.json({error:'Editors only'},{status:403});}
 const token=crypto.randomUUID()+crypto.randomUUID().replace(/-/g,'');
 const expiresAt=new Date(Date.now()+48*60*60*1000).toISOString();
 const {error}=await (getSupabaseAdmin() as any).from('spotlight_submission_links').insert({token_hash:await hash(token),created_by:user.id,expires_at:expiresAt});
 if(error)return NextResponse.json({error:'Could not create submission link'},{status:500});
 return NextResponse.json({url:new URL('/spotlight/submit/'+token,request.nextUrl.origin).toString(),expiresAt});
}