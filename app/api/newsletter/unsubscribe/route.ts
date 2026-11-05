import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
function getToken(request:NextRequest){return request.nextUrl.searchParams.get('token')||'';}
export async function GET(request:NextRequest){
 const token=getToken(request);
 if(!/^[a-f0-9]{64}$/i.test(token))return new NextResponse('Invalid unsubscribe link.',{status:400});
 return new NextResponse(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe | Campus Radar</title></head><body style="font-family:Arial,sans-serif;max-width:560px;margin:12vh auto;padding:24px;color:#171717"><h1>Unsubscribe from Campus Radar</h1><p>Do you want to stop receiving new story notifications from Campus Radar?</p><form method="post" action="/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}"><button style="background:#173B87;color:white;border:0;border-radius:6px;padding:12px 18px;font-weight:600;cursor:pointer">Confirm unsubscribe</button></form></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
export async function POST(request:NextRequest){
 const token=getToken(request);
 if(!/^[a-f0-9]{64}$/i.test(token))return new NextResponse('Invalid unsubscribe link.',{status:400});
 const {data,error}=(await (getSupabaseAdmin() as any).from('newsletter_subscribers').update({status:'UNSUBSCRIBED',unsubscribed_at:new Date().toISOString()}).eq('unsubscribe_token_hash',token).eq('status','ACTIVE').select('id').maybeSingle());
 if(error)return new NextResponse('Could not process unsubscribe request.',{status:500});
 return new NextResponse(data?'You have been unsubscribed from Campus Radar updates.':'This link is invalid or the subscription is already inactive.',{status:data?200:404,headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
