import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await (getSupabaseAdmin() as any).from('spotlights').select('id,title,excerpt,body,image_url,author_name,status,is_current,created_at,published_at').eq('status','PUBLISHED').eq('is_current',true).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load Spotlight' }, { status: 500 });
  return NextResponse.json({ data: data ? { id:data.id,title:data.title,excerpt:data.excerpt,body:data.body,imageUrl:data.image_url,authorName:data.author_name,publishedAt:data.published_at } : null });
}
export async function POST(request:NextRequest) {
  let user; try { user=await requireRole(['SUPER_ADMIN','EDITOR']); } catch { return NextResponse.json({error:'Editors only'},{status:403}); }
  let b:any; try { b=await request.json(); } catch { return NextResponse.json({error:'Invalid request'},{status:400}); }
  const title=String(b.title||'').trim(), excerpt=String(b.excerpt||'').trim(), body=String(b.body||'').trim(), author=String(b.author_name||'').trim(), image=typeof b.image_url==='string'&&b.image_url?b.image_url:null, status=b.status==='PUBLISHED'?'PUBLISHED':'DRAFT';
  if(title.length<3||title.length>180||excerpt.length<10||excerpt.length>500||body.length<20||author.length<2) return NextResponse.json({error:'Complete the title, excerpt, write-up and author fields.'},{status:400});
  if(image&&!/^https:\/\//i.test(image)) return NextResponse.json({error:'Invalid image URL'},{status:400});
  const db=getSupabaseAdmin() as any;
  if(status==='PUBLISHED') await db.from('spotlights').update({is_current:false}).eq('is_current',true);
  const {data,error}=await db.from('spotlights').insert({title,excerpt,body,image_url:image,author_name:author,status,is_current:status==='PUBLISHED',created_by:user.id,published_at:status==='PUBLISHED'?new Date().toISOString():null}).select('*').single();
  if(error||!data) return NextResponse.json({error:'Could not save Spotlight'},{status:500});
  return NextResponse.json({data},{status:201});
}
export async function PATCH(request:NextRequest) {
  try { await requireRole(['SUPER_ADMIN','EDITOR']); } catch { return NextResponse.json({error:'Editors only'},{status:403}); }
  let b:any; try { b=await request.json(); } catch { return NextResponse.json({error:'Invalid request'},{status:400}); }
  if(typeof b.id!=='string') return NextResponse.json({error:'Missing Spotlight ID'},{status:400});
  const db=getSupabaseAdmin();
  if(b.activate===true) await db.from('spotlights').update({is_current:false}).eq('is_current',true);
  const updates:any={updated_at:new Date().toISOString()};
  for(const k of ['title','excerpt','body','author_name','image_url','status']) if(b[k]!==undefined) updates[k]=b[k];
  if(b.activate===true){updates.is_current=true;updates.status='PUBLISHED';updates.published_at=new Date().toISOString();}
  if(b.deactivate===true) updates.is_current=false;
  const {data,error}=await db.from('spotlights').update(updates).eq('id',b.id).select('*').single();
  if(error||!data) return NextResponse.json({error:'Could not update Spotlight'},{status:500});
  return NextResponse.json({data});
}