import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {requireRole} from '@/lib/server/auth';
export async function GET(){try{await requireRole(['SUPER_ADMIN']);}catch{return NextResponse.json({error:'Unauthorized'},{status:401});}const {error}=await getSupabaseAdmin().storage.from('campus-radar-media').list('',{limit:1});if(error)return NextResponse.json({success:false,error:'Supabase Storage is unavailable'},{status:503});return NextResponse.json({success:true,status:'connected',bucket:'campus-radar-media'});}
