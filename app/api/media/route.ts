import { NextResponse } from 'next/server';
import { getSupabaseAdmin, toCamelCase } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
export async function GET(){
 try{await requireRole(['SUPER_ADMIN','EDITOR','REPORTER']);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}
 const {data,error}=await getSupabaseAdmin().from('media').select('*').order('created_at',{ascending:false});
 if(error)return NextResponse.json({error:'Could not load media'},{status:500});return NextResponse.json({data:toCamelCase(data??[])});
}
