import { NextRequest,NextResponse } from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {hashValue} from '@/lib/server/engagement';

function validId(value:string){return /^[0-9a-f-]{36}$/i.test(value)}
export async function GET(request:NextRequest) {
  const storyId=request.nextUrl.searchParams.get('storyId')||'';
  const spotlightId=request.nextUrl.searchParams.get('spotlightId')||'';
  if((!storyId&&!spotlightId)||(storyId&&spotlightId)||((storyId||spotlightId)&&!validId(storyId||spotlightId))) return NextResponse.json({error:'Invalid comment destination'},{status:400});
  const db=getSupabaseAdmin() as any;
  let query=db.from('story_comments').select('id,display_name,body,created_at').eq('status','PUBLISHED').order('created_at',{ascending:false}).limit(100);
  query=storyId?query.eq('story_id',storyId):query.eq('spotlight_id',spotlightId);
  const {data,error}=await query;
  if(error) return NextResponse.json({error:'Could not load comments'},{status:500});
  return NextResponse.json({data:data??[]});
}
export async function POST(request:NextRequest) {
  let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
  const storyId=String(body.storyId||''),spotlightId=String(body.spotlightId||''),name=String(body.displayName||'').trim(),email=String(body.email||'').trim().toLowerCase(),comment=String(body.body||'').trim();
  if((!storyId&&!spotlightId)||(storyId&&spotlightId)||!validId(storyId||spotlightId)||name.length<2||name.length>60||!/^S+@S+.S+$/.test(email)||email.length>254||comment.length<2||comment.length>2000) return NextResponse.json({error:'Check your name, email and comment. Comments must be 2–2,000 characters.'},{status:400});
  if(body.website) return NextResponse.json({message:'Comment received.'});
  const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const rateKey=hashValue(ip+'|'+(process.env.AUTH_SECRET||'campus-radar'));
  const db=getSupabaseAdmin() as any;
  if(storyId){
    const {data:story}=await db.from('stories').select('id').eq('id',storyId).eq('status','PUBLISHED').maybeSingle();
    if(!story) return NextResponse.json({error:'Article is unavailable for comments.'},{status:404});
  }else{
    const {data:spotlight}=await db.from('spotlights').select('id').eq('id',spotlightId).eq('status','PUBLISHED').eq('is_current',true).maybeSingle();
    if(!spotlight) return NextResponse.json({error:'This Spotlight is unavailable for comments.'},{status:404});
  }
  const {data:allowed,error:rateError}=await db.rpc('check_comment_rate_limit',{p_rate_key:rateKey});
  if(rateError||!allowed) return NextResponse.json({error:'Too many comments from this connection. Please try again in 10 minutes.'},{status:429});
  const {data,error}=await db.from('story_comments').insert({story_id:storyId||null,spotlight_id:spotlightId||null,display_name:name,email,body:comment}).select('id,display_name,body,created_at').single();
  if(error) return NextResponse.json({error:'Could not submit your comment.'},{status:500});
  return NextResponse.json({data},{status:201});
}
