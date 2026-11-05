import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {hashValue} from '@/lib/server/engagement';
export async function GET(request:NextRequest){
 const token=request.nextUrl.searchParams.get('token')||'';
 if(!/^[a-f0-9]{64}$/i.test(token))return NextResponse.redirect(new URL('/?newsletter=invalid',request.url));
 const {data,error}=await (getSupabaseAdmin() as any).from('newsletter_subscribers').update({status:'ACTIVE',confirmed_at:new Date().toISOString(),confirmation_token_hash:null}).eq('confirmation_token_hash',hashValue(token)).eq('status','PENDING').select('id').maybeSingle();
 if(error||!data)return NextResponse.redirect(new URL('/?newsletter=invalid',request.url));
 return NextResponse.redirect(new URL('/?newsletter=confirmed',request.url));
}
