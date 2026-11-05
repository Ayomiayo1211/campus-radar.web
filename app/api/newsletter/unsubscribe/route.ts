import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {hashValue} from '@/lib/server/engagement';
export async function GET(request:NextRequest){
 const token=request.nextUrl.searchParams.get('token')||'';
 if(!/^[a-f0-9]{64}$/i.test(token))return new NextResponse('Invalid unsubscribe link.',{status:400});
 const {data,error}=await getSupabaseAdmin().from('newsletter_subscribers').update({status:'UNSUBSCRIBED',unsubscribed_at:new Date().toISOString()}).eq('unsubscribe_token_hash',hashValue(token)).eq('status','ACTIVE').select('id').maybeSingle();
 if(error)return new NextResponse('Could not process unsubscribe request.',{status:500});
 return new NextResponse(data?'You have been unsubscribed from Campus Radar updates.':'This link is invalid or the subscription is already inactive.',{status:data?200:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
