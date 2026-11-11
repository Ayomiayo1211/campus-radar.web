import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
export const dynamic = 'force-dynamic';

const snapshotFields = 'title,excerpt,body,author_name,image_url,status,is_current';

export async function GET() {
  const { data, error } = await (getSupabaseAdmin() as any).from('spotlights')
    .select('id,title,excerpt,body,image_url,author_name,status,is_current,created_at,published_at')
    .eq('status', 'PUBLISHED').eq('is_current', true).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load Spotlight' }, { status: 500 });
  return NextResponse.json({ data: data ? { id:data.id,title:data.title,excerpt:data.excerpt,body:data.body,imageUrl:data.image_url,authorName:data.author_name,publishedAt:data.published_at } : null });
}

export async function POST(request: NextRequest) {
  let user;
  try { user = await requireRole(['SUPER_ADMIN', 'SENIOR_EDITOR', 'EDITOR']); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }
  let b: any;
  try { b = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const title=String(b.title||'').trim(), excerpt=String(b.excerpt||'').trim(), body=String(b.body||'').trim();
  const author=String(b.author_name||'').trim(), image=typeof b.image_url==='string'&&b.image_url?b.image_url:null;
  const status=b.status==='PUBLISHED'?'PUBLISHED':'DRAFT';
  if(title.length<3||title.length>180||excerpt.length<10||excerpt.length>500||body.length<20||author.length<2)
    return NextResponse.json({error:'Complete the title, excerpt, write-up and author fields.'},{status:400});
  if(image&&!/^https:\/\//i.test(image)) return NextResponse.json({error:'Invalid image URL'},{status:400});
  const db=getSupabaseAdmin() as any, now=new Date().toISOString();
  const {data,error}=await db.from('spotlights').insert({
    title,excerpt,body,image_url:image,author_name:author,status,is_current:false,
    created_by:user.id,published_at:status==='PUBLISHED'?now:null,
    editing_locked_by:user.id,editing_locked_at:now,
  }).select('*').single();
  if(error||!data) return NextResponse.json({error:'Could not save Spotlight'},{status:500});
  const {error:historyError}=await db.from('spotlight_edit_history').insert({
    spotlight_id:data.id,editor_id:user.id,editor_name:user.name,action:'STARTED',after_snapshot:{
      title,excerpt,body,author_name:author,image_url:image,status,is_current:false
    }
  });
  if(historyError){await db.from('spotlights').delete().eq('id',data.id);return NextResponse.json({error:'Could not record Spotlight ownership.'},{status:500});}
  if(status==='PUBLISHED'){
    await db.from('spotlights').update({is_current:false}).eq('is_current',true);
    const activated=await db.from('spotlights').update({is_current:true}).eq('id',data.id).eq('editing_locked_by',user.id);
    if(activated.error)return NextResponse.json({error:'Saved, but could not activate Spotlight'},{status:500});
  }
  return NextResponse.json({data},{status:201});
}

export async function PATCH(request: NextRequest) {
  let user;
  try { user = await requireRole(['SUPER_ADMIN', 'EDITOR']); }
  catch { return NextResponse.json({ error: 'Editors only' }, { status: 403 }); }
  let b: any;
  try { b = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if(typeof b.id!=='string') return NextResponse.json({error:'Missing Spotlight ID'},{status:400});
  const db=getSupabaseAdmin() as any;
  const {data:before,error:lookupError}=await db.from('spotlights').select('*').eq('id',b.id).maybeSingle();
  if(lookupError)return NextResponse.json({error:'Could not load Spotlight'},{status:500});
  if(!before)return NextResponse.json({error:'Spotlight not found'},{status:404});
  if(before.editing_locked_by!==user.id)
    return NextResponse.json({error:before.editing_locked_by?'This Spotlight is locked by another editor. It is read-only until they release it.':'Claim this Spotlight before making changes.'},{status:409});
  const updates:any={updated_at:new Date().toISOString()};
  for(const k of ['title','excerpt','body','author_name','image_url','status']) if(b[k]!==undefined) updates[k]=b[k];
  if(b.activate===true){updates.is_current=true;updates.status='PUBLISHED';updates.published_at=new Date().toISOString();}
  if(b.deactivate===true || (updates.status && updates.status !== 'PUBLISHED')) updates.is_current=false;
  const {data,error}=await db.from('spotlights').update(updates).eq('id',b.id).eq('editing_locked_by',user.id).select('*').single();
  if(error||!data)return NextResponse.json({error:'Could not update Spotlight. Confirm you still own its lock.'},{status:409});
  const changed=Object.keys(updates).some(k=>!['updated_at'].includes(k));
  if(changed){
    const {error:historyError}=await db.from('spotlight_edit_history').insert({
      spotlight_id:b.id,editor_id:user.id,editor_name:user.name,action:'UPDATED',
      before_snapshot:Object.fromEntries(Object.keys(updates).filter(k=>k!=='updated_at').map(k=>[k,(before as any)[k]])),
      after_snapshot:Object.fromEntries(Object.keys(updates).filter(k=>k!=='updated_at').map(k=>[k,(data as any)[k]])),
    });
    if(historyError)return NextResponse.json({error:'Spotlight saved, but revision history could not be recorded.'},{status:500});
  }
  if(b.activate===true){
    const {error:deactivateError}=await db.from('spotlights').update({is_current:false}).neq('id',b.id).eq('is_current',true);
    if(deactivateError)return NextResponse.json({error:'Saved, but could not update the current Spotlight.'},{status:500});
  }
  return NextResponse.json({data});
}