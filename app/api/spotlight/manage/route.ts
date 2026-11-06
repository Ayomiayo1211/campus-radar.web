import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
export async function GET() {
 try { await requireRole(['SUPER_ADMIN','EDITOR']); } catch { return NextResponse.json({error:'Editors only'},{status:403}); }
 const {data,error}=await getSupabaseAdmin().from('spotlights').select('*').order('created_at',{ascending:false});
 if(error) return NextResponse.json({error:'Could not load Spotlights'},{status:500});
 return NextResponse.json({data:data??[]});
}