import {NextRequest,NextResponse} from 'next/server';
import {getSupabaseAdmin} from '@/lib/server/supabase';
async function hash(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
type Ctx={params:Promise<{token:string}>};
export async function POST(request:NextRequest,{params}:Ctx){
 const {token}=await params;const db=getSupabaseAdmin() as any;
 const {data:link}=await db.from('spotlight_submission_links').select('id,expires_at,used_at').eq('token_hash',await hash(token)).maybeSingle();
 if(!link||link.used_at||new Date(link.expires_at).getTime()<Date.now())return NextResponse.json({error:'This link is invalid or expired'},{status:410});
 const form=await request.formData(),file=form.get('file');
 if(!(file instanceof File)||!file.size||file.size>10*1024*1024)return NextResponse.json({error:'Choose an image up to 10MB'},{status:400});
 const types:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'},ext=types[file.type];
 if(!ext)return NextResponse.json({error:'Only JPEG, PNG, WebP and GIF images are allowed'},{status:400});
 const path='images/'+crypto.randomUUID()+'.'+ext;
 const {error}=await db.storage.from('campus-radar-media').upload(path,file,{contentType:file.type,cacheControl:'31536000',upsert:false});
 if(error)return NextResponse.json({error:'Image upload failed'},{status:502});
 const {data}=db.storage.from('campus-radar-media').getPublicUrl(path);
 return NextResponse.json({imageUrl:data.publicUrl});
}