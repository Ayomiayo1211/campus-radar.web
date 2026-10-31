import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { createSession } from '@/lib/server/auth';
export async function POST(request:NextRequest) {
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid request body'},{status:400});}
 const token=typeof body?.token==='string'?body.token:'',name=typeof body?.name==='string'?body.name.trim():'',password=typeof body?.password==='string'?body.password:'';
 if(token.length<32||token.length>200||name.length<2||name.length>120||password.length<12||password.length>128)return NextResponse.json({error:'Enter your name and a password between 12 and 128 characters.'},{status:400});
 const tokenHash=createHash('sha256').update(token).digest('hex'),passwordHash=await bcrypt.hash(password,12);
 const {data,error}=await (getSupabaseAdmin() as any).rpc('accept_admin_invitation',{p_token_hash:tokenHash,p_name:name,p_password_hash:passwordHash});
 if(error||typeof data!=='string')return NextResponse.json({error:error?.message?.includes('already exists')?'An account with this email already exists.':'This invitation is invalid, expired, or has already been used.'},{status:400});
 const {data:user}=await getSupabaseAdmin().from('users').select('role').eq('id',data).single();
 await createSession(data,user?.role??'REPORTER');
 return NextResponse.json({message:'Account created successfully.'});
}