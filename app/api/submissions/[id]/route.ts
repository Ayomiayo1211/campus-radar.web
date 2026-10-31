import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {requireRole} from '@/lib/server/auth';
type RouteContext={params:Promise<{id:string}>};
const REVIEW_ROLES=['SUPER_ADMIN','EDITOR'] as const;
export async function PATCH(request:NextRequest,{params}:RouteContext){
 let actor;try{actor=await requireRole([...REVIEW_ROLES]);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}
 const {id}=await params;let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
 if(typeof body!=='object'||body===null||!('status'in body)||typeof (body as {status:unknown}).status!=='string')return NextResponse.json({error:'A valid status is required'},{status:400});
 const status=(body as {status:string}).status.toUpperCase();if(!['PENDING','REVIEWING','ACCEPTED','REJECTED'].includes(status))return NextResponse.json({error:'Invalid submission status'},{status:400});
 const {data,error}=await getSupabaseAdmin().from('submissions').update({status,reviewed_by:actor.id,updated_at:new Date().toISOString(),reviewed_at:new Date().toISOString()}).eq('id',id).select('id,status').maybeSingle();
 if(error)return NextResponse.json({error:'Could not update submission'},{status:500});if(!data)return NextResponse.json({error:'Submission not found'},{status:404});return NextResponse.json({data});
}
