import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { slugify } from '@/lib/server/slug';
import { requireRole } from '@/lib/server/auth';
import { radarSchema } from '@/lib/validation/content';
const MANAGERS=['SUPER_ADMIN','EDITOR'] as const;
export async function GET(request:NextRequest){
 const p=request.nextUrl.searchParams, admin=p.get('admin')==='true';
 if(admin){try{await requireRole([...MANAGERS]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}}
 const n=Number(p.get('limit')??20), limit=Number.isFinite(n)?Math.min(Math.max(n,1),50):20;
 let q=getSupabaseAdmin().from('radar_items').select('*').order(admin?'created_at':'published_at',{ascending:false}).limit(limit);
 if(!admin)q=q.eq('status','PUBLISHED');
 const {data,error}=await q; if(error)return NextResponse.json({error:'Could not load Radar items'},{status:500});
 return NextResponse.json({data:data??[]});
}
export async function POST(request:NextRequest){
 try{await requireRole([...MANAGERS]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
 const parsed=radarSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Invalid Radar item',details:parsed.error.flatten()},{status:400});
 const d=parsed.data;const {data,error}=await getSupabaseAdmin().from('radar_items').insert({title:d.title,slug:slugify(d.title),summary:d.summary,cover_image:d.coverImage||null,kind:d.kind,origin:d.origin,commercial_status:d.commercialStatus,event_date:d.eventDate?new Date(d.eventDate).toISOString():null,location:d.location||null,link:d.link||null,status:d.status,published_at:d.status==='PUBLISHED'?new Date().toISOString():null}).select('*').single();
 if(error)return NextResponse.json({error:'Could not create Radar item'},{status:500});return NextResponse.json({data},{status:201});
}
