import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, toCamelCase } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
import { storySchema } from '@/lib/validation/content';
type RouteContext={params:Promise<{id:string}>};
const ROLES=['SUPER_ADMIN','EDITOR','REPORTER'] as const;
export async function GET(_request:NextRequest,{params}:RouteContext){
 const {id}=await params;const db=getSupabaseAdmin();
 const {data:story,error}=await db.from('stories').select('*,tags:story_tags(*),images:story_images(*),author:users(id,name)').eq('id',id).maybeSingle();
 if(error)return NextResponse.json({error:'Could not load story'},{status:500});if(!story)return NextResponse.json({error:'Story not found'},{status:404});
 if(story.status!=='PUBLISHED'){let user;try{user=await requireRole([...ROLES]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}if(user.role==='REPORTER'&&story.author_id!==user.id)return NextResponse.json({error:'You cannot access this story'},{status:403});}
 return NextResponse.json({data:toCamelCase(story)});
}
export async function PATCH(request:NextRequest,{params}:RouteContext){
 const {id}=await params;let user;try{user=await requireRole([...ROLES]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}
 const db=getSupabaseAdmin();const {data:existing,error:lookupError}=await db.from('stories').select('*').eq('id',id).maybeSingle();
 if(lookupError)return NextResponse.json({error:'Could not load story'},{status:500});if(!existing)return NextResponse.json({error:'Story not found'},{status:404});
 if(user.role==='REPORTER'&&(existing.author_id!==user.id||!['DRAFT','REVIEW'].includes(existing.status)))return NextResponse.json({error:'You can only edit your own draft or review stories'},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
 const parsed=storySchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Invalid story',details:parsed.error.flatten()},{status:400});const d=parsed.data;
 if(user.role==='REPORTER'&&!['DRAFT','REVIEW'].includes(d.status))return NextResponse.json({error:'Reporters cannot publish or archive stories'},{status:403});
 const {data:story,error}=await db.from('stories').update({title:d.title,excerpt:d.excerpt,body:d.body,content_type:d.contentType,origin:d.origin,commercial_status:d.commercialStatus,author_name:user.role==='REPORTER'?existing.author_name:d.authorName,author_id:user.role==='REPORTER'?existing.author_id:(d.authorId??existing.author_id),featured:user.role==='REPORTER'?existing.featured:d.featured,cover_image:d.coverImage??null,status:d.status,published_at:d.status==='PUBLISHED'?(existing.published_at??new Date().toISOString()):null,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();
 if(error||!story)return NextResponse.json({error:'Could not update story'},{status:500});
 const tagDelete=await db.from('story_tags').delete().eq('story_id',id);if(tagDelete.error)return NextResponse.json({error:'Story saved, but tags could not be updated'},{status:500});
 if(d.tags.length){const r=await db.from('story_tags').insert(d.tags.map(tag=>({story_id:id,tag})));if(r.error)return NextResponse.json({error:'Story saved, but tags could not be updated'},{status:500});}
 if(d.galleryImages!==undefined){const del=await db.from('story_images').delete().eq('story_id',id);if(del.error)return NextResponse.json({error:'Story saved, but images could not be updated'},{status:500});if(d.galleryImages.length){const r=await db.from('story_images').insert(d.galleryImages.map((image,index)=>({story_id:id,url:image.url,media_id:image.mediaId||null,alt_text:image.altText||null,caption:image.caption||null,photographer:image.photographer||null,display_order:image.displayOrder??index})));if(r.error)return NextResponse.json({error:'Story saved, but images could not be updated'},{status:500});}}
 const {data:complete}=await db.from('stories').select('*,tags:story_tags(*),images:story_images(*),author:users(id,name)').eq('id',id).single();return NextResponse.json({data:toCamelCase(complete??story)});
}
export async function DELETE(_request:NextRequest,{params}:RouteContext){const {id}=await params;try{await requireRole(['SUPER_ADMIN','EDITOR']);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}const {data,error}=await getSupabaseAdmin().from('stories').delete().eq('id',id).select('id').maybeSingle();if(error)return NextResponse.json({error:'Could not delete story'},{status:500});if(!data)return NextResponse.json({error:'Story not found'},{status:404});return NextResponse.json({message:'Story deleted successfully'});}
