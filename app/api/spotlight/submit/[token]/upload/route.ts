import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
import {enforceRateLimit} from '@/lib/server/rate-limit';
async function hash(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
type Ctx={params:Promise<{token:string}>};
function detectImageFormat(bytes:Uint8Array):string|null{
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'jpg';
 if(bytes.length>=8&&[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((v,i)=>bytes[i]===v))return 'png';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'webp';
 if(bytes.length>=6&&['GIF87a','GIF89a'].includes(String.fromCharCode(...bytes.slice(0,6))))return 'gif';
 return null;
}
export async function POST(request:NextRequest,{params}:Ctx){
 const {token}=await params;
 if(!/^[a-f0-9-]{60,80}$/i.test(token))return NextResponse.json({error:'This link is invalid or expired'},{status:410});
 const limit=await enforceRateLimit(request,'spotlight-submission-upload',10,60*60);if(!limit.allowed)return limit.response!;
 const db=getSupabaseAdmin() as any;
 const {data:link}=await db.from('spotlight_submission_links').select('id,expires_at,used_at').eq('token_hash',await hash(token)).maybeSingle();
 if(!link||link.used_at||new Date(link.expires_at).getTime()<Date.now())return NextResponse.json({error:'This link is invalid or expired'},{status:410});
 const form=await request.formData(),file=form.get('file');
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024)return NextResponse.json({error:'Choose an image up to 10MB'},{status:400});
 const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'},ext=types[file.type];
 if(!ext)return NextResponse.json({error:'Only JPEG, PNG, WebP and GIF images are allowed'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());if(detectImageFormat(bytes)!==ext)return NextResponse.json({error:'The file content does not match a supported image type'},{status:400});
 const path='images/'+crypto.randomUUID()+'.'+ext;
 const {error}=await db.storage.from('campus-radar-media').upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
 if(error)return NextResponse.json({error:'Image upload failed'},{status:502});
 const {data}=db.storage.from('campus-radar-media').getPublicUrl(path);
 return NextResponse.json({imageUrl:data.publicUrl});
}