import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { slugify } from '@/lib/server/slug';
import { requireRole } from '@/lib/server/auth';
import { opportunitySchema } from '@/lib/validation/content';
const MANAGERS=['SUPER_ADMIN','EDITOR'] as const;
export async function GET(request:NextRequest){
 const p=request.nextUrl.searchParams,admin=p.get('admin')==='true';if(admin){try{await requireRole([...MANAGERS]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}}
 const n=Number(p.get('limit')??20),limit=Number.isFinite(n)?Math.min(Math.max(n,1),50):20;
 let q=getSupabaseAdmin().from('opportunities').select('*').order('deadline',{ascending:true}).limit(limit);if(!admin)q=q.eq('status','PUBLISHED');
 const {data,error}=await q;if(error)return NextResponse.json({error:'Could not load opportunities'},{status:500});return NextResponse.json({data:data??[]});
}
export async function POST(request:NextRequest){
 try{await requireRole([...MANAGERS]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
 const parsed=opportunitySchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Invalid opportunity',details:parsed.error.flatten()},{status:400});
 const d=parsed.data;const {data,error}=await getSupabaseAdmin().from('opportunities').insert({title:d.title,slug:slugify(d.title),organisation:d.organisation,type:d.type,description:d.description,deadline:d.deadline??null,application_url:d.applicationUrl??null,origin:d.origin,commercial_status:d.commercialStatus,status:d.status,published_at:d.status==='PUBLISHED'?new Date().toISOString():null}).select('*').single();
 if(error)return NextResponse.json({error:'Could not create opportunity'},{status:500});return NextResponse.json({data},{status:201});
}
