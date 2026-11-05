import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {hashValue,makeToken,sendNewsletterConfirmation} from '@/lib/server/engagement';
export async function POST(request:NextRequest){
 let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'Invalid request'},{status:400})}
 const email=String(body.email||'').trim().toLowerCase();
 if(!body.consent)return NextResponse.json({error:'Please confirm that you want to receive Campus Radar updates.'},{status:400});
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:'Enter a valid email address.'},{status:400});
 const db=getSupabaseAdmin(),confirmation=makeToken(),unsubscribe=makeToken();
 const {data:existing}=await db.from('newsletter_subscribers').select('id,status').eq('email_normalized',email).maybeSingle();
 if(existing?.status==='ACTIVE')return NextResponse.json({message:'This email is already subscribed.'});
 const {error}=await db.from('newsletter_subscribers').upsert({email,email_normalized:email,status:'PENDING',consent_source:String(body.source||'website').slice(0,40),confirmation_token_hash:hashValue(confirmation),unsubscribe_token_hash:hashValue(unsubscribe),confirmed_at:null,unsubscribed_at:null},{onConflict:'email_normalized'});
 if(error)return NextResponse.json({error:'Could not save your subscription.'},{status:500});
 try{await sendNewsletterConfirmation(email,confirmation,request.nextUrl.origin)}catch(error){console.error('[newsletter] Confirmation email failed:',error);return NextResponse.json({error:'Your request was saved, but the confirmation email could not be sent. Please try again later.'},{status:502})}
 return NextResponse.json({message:'Check your inbox to confirm your subscription.'},{status:201});
}
