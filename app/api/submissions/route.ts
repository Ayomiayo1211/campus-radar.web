import { NextRequest,NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
import { submissionSchema } from '@/lib/validation/content';
const REVIEW_ROLES=['SUPER_ADMIN','EDITOR'] as const;
export async function GET(request:NextRequest){
 try{await requireRole([...REVIEW_ROLES]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}
 const p=request.nextUrl.searchParams,status=p.get('status'),n=Number(p.get('limit')??20),limit=Number.isFinite(n)?Math.min(Math.max(Math.floor(n),1),50):20;
 let q=getSupabaseAdmin().from('submissions').select('*').order('created_at',{ascending:false}).limit(limit);if(status)q=q.eq('status',status.trim().toUpperCase());
 const {data,error}=await q;if(error)return NextResponse.json({error:'Could not load submissions'},{status:500});return NextResponse.json({data:data??[]});
}
export async function POST(request:NextRequest){
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
 const parsed=submissionSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Invalid submission',details:parsed.error.flatten()},{status:400});
 const d=parsed.data;const {data,error}=await getSupabaseAdmin().from('submissions').insert({type:d.type,name:d.name??null,contact:d.contact??null,title:d.title??null,body:d.body,status:'PENDING',source:'WEBSITE'}).select('id,status').single();
 if(error)return NextResponse.json({error:'Could not save submission'},{status:500});return NextResponse.json({message:'Submission received successfully',data},{status:201});
}
