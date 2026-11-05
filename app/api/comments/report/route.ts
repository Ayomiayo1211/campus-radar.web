import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {hashValue} from '@/lib/server/engagement';
export async function POST(request:NextRequest){
 let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
 const commentId=String(body.commentId||''),reason=String(body.reason||'Inappropriate or abusive content').slice(0,500);
 if(!/^[0-9a-f-]{36}$/i.test(commentId))return NextResponse.json({error:'Invalid comment'},{status:400});
 const ip=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const {error}=await getSupabaseAdmin().from('story_comment_reports').insert({comment_id:commentId,reporter_hash:hashValue(ip+'|'+commentId),reason});
 if(error&&error.code==='23505')return NextResponse.json({message:'This comment has already been reported.'});
 if(error)return NextResponse.json({error:'Could not report comment.'},{status:500});
 return NextResponse.json({message:'Thank you. The editorial team will review this comment.'});
}
