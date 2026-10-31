import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/server/supabase';
import { requireRole } from '@/lib/server/auth';
const ROLES = ['EDITOR', 'REPORTER'] as const;
const APP_URL = 'https://campus-radar-v1.campusradarfunaab.workers.dev';
const authError = (e: unknown) => e instanceof Error && e.message === 'Forbidden' ? NextResponse.json({error:'Master Admin access required'},{status:403}) : NextResponse.json({error:'Authentication required'},{status:401});
const safe = (u: any) => ({id:u.id,name:u.name,email:u.email,role:u.role,isActive:u.is_active,createdAt:u.created_at});
export async function GET() {
 try { await requireRole(['SUPER_ADMIN']); } catch(e) { return authError(e); }
 const db=getSupabaseAdmin();
 const [{data:users,error},{data:invitations,error:inviteError}]=await Promise.all([
  db.from('users').select('id,name,email,role,is_active,created_at').order('created_at',{ascending:true}),
  (db as any).from('admin_invitations').select('id,email,role,expires_at,created_at').is('accepted_at',null).is('revoked_at',null).gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false})
 ]);
 if(error||inviteError)return NextResponse.json({error:'Could not load account management data'},{status:500});
 return NextResponse.json({users:(users??[]).map(safe),invitations:invitations??[]});
}
export async function POST(request:NextRequest) {
 let actor; try { actor=await requireRole(['SUPER_ADMIN']); } catch(e) { return authError(e); }
 let body:any; try { body=await request.json(); } catch { return NextResponse.json({error:'Invalid request body'},{status:400}); }
 const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'', role=body?.role;
 if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254||!ROLES.includes(role))return NextResponse.json({error:'Provide a valid email address and role'},{status:400});
 const db=getSupabaseAdmin();
 const {data:existing,error:lookupError}=await db.from('users').select('id').eq('email',email).maybeSingle();
 if(lookupError)return NextResponse.json({error:'Could not verify email address'},{status:500});
 if(existing)return NextResponse.json({error:'An account with this email already exists'},{status:409});
 const token=randomBytes(32).toString('base64url'), tokenHash=createHash('sha256').update(token).digest('hex');
 const expiresAt=new Date(Date.now()+48*60*60*1000).toISOString();
 const {error:revokeError}=await (db as any).from('admin_invitations').update({revoked_at:new Date().toISOString()}).eq('email',email).is('accepted_at',null).is('revoked_at',null);
 if(revokeError)return NextResponse.json({error:'Could not replace previous invitation'},{status:500});
 const {data:invite,error:insertError}=await (db as any).from('admin_invitations').insert({email,role,token_hash:tokenHash,invited_by:actor.id,expires_at:expiresAt}).select('id').single();
 if(insertError||!invite)return NextResponse.json({error:'Could not create invitation'},{status:500});
 const apiKey=process.env.RESEND_API_KEY, from=process.env.EMAIL_FROM;
 if(!apiKey||!from){await (db as any).from('admin_invitations').update({revoked_at:new Date().toISOString()}).eq('id',invite.id);return NextResponse.json({error:'Invitation email is not configured. Contact the system administrator.'},{status:503});}
 const link=`${APP_URL}/admin/accept-invitation?token=${encodeURIComponent(token)}`;
 const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject:'Your Campus Radar newsroom invitation',html:`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717"><h2>Campus Radar newsroom invitation</h2><p>You have been invited as a <strong>${role==='EDITOR'?'Editor':'Reporter'}</strong>.</p><p>Use this secure link to create your account password. It expires in 48 hours and can only be used once.</p><p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:6px">Create your account</a></p><p>If you were not expecting this invitation, ignore this email.</p></div>`})});
 if(!sent.ok){await (db as any).from('admin_invitations').update({revoked_at:new Date().toISOString()}).eq('id',invite.id);return NextResponse.json({error:'Invitation email could not be sent. Check email service configuration.'},{status:502});}
 return NextResponse.json({message:`Invitation sent to ${email}`},{status:201});
}
export async function PATCH(request:NextRequest) {
 let actor; try {actor=await requireRole(['SUPER_ADMIN']);} catch(e){return authError(e);}
 let body:any;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid request body'},{status:400});}
 const id=typeof body?.id==='string'?body.id:'',role=body?.role,isActive=body?.isActive;
 if(!id)return NextResponse.json({error:'User ID is required'},{status:400});
 if(role!==undefined&&!ROLES.includes(role))return NextResponse.json({error:'Only Editor and Reporter roles can be assigned here'},{status:400});
 if(isActive!==undefined&&typeof isActive!=='boolean')return NextResponse.json({error:'Invalid account status'},{status:400});
 if(role===undefined&&isActive===undefined)return NextResponse.json({error:'No changes supplied'},{status:400});
 if(id===actor.id)return NextResponse.json({error:'The Master Admin account cannot be changed here'},{status:400});
 const db=getSupabaseAdmin(),{data:target,error:lookup}=await db.from('users').select('id,role').eq('id',id).maybeSingle();
 if(lookup)return NextResponse.json({error:'Could not load account'},{status:500});
 if(!target)return NextResponse.json({error:'Account not found'},{status:404});
 if(target.role==='SUPER_ADMIN')return NextResponse.json({error:'Master Admin privileges cannot be changed here'},{status:403});
 const changes:any={updated_at:new Date().toISOString()};if(role!==undefined)changes.role=role;if(isActive!==undefined)changes.is_active=isActive;
 const {data,error}=await db.from('users').update(changes).eq('id',id).select('id,name,email,role,is_active,created_at').single();
 if(error)return NextResponse.json({error:'Could not update account'},{status:500});
 return NextResponse.json({user:safe(data)});
}
