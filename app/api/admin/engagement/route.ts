import {NextRequest,NextResponse} from 'next/server';
import {requireRole} from '@/lib/server/auth';
import {getSupabaseAdmin} from '@/lib/server/supabase';
export async function GET(){
 try{await requireRole(['SUPER_ADMIN','EDITOR'])}catch{return NextResponse.json({error:'Unauthorized'},{status:401})}
 const db=getSupabaseAdmin();
 const [comments,subscribers,reports]=await Promise.all([
  db.from('story_comments').select('id,story_id,display_name,email,body,status,created_at,story:stories(title)').order('created_at',{ascending:false}).limit(300),
  db.from('newsletter_subscribers').select('id,email,status,created_at,confirmed_at').order('created_at',{ascending:false}).limit(2000),
  db.from('story_comment_reports').select('id,comment_id,reason,created_at').order('created_at',{ascending:false}).limit(300)
 ]);
 if(comments.error||subscribers.error||reports.error)return NextResponse.json({error:'Could not load engagement data.'},{status:500});
 return NextResponse.json({comments:comments.data??[],subscribers:subscribers.data??[],reports:reports.data??[]});
}
export async function PATCH(request:NextRequest){
 try{await requireRole(['SUPER_ADMIN','EDITOR'])}catch{return NextResponse.json({error:'Unauthorized'},{status:401})}
 let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
 const db=getSupabaseAdmin();
 if(body.type==='comment'&&/^[0-9a-f-]{36}$/i.test(String(body.id))&&['PUBLISHED','HIDDEN','DELETED'].includes(body.status)){
  const {error}=await db.from('story_comments').update({status:body.status,updated_at:new Date().toISOString()}).eq('id',body.id);
  if(error)return NextResponse.json({error:'Could not update comment.'},{status:500});
  return NextResponse.json({message:'Comment updated.'});
 }
 if(body.type==='subscriber'&&/^[0-9a-f-]{36}$/i.test(String(body.id))&&['ACTIVE','UNSUBSCRIBED'].includes(body.status)){
  const {error}=await db.from('newsletter_subscribers').update({status:body.status,unsubscribed_at:body.status==='UNSUBSCRIBED'?new Date().toISOString():null}).eq('id',body.id);
  if(error)return NextResponse.json({error:'Could not update subscriber.'},{status:500});
  return NextResponse.json({message:'Subscriber updated.'});
 }
 return NextResponse.json({error:'Invalid update.'},{status:400});
}
