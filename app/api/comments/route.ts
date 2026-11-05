import { NextRequest,NextResponse } from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {hashValue} from '@/lib/server/engagement';

export async function GET(request:NextRequest) {
  const storyId=request.nextUrl.searchParams.get('storyId')||'';
  if(!/^[0-9a-f-]{36}$/i.test(storyId)) return NextResponse.json({error:'Invalid story'},{status:400});
  const db=getSupabaseAdmin() as any;
  const {data,error}=await db.from('story_comments').select('id,display_name,body,created_at').eq('story_id',storyId).eq('status','PUBLISHED').order('created_at',{ascending:false}).limit(100);
  if(error) return NextResponse.json({error:'Could not load comments'},{status:500});
  return NextResponse.json({data:data??[]});
}
export async function POST(request:NextRequest) {
  let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
  const storyId=String(body.storyId||''),name=String(body.displayName||'').trim(),email=String(body.email||'').trim().toLowerCase(),comment=String(body.body||'').trim();
  if(!/^[0-9a-f-]{36}$/i.test(storyId)||name.length<2||name.length>60||!/^\S+@\S+\.\S+$/.test(email)||email.length>254||comment.length<2||comment.length>2000) return NextResponse.json({error:'Check your name, email and comment. Comments must be 2–2,000 characters.'},{status:400});
  if(body.website) return NextResponse.json({message:'Comment received.'});
  const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const rateKey=hashValue(ip+'|'+(process.env.AUTH_SECRET||'campus-radar'));
  const db=getSupabaseAdmin() as any;
  const {data:story}=await db.from('stories').select('id').eq('id',storyId).eq('status','PUBLISHED').maybeSingle();
  if(!story) return NextResponse.json({error:'Article is unavailable for comments.'},{status:404});
  const {data:allowed,error:rateError}=await db.rpc('check_comment_rate_limit',{p_rate_key:rateKey});
  if(rateError||!allowed) return NextResponse.json({error:'Too many comments from this connection. Please try again in 10 minutes.'},{status:429});
  const {data,error}=await db.from('story_comments').insert({story_id:storyId,display_name:name,email,body:comment}).select('id,display_name,body,created_at').single();
  if(error) return NextResponse.json({error:'Could not submit your comment.'},{status:500});
  return NextResponse.json({data},{status:201});
}
